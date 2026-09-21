import { NextResponse } from "next/server";
import { stripe } from "@/lib/payments";
import { markOrderPaidByPaymentIntent } from "@/server/services/checkout.service";
import { sendOrderConfirmationEmail } from "@/emails/send";
import { prisma } from "@/db/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing webhook signature or secret" },
      { status: 400 }
    );
  }

  const payload = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as { id: string };
    try {
      const order = await markOrderPaidByPaymentIntent(intent.id);
      if (order) {
        const full = await prisma.order.findUnique({
          where: { id: order.id },
          include: { items: true },
        });
        if (full) {
          await sendOrderConfirmationEmail({
            to: full.email,
            orderNumber: full.orderNumber,
            total: Number(full.total),
            items: full.items.map((item) => ({
              productName: item.productName,
              quantity: item.quantity,
              howToUse: item.howToUse,
            })),
          });
        }
      }
    } catch (err) {
      console.error("[stripe:webhook] failed to mark paid", err);
      return NextResponse.json(
        { error: "Failed to fulfill payment" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
