"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  computeCartTotals,
  createOrderFromCheckout,
} from "@/server/services/checkout.service";
import {
  attachOrderToPaymentIntent,
  createPaymentIntent,
} from "@/lib/payments";
import { sendOrderConfirmationEmail } from "@/emails/send";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";
import {
  isOfflinePayment,
  isPaymentAllowed,
  PAYMENT_METHODS,
  SHIPPING_METHODS,
} from "@/lib/checkout-options";

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
    return { ok: true as const, totals };
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

  if (
    isOfflinePayment(data.paymentMethod) &&
    !data.phone?.trim()
  ) {
    return {
      ok: false as const,
      error: "Phone number is required for this payment method.",
    };
  }

  // Courier / pickup always needs a reachable phone in GR retail.
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
    const payment = useCard
      ? await createPaymentIntent(totals.total, { email: data.email })
      : null;

    const markPaid = Boolean(payment?.mock);
    // Offline methods reserve stock immediately; Stripe waits for webhook (or mock).
    const commitStock = !useCard || markPaid;

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
      paymentProviderId: payment?.paymentIntentId,
      markPaid,
      commitStock,
    });

    if (useCard && payment && !payment.mock) {
      await attachOrderToPaymentIntent(
        payment.paymentIntentId,
        order.id,
        order.orderNumber
      );
    } else {
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
    }

    return {
      ok: true as const,
      orderId: order.id,
      orderNumber: order.orderNumber,
      clientSecret: payment?.clientSecret ?? null,
      mock: payment?.mock ?? true,
      paymentMethod: data.paymentMethod,
    };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Checkout failed.",
    };
  }
}
