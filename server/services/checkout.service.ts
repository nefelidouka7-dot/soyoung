import {
  COD_FEE,
  shippingFeeFor,
  STORE_PICKUP,
  type PaymentMethod,
  type ShippingMethod,
} from "@/lib/checkout-options";
import type { Coupon } from "@prisma/client";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/utils";
import { prisma } from "@/db/prisma";

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
};

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
    };
  }

  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: "ACTIVE" },
    include: {
      brand: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: true,
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: ComputedTotals["lines"] = [];

  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) throw new Error("One or more products are unavailable.");
    const variant = item.variantId
      ? product.variants.find((v) => v.id === item.variantId)
      : null;
    if (item.variantId && !variant) {
      throw new Error("Selected variant is unavailable.");
    }
    const stock = variant?.stock ?? product.stock;
    if (item.quantity < 1 || item.quantity > stock) {
      throw new Error(`Insufficient stock for ${product.name}.`);
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
      totalPrice: unitPrice * item.quantity,
      stock,
    });
  }

  const subtotal = lines.reduce((n, l) => n + l.totalPrice, 0);
  let coupon: Coupon | null = null;
  let discountAmount = 0;

  if (couponCode) {
    coupon = await prisma.coupon.findFirst({
      where: {
        code: couponCode.toUpperCase(),
        active: true,
      },
    });
    if (coupon) {
      const now = new Date();
      if (coupon.startsAt && coupon.startsAt > now) coupon = null;
      if (coupon?.expiresAt && coupon.expiresAt < now) coupon = null;
      if (coupon?.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
        coupon = null;
      }
      if (
        coupon?.minOrderAmount &&
        subtotal < Number(coupon.minOrderAmount)
      ) {
        coupon = null;
      }
    }
    if (coupon) {
      if (coupon.type === "PERCENTAGE") {
        discountAmount = (subtotal * Number(coupon.value)) / 100;
        if (coupon.maxDiscount) {
          discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
        }
      } else {
        discountAmount = Number(coupon.value);
      }
      discountAmount = Math.min(discountAmount, subtotal);
    }
  }

  const afterDiscount = subtotal - discountAmount;
  const shippingAmount = shippingFeeFor(
    shippingMethod,
    afterDiscount,
    FREE_SHIPPING_THRESHOLD
  );
  const paymentFee = paymentMethod === "cod" ? COD_FEE : 0;
  const total = Math.max(0, afterDiscount + shippingAmount + paymentFee);

  return {
    lines,
    subtotal,
    discountAmount,
    shippingAmount,
    paymentFee,
    total,
    coupon,
  };
}

function generateOrderNumber() {
  const n = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SY-${n}-${r}`;
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
  const totals = await computeCartTotals(input.items, input.couponCode, {
    shippingMethod: input.shippingMethod,
    paymentMethod: input.paymentMethod,
  });
  const commitStock = input.commitStock ?? Boolean(input.markPaid);

  const shipping =
    input.shippingMethod === "pickup"
      ? {
          ...input.shipping,
          line1: STORE_PICKUP.line1,
          line2: STORE_PICKUP.line2,
          city: STORE_PICKUP.city,
          postalCode: STORE_PICKUP.postalCode,
          country: STORE_PICKUP.country,
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
          where: { id: line.variantId, stock: { gte: line.quantity } },
        });
        if (!variant) {
          throw new Error(`Insufficient stock for ${line.productName}.`);
        }
      }
      const product = await tx.product.findFirst({
        where: { id: line.productId, stock: { gte: line.quantity } },
      });
      if (!product) {
        throw new Error(`Insufficient stock for ${line.productName}.`);
      }

      if (commitStock) {
        if (line.variantId) {
          const updated = await tx.productVariant.updateMany({
            where: { id: line.variantId, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });
          if (updated.count === 0) {
            throw new Error(`Insufficient stock for ${line.productName}.`);
          }
        }
        const updated = await tx.product.updateMany({
          where: { id: line.productId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (updated.count === 0) {
          throw new Error(`Insufficient stock for ${line.productName}.`);
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

    if (totals.coupon && commitStock) {
      await tx.coupon.update({
        where: { id: totals.coupon.id },
        data: { usageCount: { increment: 1 } },
      });
    }

    const status = input.markPaid ? "PAID" : "PENDING";
    const paymentStatus = input.markPaid ? "PAID" : "PENDING";

    const notesParts = [
      fulfillmentLabel,
      paymentLabel,
      totals.paymentFee > 0 ? `COD fee €${totals.paymentFee.toFixed(2)}` : null,
    ].filter(Boolean);

    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
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

export async function markOrderPaidByProviderId(
  providerPaymentId: string,
  options?: { transactionId?: string; note?: string }
) {
  const payment = await prisma.payment.findFirst({
    where: { providerPaymentId },
    include: { order: { include: { items: true } } },
  });
  if (!payment) return null;
  if (payment.order.paymentStatus === "PAID") return payment.order;

  const order = await prisma.$transaction(async (tx) => {
    for (const line of payment.order.items) {
      if (!line.productId) continue;
      if (line.variantId) {
        const updated = await tx.productVariant.updateMany({
          where: { id: line.variantId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (updated.count === 0) {
          throw new Error(`Insufficient stock for ${line.productName}.`);
        }
      }
      const updated = await tx.product.updateMany({
        where: { id: line.productId, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      });
      if (updated.count === 0) {
        throw new Error(`Insufficient stock for ${line.productName}.`);
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

    if (payment.order.couponCode) {
      await tx.coupon.updateMany({
        where: { code: payment.order.couponCode },
        data: { usageCount: { increment: 1 } },
      });
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "PAID" },
    });
    const updated = await tx.order.update({
      where: { id: payment.orderId },
      data: {
        status: "PAID",
        paymentStatus: "PAID",
        paidAt: new Date(),
      },
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
    return updated;
  });

  return order;
}

/** @deprecated use markOrderPaidByProviderId */
export async function markOrderPaidByPaymentIntent(paymentIntentId: string) {
  return markOrderPaidByProviderId(paymentIntentId, {
    note: "Payment confirmed via Viva.com",
  });
}
