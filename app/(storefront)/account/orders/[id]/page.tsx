import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/db/prisma";
import { formatPrice } from "@/lib/utils";
import { interpolate } from "@/lib/i18n";
import { getLocale, getServerDictionary } from "@/lib/i18n/server";
import {
  OrderStatusBadge,
  orderStatusLabel,
} from "@/features/account/components/order-status";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  const [dict, locale, order] = await Promise.all([
    getServerDictionary(),
    getLocale(),
    prisma.order.findFirst({
      where: { id, userId: session.user.id },
      include: {
        items: true,
        timeline: { orderBy: { createdAt: "asc" } },
      },
    }),
  ]);

  if (!order) notFound();

  const dateLocale = locale === "el" ? "el-GR" : "en-GB";

  return (
    <div>
      <Link
        href="/account/orders"
        className="text-[11px] uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink"
      >
        ← {dict.account.backToOrders}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h2 className="font-serif text-2xl text-ink sm:text-[1.75rem]">
          {order.orderNumber}
        </h2>
        <OrderStatusBadge
          status={order.status}
          label={orderStatusLabel(dict, order.status)}
        />
      </div>
      <p className="mt-2 text-sm text-ink-muted">
        {interpolate(dict.account.orderPlaced, {
          date: order.createdAt.toLocaleDateString(dateLocale),
        })}
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <h3 className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
            {dict.account.products}
          </h3>
          <ul className="mt-4 divide-y divide-oak/30 border-y border-oak/30">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between gap-4 py-3.5 text-sm"
              >
                <span className="text-ink">
                  {item.productName}
                  {item.variantName ? ` — ${item.variantName}` : ""}
                  <span className="text-ink-muted"> × {item.quantity}</span>
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatPrice(Number(item.totalPrice))}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between text-ink-muted">
              <dt>{dict.account.subtotal}</dt>
              <dd className="tabular-nums text-ink">
                {formatPrice(Number(order.subtotal))}
              </dd>
            </div>
            <div className="flex justify-between text-ink-muted">
              <dt>{dict.account.shippingFee}</dt>
              <dd className="tabular-nums text-ink">
                {formatPrice(Number(order.shippingAmount))}
              </dd>
            </div>
            {Number(order.discountAmount) > 0 ? (
              <div className="flex justify-between text-ink-muted">
                <dt>{dict.account.discount}</dt>
                <dd className="tabular-nums text-ink">
                  −{formatPrice(Number(order.discountAmount))}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-oak/30 pt-3 font-medium text-ink">
              <dt>{dict.account.total}</dt>
              <dd className="tabular-nums">
                {formatPrice(Number(order.total))}
              </dd>
            </div>
          </dl>
        </div>

        <div className="space-y-10">
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
              {dict.account.shipping}
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              <span className="text-ink">
                {order.shippingName}
              </span>
              <br />
              {order.shippingLine1}
              <br />
              {order.shippingLine2 ? (
                <>
                  {order.shippingLine2}
                  <br />
                </>
              ) : null}
              {order.shippingPostal} {order.shippingCity}
              <br />
              {order.shippingCountry}
            </p>
          </div>

          {order.timeline.length > 0 ? (
            <div>
              <h3 className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                {dict.account.timeline}
              </h3>
              <ol className="mt-4 space-y-3 border-l border-oak/40 pl-4">
                {order.timeline.map((t) => (
                  <li key={t.id} className="relative text-sm">
                    <span className="absolute -left-[1.3rem] top-1.5 h-2 w-2 rounded-full bg-oak" />
                    <span className="text-ink">
                      {orderStatusLabel(dict, t.status)}
                    </span>
                    <span className="text-ink-muted">
                      {" · "}
                      {t.createdAt.toLocaleString(dateLocale)}
                    </span>
                    {t.note ? (
                      <p className="mt-0.5 text-ink-muted">{t.note}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
