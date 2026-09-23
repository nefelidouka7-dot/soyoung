"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  computeCartTotals,
  createOrderFromCheckout,
} from "@/server/services/checkout.service";
import { createPaymentOrder } from "@/lib/payments";
import { sendOrderConfirmationEmail } from "@/emails/send";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";
import {
  isOfflinePayment,
  isPaymentAllowed,
  PAYMENT_METHODS,
  SHIPPING_METHODS,
} from "@/lib/checkout-options";
import { prisma } from "@/db/prisma";
import { getLocale } from "@/lib/i18n/server";

const lineSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable().optional(),
  quantity: z.number().int().positive(),
});

const checkoutSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  line1: z.string().optional(),
  line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  couponCode: z.string().optional(),
  shippingMethod: z.enum(SHIPPING_METHODS),
  paymentMethod: z.enum(PAYMENT_METHODS),
  items: z.array(lineSchema).min(1),
});

export async function validateCheckoutTotals(input: {
  items: z.infer<typeof lineSchema>[];
  couponCode?: string;
  shippingMethod?: z.infer<typeof checkoutSchema>["shippingMethod"];
  paymentMethod?: z.infer<typeof checkoutSchema>["paymentMethod"];
}) {
  try {
    const totals = await computeCartTotals(input.items, input.couponCode, {
      shippingMethod: input.shippingMethod,
      paymentMethod: input.paymentMethod,
    });
    return {
      ok: true as const,
      totals: {
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        shippingAmount: totals.shippingAmount,
        paymentFee: totals.paymentFee,
        total: totals.total,
        couponCode: totals.coupon?.code ?? null,
        couponRejection: totals.couponRejection,
      },
    };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Unable to calculate totals.",
    };
  }
}

export async function placeOrderAction(raw: unknown) {
  const h = await headers();
  const ip = clientIpFromHeaders(h);
  const limited = rateLimit(`checkout:${ip}`, 8, 60_000);
  if (!limited.ok) {
    return {
      ok: false as const,
      error: "Too many checkout attempts. Please wait a moment.",
    };
  }

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: "Please complete all required fields." };
  }

  const session = await auth();
  const data = parsed.data;
  const locale = await getLocale();

  if (!isPaymentAllowed(data.shippingMethod, data.paymentMethod)) {
    return {
      ok: false as const,
      error: "Selected payment method is not available for this delivery option.",
    };
  }

  if (data.shippingMethod === "delivery") {
    if (!data.line1 || !data.city || !data.postalCode || !data.country) {
      return {
        ok: false as const,
        error: "Please complete your shipping address.",
      };
    }
  }

  if (isOfflinePayment(data.paymentMethod) && !data.phone?.trim()) {
    return {
      ok: false as const,
      error: "Phone number is required for this payment method.",
    };
  }

  if (!data.phone?.trim()) {
    return {
      ok: false as const,
      error: "Phone number is required.",
    };
  }

  try {
    const totals = await computeCartTotals(data.items, data.couponCode, {
      shippingMethod: data.shippingMethod,
      paymentMethod: data.paymentMethod,
    });

    const useCard = data.paymentMethod === "card";

    // Create the shop order first so we can pass orderNumber to Viva.
    const order = await createOrderFromCheckout({
      userId: session?.user?.id,
      email: data.email,
      phone: data.phone,
      items: data.items,
      couponCode: data.couponCode,
      shippingMethod: data.shippingMethod,
      paymentMethod: data.paymentMethod,
      shipping: {
        firstName: data.firstName,
        lastName: data.lastName,
        line1: data.line1 ?? "",
        line2: data.line2,
        city: data.city ?? "",
        state: data.state,
        postalCode: data.postalCode ?? "",
        country: data.country ?? "GR",
        phone: data.phone,
      },
      paymentProviderId: null,
      markPaid: !useCard,
      commitStock: !useCard,
    });

    if (!useCard) {
      await sendOrderConfirmationEmail({
        to: data.email,
        orderNumber: order.orderNumber,
        total: Number(order.total),
        items: order.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          howToUse: item.howToUse,
        })),
      });

      return {
        ok: true as const,
        orderId: order.id,
        orderNumber: order.orderNumber,
        checkoutUrl: null,
        mock: true,
        paymentMethod: data.paymentMethod,
      };
    }

    const payment = await createPaymentOrder({
      amountEur: totals.total,
      orderNumber: order.orderNumber,
      email: data.email,
      fullName: `${data.firstName} ${data.lastName}`.trim(),
      phone: data.phone,
      requestLang: locale === "en" ? "en-GB" : "el-GR",
    });

    await prisma.payment.update({
      where: { orderId: order.id },
      data: { providerPaymentId: payment.orderCode, provider: "viva" },
    });

    if (payment.mock) {
      // Dev without Viva keys: mark paid + commit stock via success path simulation.
      const { markOrderPaidByProviderId } = await import(
        "@/server/services/checkout.service"
      );
      await markOrderPaidByProviderId(payment.orderCode, {
        note: "Mock Viva payment (dev)",
      });
      await sendOrderConfirmationEmail({
        to: data.email,
        orderNumber: order.orderNumber,
        total: Number(order.total),
        items: order.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          howToUse: item.howToUse,
        })),
      });

      return {
        ok: true as const,
        orderId: order.id,
        orderNumber: order.orderNumber,
        checkoutUrl: null,
        mock: true,
        paymentMethod: data.paymentMethod,
      };
    }

    return {
      ok: true as const,
      orderId: order.id,
      orderNumber: order.orderNumber,
      checkoutUrl: payment.checkoutUrl,
      mock: false,
      paymentMethod: data.paymentMethod,
    };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Checkout failed.",
    };
  }
}
