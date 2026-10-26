import { createHash, randomBytes } from "node:crypto";
import {
  shippingFeeFor,
  type PaymentMethod,
  type ShippingMethod,
} from "@/lib/checkout-options";
import type { Coupon, Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { getStoreSettings } from "@/server/repositories/store-settings.repository";

/**
 * Round euros to cents. Totals must match the Decimal(10,2) stored on the order
 * and the integer cents charged by Viva, or paid orders fail the amount check.
 */
function roundMoney(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Opaque capability token for the checkout success page. */
function newOrderAccessToken() {
  return createHash("sha256").update(randomBytes(32)).digest("hex").slice(0, 32);
}

/** Messages from this error are safe to show to shoppers; anything else is logged only. */
export class CheckoutError extends Error {}

export type CheckoutLineInput = {
  productId: string;
  variantId?: string | null;
  quantity: number;
};

export type ComputedTotals = {
  lines: Array<{
    productId: string;
    variantId: string | null;
    productName: string;
    variantName: string | null;
    brandName: string;
    sku: string | null;
    image: string | null;
    howToUse: string | null;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    stock: number;
  }>;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  paymentFee: number;
  total: number;
  coupon: Coupon | null;
  couponRejection: {
    reason: CouponRejectReason;
    minOrderAmount?: number;
  } | null;
};

export type CouponRejectReason =
  | "not_found"
  | "inactive"
  | "not_started"
  | "expired"
  | "usage_limit"
  | "min_order";

export type CouponResolution =
  | { ok: true; coupon: Coupon; discountAmount: number }
  | {
      ok: false;
      reason: CouponRejectReason;
      minOrderAmount?: number;
    };

export type CouponLine = {
  productId: string;
  /** The product's category and its parent category. */
  categoryIds: string[];
  totalPrice: number;
};

export async function resolveCoupon(
  code: string | null | undefined,
  subtotal: number,
  lines: CouponLine[]
): Promise<CouponResolution | null> {
  const trimmed = code?.trim();
  if (!trimmed) return null;

  const coupon = await prisma.coupon.findFirst({
    where: { code: trimmed.toUpperCase() },
  });

  if (!coupon) return { ok: false, reason: "not_found" };
  if (!coupon.active) return { ok: false, reason: "inactive" };

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { ok: false, reason: "not_started" };
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { ok: false, reason: "expired" };
  }
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
    return { ok: false, reason: "usage_limit" };
  }

  const minOrder =
    coupon.minOrderAmount != null ? Number(coupon.minOrderAmount) : 0;
  if (minOrder > 0 && subtotal < minOrder) {
    return { ok: false, reason: "min_order", minOrderAmount: minOrder };
  }

  // Product/category coupons discount only the lines they apply to.
  const eligible = lines.filter(
    (l) =>
      (coupon.productIds.length === 0 ||
        coupon.productIds.includes(l.productId)) &&
      (coupon.categoryIds.length === 0 ||
        l.categoryIds.some((id) => coupon.categoryIds.includes(id)))
  );
  if (eligible.length === 0) return { ok: false, reason: "not_found" };
  const eligibleSubtotal = roundMoney(
    eligible.reduce((n, l) => n + l.totalPrice, 0)
  );

  let discountAmount = 0;
  if (coupon.type === "PERCENTAGE") {
    discountAmount = (eligibleSubtotal * Number(coupon.value)) / 100;
    if (coupon.maxDiscount) {
      discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
    }
  } else {
    discountAmount = Number(coupon.value);
  }
  discountAmount = roundMoney(
    Math.min(Math.max(0, discountAmount), eligibleSubtotal)
  );

  return { ok: true, coupon, discountAmount };
}

export async function computeCartTotals(
  items: CheckoutLineInput[],
  couponCode?: string | null,
  options?: {
    shippingMethod?: ShippingMethod;
    paymentMethod?: PaymentMethod;
  }
): Promise<ComputedTotals> {
  const shippingMethod = options?.shippingMethod ?? "delivery";
  const paymentMethod = options?.paymentMethod ?? "card";

  if (!items.length) {
    return {
      lines: [],
      subtotal: 0,
      discountAmount: 0,
      shippingAmount: 0,
      paymentFee: 0,
      total: 0,
      coupon: null,
      couponRejection: null,
    };
  }

  // Merge repeated lines so stock is checked against the real total quantity.
  const merged = new Map<string, CheckoutLineInput>();
  for (const item of items) {
    const key = `${item.productId}:${item.variantId ?? ""}`;
    const prev = merged.get(key);
    merged.set(
      key,
      prev ? { ...prev, quantity: prev.quantity + item.quantity } : { ...item }
    );
  }
  const mergedItems = [...merged.values()];

  const productIds = [...new Set(mergedItems.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: "ACTIVE" },
    include: {
      brand: true,
      category: { select: { parentId: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: true,
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: ComputedTotals["lines"] = [];
  const couponLines: CouponLine[] = [];
  const qtyByProduct = new Map<string, number>();

  for (const item of mergedItems) {
    const product = byId.get(item.productId);
    if (!product) throw new CheckoutError("One or more products are unavailable.");
    const variant = item.variantId
      ? product.variants.find((v) => v.id === item.variantId && v.active)
      : null;
    if (item.variantId && !variant) {
      throw new CheckoutError("Selected variant is unavailable.");
    }
    const stock = variant?.stock ?? product.stock;
    // Variant sales also draw down the parent product's stock.
    const productQty = (qtyByProduct.get(product.id) ?? 0) + item.quantity;
    qtyByProduct.set(product.id, productQty);
    if (item.quantity < 1 || item.quantity > stock || productQty > product.stock) {
      throw new CheckoutError(`Insufficient stock for ${product.name}.`);
    }
    const unitPrice = Number(variant?.price ?? product.price);
    lines.push({
      productId: product.id,
      variantId: variant?.id ?? null,
      productName: product.name,
      variantName: variant?.name ?? null,
      brandName: product.brand.name,
      sku: variant?.sku ?? product.sku,
      image: variant?.image ?? product.images[0]?.url ?? null,
      howToUse: product.howToUse ?? null,
      unitPrice,
      quantity: item.quantity,
      totalPrice: roundMoney(unitPrice * item.quantity),
      stock,
    });
    couponLines.push({
      productId: product.id,
      categoryIds: [product.categoryId, product.category.parentId].filter(
        (id): id is string => Boolean(id)
      ),
      totalPrice: roundMoney(unitPrice * item.quantity),
    });
  }

  const subtotal = roundMoney(lines.reduce((n, l) => n + l.totalPrice, 0));
  let coupon: Coupon | null = null;
  let discountAmount = 0;
  let couponRejection: ComputedTotals["couponRejection"] = null;

  const resolved = await resolveCoupon(couponCode, subtotal, couponLines);
  if (resolved?.ok) {
    coupon = resolved.coupon;
    discountAmount = resolved.discountAmount;
  } else if (resolved) {
    couponRejection = {
      reason: resolved.reason,
      minOrderAmount: resolved.minOrderAmount,
    };
  }

  const store = await getStoreSettings();
  const afterDiscount = roundMoney(subtotal - discountAmount);
  const shippingAmount = shippingFeeFor(
    shippingMethod,
    afterDiscount,
    store.freeShippingThreshold,
    store.standardShippingFee
  );
  const paymentFee = paymentMethod === "cod" ? store.codFee : 0;
  const total = roundMoney(
    Math.max(0, afterDiscount + shippingAmount + paymentFee)
  );

  return {
    lines,
    subtotal,
    discountAmount,
    shippingAmount,
    paymentFee,
    total,
    coupon,
    couponRejection,
  };
}

/** Short sequential numbers (SY-1001) — easy to say, type, and search. */
async function allocateOrderNumber(tx: Prisma.TransactionClient) {
  const count = await tx.order.count();
  const n = 1001 + count;

  for (let i = 0; i < 50; i++) {
    const orderNumber = `SY-${n + i}`;
    const exists = await tx.order.findUnique({
      where: { orderNumber },
      select: { id: true },
    });
    if (!exists) return orderNumber;
  }

  // Extremely unlikely fallback if the range above is exhausted.
  return `SY-${Date.now().toString().slice(-8)}`;
}

export async function createOrderFromCheckout(input: {
  userId?: string | null;
  email: string;
  phone?: string;
  items: CheckoutLineInput[];
  couponCode?: string | null;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  shipping: {
    firstName: string;
    lastName: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  paymentProviderId?: string | null;
  markPaid?: boolean;
  /** When false, order is created without decrementing stock (card pending Viva). */
  commitStock?: boolean;
}) {
  const [totals, store] = await Promise.all([
    computeCartTotals(input.items, input.couponCode, {
      shippingMethod: input.shippingMethod,
      paymentMethod: input.paymentMethod,
    }),
    getStoreSettings(),
  ]);
  const commitStock = input.commitStock ?? Boolean(input.markPaid);

  const shipping =
    input.shippingMethod === "pickup"
      ? {
          ...input.shipping,
          line1: store.pickup.line1,
          line2: store.pickup.line2 ?? undefined,
          city: store.pickup.city,
          postalCode: store.pickup.postalCode,
          country: store.pickup.country,
        }
      : input.shipping;

  const paymentProvider =
    input.paymentMethod === "card" ? "viva" : "offline";

    const fulfillmentLabel =
    input.shippingMethod === "pickup" ? "Store pickup" : "Courier delivery";

  const paymentLabel =
    input.paymentMethod === "cod" ? "Cash on delivery" : "Card payment";

  return prisma.$transaction(async (tx) => {
    for (const line of totals.lines) {
      if (line.variantId) {
        const variant = await tx.productVariant.findFirst({
          where: {
            id: line.variantId,
            active: true,
            stock: { gte: line.quantity },
          },
        });
        if (!variant) {
          throw new CheckoutError(`Insufficient stock for ${line.productName}.`);
        }
      }
      const product = await tx.product.findFirst({
        where: { id: line.productId, stock: { gte: line.quantity } },
      });
      if (!product) {
        throw new CheckoutError(`Insufficient stock for ${line.productName}.`);
      }

      if (commitStock) {
        if (line.variantId) {
          const updated = await tx.productVariant.updateMany({
            where: {
              id: line.variantId,
              active: true,
              stock: { gte: line.quantity },
            },
            data: { stock: { decrement: line.quantity } },
          });
          if (updated.count === 0) {
            throw new CheckoutError(`Insufficient stock for ${line.productName}.`);
          }
        }
        const updated = await tx.product.updateMany({
          where: { id: line.productId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (updated.count === 0) {
          throw new CheckoutError(`Insufficient stock for ${line.productName}.`);
        }
        await tx.inventoryLedger.create({
          data: {
            productId: line.productId,
            variantId: line.variantId,
            change: -line.quantity,
            type: "SALE",
            note: input.markPaid ? "Order paid" : "Order placement",
          },
        });
      }
    }

    // Reserve the coupon use now (card orders included) with an atomic guard,
    // so parallel checkouts can't exceed usageLimit. Released on cancellation.
    if (totals.coupon) {
      const reserved = await tx.$executeRaw`
        UPDATE "Coupon" SET "usageCount" = "usageCount" + 1, "updatedAt" = NOW()
        WHERE "id" = ${totals.coupon.id}
          AND ("usageLimit" IS NULL OR "usageCount" < "usageLimit")`;
      if (reserved === 0) {
        throw new CheckoutError("This coupon has reached its usage limit.");
      }
    }

    const status = input.markPaid ? "PAID" : "PENDING";
    const paymentStatus = input.markPaid ? "PAID" : "PENDING";

    const notesParts = [
      fulfillmentLabel,
      paymentLabel,
      totals.paymentFee > 0 ? `COD fee €${totals.paymentFee.toFixed(2)}` : null,
    ].filter(Boolean);

    const orderNumber = await allocateOrderNumber(tx);

    const order = await tx.order.create({
      data: {
        orderNumber,
        accessToken: newOrderAccessToken(),
        ...(input.userId
          ? { user: { connect: { id: input.userId } } }
          : {}),
        email: input.email.toLowerCase(),
        phone: input.phone ?? shipping.phone,
        status,
        paymentStatus,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        shippingAmount: totals.shippingAmount + totals.paymentFee,
        total: totals.total,
        couponCode: totals.coupon?.code ?? null,
        shippingMethod: input.shippingMethod,
        shippingName: `${shipping.firstName} ${shipping.lastName}`,
        shippingLine1: shipping.line1,
        shippingLine2: shipping.line2 || null,
        shippingCity: shipping.city,
        ...(shipping.state ? { shippingState: shipping.state } : {}),
        shippingPostal: shipping.postalCode,
        shippingCountry: shipping.country,
        shippingPhone: shipping.phone,
        notes: notesParts.join(" · "),
        paidAt: input.markPaid ? new Date() : null,
        items: {
          create: totals.lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            productName: l.productName,
            variantName: l.variantName,
            sku: l.sku,
            brandName: l.brandName,
            image: l.image,
            howToUse: l.howToUse,
            unitPrice: l.unitPrice,
            quantity: l.quantity,
            totalPrice: l.totalPrice,
          })),
        },
        payment: {
          create: {
            provider: paymentProvider,
            ...(input.paymentProviderId
              ? { providerPaymentId: input.paymentProviderId }
              : {}),
            status: paymentStatus,
            amount: totals.total,
            method: input.paymentMethod,
          },
        },
        timeline: {
          create: [
            { status: "PENDING", note: "Order placed" },
            ...(input.markPaid
              ? [{ status: "PAID" as const, note: "Payment confirmed" }]
              : []),
          ],
        },
      },
      include: { items: true },
    });

    return order;
  });
}

/**
 * Mark a card order paid and commit its stock. Idempotent: the webhook, the
 * success page and Viva retries may all call this — only the first call
 * returns `newlyPaid: true` (use that to send the confirmation email once).
 */
export async function markOrderPaidByProviderId(
  providerPaymentId: string,
  options?: { transactionId?: string; note?: string }
) {
  const payment = await prisma.payment.findFirst({
    where: { providerPaymentId },
    include: { order: { include: { items: true } } },
  });
  if (!payment) return null;

  return prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: payment.orderId, paymentStatus: { not: "PAID" } },
      data: { status: "PAID", paymentStatus: "PAID", paidAt: new Date() },
    });
    if (claimed.count === 0) {
      const order = await tx.order.findUniqueOrThrow({
        where: { id: payment.orderId },
      });
      return { order, newlyPaid: false };
    }

    // The customer has already been charged: never fail here. Lines we can't
    // fulfil are flagged for a refund/restock instead of rolling back.
    const shortages: string[] = [];
    for (const line of payment.order.items) {
      if (!line.productId) continue;
      const product = await tx.product.updateMany({
        where: { id: line.productId, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      });
      if (product.count === 0) {
        shortages.push(line.productName);
        continue;
      }
      if (line.variantId) {
        const variant = await tx.productVariant.updateMany({
          where: { id: line.variantId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (variant.count === 0) {
          await tx.product.update({
            where: { id: line.productId },
            data: { stock: { increment: line.quantity } },
          });
          shortages.push(line.productName);
          continue;
        }
      }
      await tx.inventoryLedger.create({
        data: {
          productId: line.productId,
          variantId: line.variantId,
          change: -line.quantity,
          type: "SALE",
          note: "Payment confirmed",
        },
      });
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "PAID" },
    });
    await tx.orderTimeline.create({
      data: {
        orderId: payment.orderId,
        status: "PAID",
        note:
          options?.note ??
          (options?.transactionId
            ? `Payment confirmed via Viva.com (${options.transactionId})`
            : "Payment confirmed via Viva.com"),
      },
    });
    if (shortages.length > 0) {
      const warning = `Stock shortage, refund or restock needed: ${shortages.join(", ")}`;
      console.error("[checkout] paid order short on stock", {
        orderId: payment.orderId,
        shortages,
      });
      await tx.orderTimeline.create({
        data: { orderId: payment.orderId, status: "PAID", note: warning },
      });
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          notes: [payment.order.notes, `⚠ ${warning}`].filter(Boolean).join(" · "),
        },
      });
    }

    const order = await tx.order.findUniqueOrThrow({
      where: { id: payment.orderId },
    });
    return { order, newlyPaid: true };
  });
}

/**
 * Cancelling an order returns what it was holding: committed stock (COD orders,
 * or card orders that were paid) and the reserved coupon use. Idempotent.
 */
export async function cancelOrderAndRelease(orderId: string, note: string | null) {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: orderId, status: { notIn: ["CANCELLED", "REFUNDED"] } },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    if (claimed.count === 0) return false;

    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true, payment: true },
    });
    const stockCommitted =
      order.payment?.method === "cod" || order.paymentStatus === "PAID";

    if (stockCommitted) {
      for (const line of order.items) {
        if (!line.productId) continue;
        await tx.product.updateMany({
          where: { id: line.productId },
          data: { stock: { increment: line.quantity } },
        });
        if (line.variantId) {
          await tx.productVariant.updateMany({
            where: { id: line.variantId },
            data: { stock: { increment: line.quantity } },
          });
        }
        await tx.inventoryLedger.create({
          data: {
            productId: line.productId,
            variantId: line.variantId,
            change: line.quantity,
            type: "RETURN",
            note: `Order ${order.orderNumber} cancelled`,
          },
        });
      }
    }

    if (order.couponCode) {
      await tx.coupon.updateMany({
        where: { code: order.couponCode, usageCount: { gt: 0 } },
        data: { usageCount: { decrement: 1 } },
      });
    }

    await tx.orderTimeline.create({
      data: { orderId, status: "CANCELLED", note },
    });
    return true;
  });
}

/** @deprecated use markOrderPaidByProviderId */
export async function markOrderPaidByPaymentIntent(paymentIntentId: string) {
  return markOrderPaidByProviderId(paymentIntentId, {
    note: "Payment confirmed via Viva.com",
  });
}
