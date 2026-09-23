import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/db/prisma";
import { formatPrice } from "@/lib/utils";
import { interpolate } from "@/lib/i18n";
import { getLocale, getServerDictionary } from "@/lib/i18n/server";
import {
  OrderStatusBadge,
  orderStatusLabel,
} from "@/features/account/components/order-status";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");

  const [dict, locale, orders] = await Promise.all([
    getServerDictionary(),
    getLocale(),
    prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const dateLocale = locale === "el" ? "el-GR" : "en-GB";

  return (
    <div>
      <div>
        <h2 className="font-serif text-2xl text-ink sm:text-[1.75rem]">
          {dict.account.overview}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
          {dict.account.overviewHint}
        </p>
      </div>

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
            {dict.account.recentOrders}
          </h3>
          {orders.length > 0 ? (
            <Link
              href="/account/orders"
              className="text-[11px] uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink"
            >
              {dict.account.viewAllOrders}
            </Link>
          ) : null}
        </div>

        {orders.length === 0 ? (
          <div className="mt-5 border-t border-oak/35 pt-6">
            <p className="text-sm text-ink-muted">{dict.account.noOrders}</p>
            <Link
              href="/skincare"
              className="mt-4 inline-flex items-center gap-1 text-sm text-ink underline-offset-4 hover:underline"
            >
              {dict.account.startShopping}
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-oak/30 border-y border-oak/30">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/account/orders/${o.id}`}
                  className="flex items-center justify-between gap-4 py-4 transition-colors hover:bg-bg-muted/40"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-ink">
                        {o.orderNumber}
                      </span>
                      <OrderStatusBadge
                        status={o.status}
                        label={orderStatusLabel(dict, o.status)}
                      />
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">
                      {interpolate(dict.account.orderPlaced, {
                        date: o.createdAt.toLocaleDateString(dateLocale),
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm tabular-nums text-ink">
                      {formatPrice(Number(o.total))}
                    </span>
                    <ChevronRight
                      className="h-4 w-4 text-ink-muted"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
