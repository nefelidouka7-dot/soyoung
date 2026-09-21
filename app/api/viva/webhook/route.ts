import { NextResponse } from "next/server";
import {
  getVivaWebhookVerificationKey,
  retrieveVivaTransaction,
} from "@/lib/payments";
import { markOrderPaidByProviderId } from "@/server/services/checkout.service";
import { sendOrderConfirmationEmail } from "@/emails/send";
import { prisma } from "@/db/prisma";

export const runtime = "nodejs";

/** Viva verifies the webhook URL with a GET that must return their Key/Value JSON. */
export async function GET() {
  try {
    const key = await getVivaWebhookVerificationKey();
    return NextResponse.json(key);
  } catch (err) {
    console.error("[viva:webhook] verify key failed", err);
    return NextResponse.json(
      { error: "Webhook verification unavailable" },
      { status: 500 }
    );
  }
}

type VivaWebhookBody = {
  EventTypeId?: number;
  EventData?: {
    OrderCode?: number | string;
    TransactionId?: string;
    StatusId?: string;
    Amount?: number;
    MerchantTrns?: string;
  };
};

/**
 * Transaction Payment Created = EventTypeId 1796
 * @see https://developer.viva.com/webhooks-for-payments/transaction-payment-created/
 */
export async function POST(req: Request) {
  let body: VivaWebhookBody;
  try {
    body = (await req.json()) as VivaWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = body.EventTypeId;
  const data = body.EventData;
  if (eventType !== 1796 || !data?.TransactionId || data.OrderCode == null) {
    return NextResponse.json({ received: true });
  }

  const orderCode = String(data.OrderCode);
  const transactionId = data.TransactionId;

  try {
    const tx = await retrieveVivaTransaction(transactionId);
    if (String(tx.orderCode) !== orderCode) {
      console.error("[viva:webhook] orderCode mismatch", {
        webhook: orderCode,
        api: tx.orderCode,
      });
      return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
    }
    if (tx.statusId !== "F") {
      return NextResponse.json({ received: true, status: tx.statusId });
    }

    const order = await markOrderPaidByProviderId(orderCode, {
      transactionId,
      note: "Payment confirmed via Viva.com",
    });

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
    console.error("[viva:webhook] failed to mark paid", err);
    return NextResponse.json(
      { error: "Failed to fulfill payment" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
