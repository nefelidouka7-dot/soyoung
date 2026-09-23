import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/db/prisma";
import { formatPrice } from "@/lib/utils";
import { interpolate } from "@/lib/i18n";
import { getLocale, getServerDictionary } from "@/lib/i18n/server";
import { EmptyState } from "@/components/ui/empty-state";
import {
  OrderStatusBadge,
  orderStatusLabel,
} from "@/features/account/components/order-status";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/orders");

  const [dict, locale, orders] = await Promise.all([
    getServerDictionary(),
    getLocale(),
    prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
  ]);

  const dateLocale = locale === "el" ? "el-GR" : "en-GB";

  return (
    <div>
      <h2 className="font-serif text-2xl text-ink sm:text-[1.75rem]">
        {dict.account.orders}
      </h2>

      {orders.length === 0 ? (
        <EmptyState
          className="mt-4 items-start px-0 py-12 text-left"
          title={dict.account.noOrders}
          action={{ label: dict.account.startShopping, href: "/skincare" }}
        />
      ) : (
        <ul className="mt-6 divide-y divide-oak/30 border-y border-oak/30">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/account/orders/${o.id}`}
                className="flex flex-wrap items-center justify-between gap-3 py-4 transition-colors hover:bg-bg-muted/40 sm:flex-nowrap"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink">{o.orderNumber}</span>
                    <OrderStatusBadge
                      status={o.status}
                      label={orderStatusLabel(dict, o.status)}
                    />
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    {interpolate(dict.account.orderPlaced, {
                      date: o.createdAt.toLocaleDateString(dateLocale),
                    })}
                    {" · "}
                    {interpolate(dict.account.items, {
                      count: o.items.length,
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums text-ink">
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
    </div>
  );
}
