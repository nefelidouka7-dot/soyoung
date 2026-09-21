import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY;

export const stripe =
  stripeKey && stripeKey.length > 0 ? new Stripe(stripeKey) : null;

export type PaymentIntentResult = {
  clientSecret: string | null;
  paymentIntentId: string;
  mock: boolean;
};

function assertMockPaymentsAllowed() {
  const allowMock =
    process.env.ALLOW_MOCK_PAYMENTS === "true" ||
    process.env.NODE_ENV !== "production";
  if (!allowMock) {
    throw new Error(
      "Payments are not configured. Set STRIPE_SECRET_KEY (and webhook secret) in production."
    );
  }
}

/** Create a payment intent via Stripe, or a mock ID when keys are absent (dev only). */
export async function createPaymentIntent(
  amountEur: number,
  metadata: Record<string, string>
): Promise<PaymentIntentResult> {
  const amountCents = Math.round(amountEur * 100);
  if (!stripe) {
    assertMockPaymentsAllowed();
    return {
      clientSecret: null,
      paymentIntentId: `mock_pi_${Date.now()}`,
      mock: true,
    };
  }

  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "eur",
    automatic_payment_methods: { enabled: true },
    metadata,
  });

  return {
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
    mock: false,
  };
}

export async function attachOrderToPaymentIntent(
  paymentIntentId: string,
  orderId: string,
  orderNumber: string
) {
  if (!stripe || paymentIntentId.startsWith("mock_")) return;
  await stripe.paymentIntents.update(paymentIntentId, {
    metadata: { orderId, orderNumber },
  });
}
