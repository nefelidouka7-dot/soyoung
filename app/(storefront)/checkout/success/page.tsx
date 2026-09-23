import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/db/prisma";
import { STORE_PICKUP } from "@/lib/checkout-options";
import { getServerDictionary } from "@/lib/i18n/server";
import { formatPrice } from "@/lib/utils";
import {
  isVivaConfigured,
  retrieveVivaTransaction,
} from "@/lib/payments";
import { markOrderPaidByProviderId } from "@/server/services/checkout.service";
import { sendOrderConfirmationEmail } from "@/emails/send";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getServerDictionary();
  return { title: dict.checkout.success.title };
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const dict = await getServerDictionary();
  const sp = await searchParams;
  const orderNumberParam = typeof sp.order === "string" ? sp.order : null;
  // Viva Smart Checkout appends t (transaction id) + s (order code)
  const transactionId = typeof sp.t === "string" ? sp.t : null;
  const vivaOrderCode = typeof sp.s === "string" ? sp.s : null;

  let order =
    orderNumberParam
      ? await prisma.order.findUnique({
          where: { orderNumber: orderNumberParam },
          include: { payment: true, items: true },
        })
      : null;

  if (!order && vivaOrderCode) {
    const payment = await prisma.payment.findFirst({
      where: { providerPaymentId: vivaOrderCode },
      include: { order: { include: { payment: true, items: true } } },
    });
    order = payment?.order ?? null;
  }

  // Confirm payment when returning from Viva (webhook may arrive later).
  if (
    order &&
    order.paymentStatus !== "PAID" &&
    transactionId &&
    vivaOrderCode &&
    isVivaConfigured()
  ) {
    try {
      const tx = await retrieveVivaTransaction(transactionId);
      if (String(tx.orderCode) === vivaOrderCode && tx.statusId === "F") {
        const paid = await markOrderPaidByProviderId(vivaOrderCode, {
          transactionId,
          note: `Payment confirmed via Viva.com (${transactionId})`,
        });
        if (paid) {
          await sendOrderConfirmationEmail({
            to: order.email,
            orderNumber: order.orderNumber,
            total: Number(order.total),
            items: order.items.map((item) => ({
              productName: item.productName,
              quantity: item.quantity,
              howToUse: item.howToUse,
            })),
          });
          order = await prisma.order.findUnique({
            where: { id: order.id },
            include: { payment: true, items: true },
          });
        }
      }
    } catch (err) {
      console.error("[checkout:success] viva verify failed", err);
    }
  }

  const paymentMethod = order?.payment?.method ?? "card";
  const isPickup = order?.shippingMethod === "pickup";
  const orderNumber = order?.orderNumber ?? orderNumberParam;

  return (
    <div className="container-page py-16 sm:py-20">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
          {dict.checkout.success.thanks}
        </p>
        <h1 className="mt-3 font-serif text-3xl text-ink sm:text-4xl">
          {dict.checkout.success.title}
        </h1>
        {orderNumber ? (
          <p className="mt-3 text-sm text-ink-muted">
            {dict.checkout.success.orderNumber}:{" "}
            <span className="font-medium text-ink">{orderNumber}</span>
          </p>
        ) : null}
        {order ? (
          <p className="mt-1 text-sm text-ink-muted">
            {formatPrice(Number(order.total))}
          </p>
        ) : null}
        <p className="mx-auto mt-4 max-w-md text-sm text-ink-muted">
          {dict.checkout.success.emailSent}
        </p>
      </div>

      {order ? (
        <div className="mx-auto mt-10 max-w-xl border border-oak/40 bg-bg-muted p-5 text-left sm:p-6">
          <h2 className="font-serif text-xl text-ink">
            {dict.checkout.success.nextSteps}
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-ink-muted">
            {paymentMethod === "card" ? (
              <p>{dict.checkout.success.cardPaid}</p>
            ) : null}
            {paymentMethod === "cod" ? (
              <p>{dict.checkout.success.codNext}</p>
            ) : null}
            {isPickup ? (
              <p className="border-t border-oak/30 pt-3">
                {dict.checkout.success.pickupNext}
                <span className="mt-2 block text-ink">
                  {STORE_PICKUP.name} · {STORE_PICKUP.line1},{" "}
                  {STORE_PICKUP.postalCode} {STORE_PICKUP.city}
                </span>
              </p>
            ) : (
              <p className="border-t border-oak/30 pt-3">
                {dict.checkout.success.deliveryNext}
              </p>
            )}
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/account/orders"
          className="inline-flex h-11 items-center bg-sage px-6 text-xs uppercase tracking-wide font-bold text-white hover:bg-sage-dark"
        >
          {dict.checkout.success.viewOrders}
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center border border-ink/20 px-6 text-xs uppercase tracking-wide"
        >
          {dict.checkout.success.continueShopping}
        </Link>
      </div>
    </div>
  );
}
