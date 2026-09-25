import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Euro,
  Package,
  PackageX,
  Plus,
  ReceiptText,
  ShoppingBag,
  Star,
  UserPlus,
  Warehouse,
} from "lucide-react";
import { format, formatDistanceToNowStrict, startOfDay, subDays } from "date-fns";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { requireAdmin, decimalToNumber } from "@/lib/admin";
import { cn, formatPrice } from "@/lib/utils";
import {
  AdminDelta,
  AdminPanel,
  AdminStat,
  AdminTable,
  AdminTableHead,
  AdminTd,
  AdminTextLink,
  AdminTh,
  StatusBadge,
  orderStatusTone,
} from "@/features/admin/components/admin-ui";
import { RevenueChart, type RevenuePoint } from "@/features/admin/components/revenue-chart";

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

const PAID_STATUSES: OrderStatus[] = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

const STATUS_ORDER: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: "bg-amber-400",
  PAID: "bg-emerald-400",
  PROCESSING: "bg-sky-400",
  SHIPPED: "bg-indigo-400",
  DELIVERED: "bg-emerald-600",
  CANCELLED: "bg-rose-400",
  REFUNDED: "bg-stone-400",
};

function change(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / previous;
}

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function humanize(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const session = await requireAdmin();
  const { range: rangeParam } = await searchParams;
  const range: Range = RANGES.includes(Number(rangeParam) as Range)
    ? (Number(rangeParam) as Range)
    : 30;

  const now = new Date();
  const start = startOfDay(subDays(now, range - 1));
  const prevStart = subDays(start, range);

  const [
    periodOrders,
    prevPeriodOrders,
    newCustomers,
    prevNewCustomers,
    statusGroups,
    recentOrders,
    topProductGroups,
    stockCandidates,
    pendingOrderCount,
    pendingReviewCount,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: start }, status: { in: PAID_STATUSES } },
      select: { total: true, createdAt: true },
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: prevStart, lt: start },
        status: { in: PAID_STATUSES },
      },
      select: { total: true, createdAt: true },
    }),
    prisma.user.count({
      where: { role: "CUSTOMER", createdAt: { gte: start } },
    }),
    prisma.user.count({
      where: { role: "CUSTOMER", createdAt: { gte: prevStart, lt: start } },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: { gte: start } },
      _count: { _all: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 7,
      select: {
        id: true,
        orderNumber: true,
        email: true,
        shippingName: true,
        total: true,
        status: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.orderItem.groupBy({
      by: ["productName"],
      where: {
        order: { createdAt: { gte: start }, status: { in: PAID_STATUSES } },
      },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { totalPrice: "desc" } },
      take: 5,
    }),
    prisma.product.findMany({
      where: { status: { not: "ARCHIVED" } },
      select: {
        id: true,
        name: true,
        stock: true,
        lowStockThreshold: true,
        sku: true,
        images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
      },
      orderBy: { stock: "asc" },
      take: 50,
    }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.review.count({ where: { status: "PENDING" } }),
  ]);

  const topProductImages = topProductGroups.length
    ? await prisma.orderItem.findMany({
        where: {
          productName: { in: topProductGroups.map((p) => p.productName) },
          image: { not: null },
        },
        distinct: ["productName"],
        select: { productName: true, image: true, brandName: true },
      })
    : [];
  const productMeta = new Map(topProductImages.map((p) => [p.productName, p]));

  const lowStock = stockCandidates.filter((p) => p.stock <= p.lowStockThreshold);
  const outOfStockCount = lowStock.filter((p) => p.stock <= 0).length;

  const sumTotals = (rows: { total: { toString(): string } }[]) =>
    rows.reduce((s, o) => s + decimalToNumber(o.total), 0);

  const revenue = sumTotals(periodOrders);
  const prevRevenue = sumTotals(prevPeriodOrders);
  const orderCount = periodOrders.length;
  const prevOrderCount = prevPeriodOrders.length;
  const aov = orderCount ? revenue / orderCount : 0;
  const prevAov = prevOrderCount ? prevRevenue / prevOrderCount : 0;

  const dayKey = (d: Date) => format(d, "yyyy-MM-dd");
  const buckets = new Map<string, { value: number; orders: number }>();
  const prevBuckets = new Map<string, number>();
  for (const o of periodOrders) {
    const k = dayKey(o.createdAt);
    const b = buckets.get(k) ?? { value: 0, orders: 0 };
    b.value += decimalToNumber(o.total);
    b.orders += 1;
    buckets.set(k, b);
  }
  for (const o of prevPeriodOrders) {
    const k = dayKey(o.createdAt);
    prevBuckets.set(k, (prevBuckets.get(k) ?? 0) + decimalToNumber(o.total));
  }
  const chartPoints: RevenuePoint[] = Array.from({ length: range }, (_, i) => {
    const day = subDays(now, range - 1 - i);
    const b = buckets.get(dayKey(day));
    return {
      label: format(day, range === 7 ? "EEE" : "d MMM"),
      fullLabel: format(day, "EEE, d MMM"),
      value: b?.value ?? 0,
      orders: b?.orders ?? 0,
      previous: prevBuckets.get(dayKey(subDays(day, range))) ?? 0,
    };
  });

  const statusCounts = STATUS_ORDER.map((status) => ({
    status,
    count: statusGroups.find((g) => g.status === status)?._count._all ?? 0,
  }));
  const statusTotal = statusCounts.reduce((s, c) => s + c.count, 0);
  const topRevenueMax = Math.max(
    ...topProductGroups.map((p) => decimalToNumber(p._sum.totalPrice)),
    1
  );

  const tasks = [
    {
      href: "/admin/orders?status=PENDING",
      icon: ClipboardList,
      label: "Orders to fulfil",
      count: pendingOrderCount,
      tone: "amber",
    },
    {
      href: "/admin/inventory",
      icon: Warehouse,
      label: "Low stock products",
      count: lowStock.length - outOfStockCount,
      tone: "amber",
    },
    {
      href: "/admin/inventory",
      icon: PackageX,
      label: "Out of stock",
      count: outOfStockCount,
      tone: "rose",
    },
    {
      href: "/admin/reviews?status=PENDING",
      icon: Star,
      label: "Reviews to moderate",
      count: pendingReviewCount,
      tone: "sky",
    },
  ] as const;
  const openTasks = tasks.reduce((s, t) => s + t.count, 0);

  const name = session.user.name?.split(" ")[0];
  const rangeLabel = `last ${range} days`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-2">
        <div>
          <p className="text-[13px] font-medium text-ink-muted">
            {format(now, "EEEE, d MMMM yyyy")}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink md:text-[1.7rem]">
            {greeting(now.getHours())}
            {name ? `, ${name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {openTasks > 0
              ? `You have ${openTasks} open task${openTasks === 1 ? "" : "s"} across orders, stock and reviews.`
              : "Everything is up to date. Here's how the store is performing."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav
            aria-label="Date range"
            className="inline-flex rounded-lg border border-ink/[0.08] bg-white p-0.5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
          >
            {RANGES.map((r) => (
              <Link
                key={r}
                href={r === 30 ? "/admin" : `/admin?range=${r}`}
                aria-current={r === range ? "page" : undefined}
                scroll={false}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                  r === range
                    ? "bg-ink text-white shadow-sm"
                    : "text-ink-muted hover:bg-ink/[0.04] hover:text-ink"
                )}
              >
                {r}d
              </Link>
            ))}
          </nav>
          <Link
            href="/admin/products/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink px-3.5 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(28,25,23,0.2)] transition-colors hover:bg-ink/90"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New product
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStat
          label="Revenue"
          value={formatPrice(revenue)}
          icon={Euro}
          delta={change(revenue, prevRevenue)}
          hint={`vs previous ${range} days`}
          href="/admin/orders"
        />
        <AdminStat
          label="Orders"
          value={String(orderCount)}
          icon={ShoppingBag}
          delta={change(orderCount, prevOrderCount)}
          hint={`vs previous ${range} days`}
          href="/admin/orders"
        />
        <AdminStat
          label="Average order value"
          value={formatPrice(aov)}
          icon={ReceiptText}
          delta={change(aov, prevAov)}
          hint={`vs previous ${range} days`}
        />
        <AdminStat
          label="New customers"
          value={String(newCustomers)}
          icon={UserPlus}
          delta={change(newCustomers, prevNewCustomers)}
          hint={`vs previous ${range} days`}
          href="/admin/customers"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <AdminPanel className="xl:col-span-2" title="Revenue" description={`Paid orders, ${rangeLabel}`}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <p className="text-3xl font-semibold tracking-tight tabular-nums text-ink">
                {formatPrice(revenue)}
              </p>
              <AdminDelta value={change(revenue, prevRevenue)} />
            </div>
            <div className="flex items-center gap-4 text-xs text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full bg-coral-dark" aria-hidden />
                This period
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-4 border-t-[1.5px] border-dashed border-ink/30" aria-hidden />
                Previous period
              </span>
            </div>
          </div>
          <RevenueChart points={chartPoints} />
        </AdminPanel>

        <AdminPanel title="Needs attention" description="Tasks waiting on you">
          <ul className="-mx-2 space-y-1">
            {tasks.map((t) => {
              const Icon = t.icon;
              const done = t.count === 0;
              return (
                <li key={t.label}>
                  <Link
                    href={t.href}
                    className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-ink/[0.03]"
                  >
                    <span
                      className={cn(
                        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        done
                          ? "bg-ink/[0.04] text-ink/40"
                          : t.tone === "rose"
                            ? "bg-rose-50 text-rose-600"
                            : t.tone === "sky"
                              ? "bg-sky-50 text-sky-600"
                              : "bg-amber-50 text-amber-600"
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block text-sm font-medium",
                          done ? "text-ink-muted" : "text-ink"
                        )}
                      >
                        {t.label}
                      </span>
                      <span className="block text-xs text-ink-muted">
                        {done ? "All clear" : "Needs review"}
                      </span>
                    </span>
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <span className="text-sm font-semibold tabular-nums text-ink">
                          {t.count}
                        </span>
                        <ChevronRight
                          className="h-4 w-4 text-ink/30 transition-transform group-hover:translate-x-0.5 group-hover:text-ink/60"
                          aria-hidden
                        />
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 border-t border-ink/[0.07] pt-5">
            <div className="mb-3 flex items-baseline justify-between">
              <p className="text-[13px] font-semibold text-ink">Orders by status</p>
              <p className="text-xs tabular-nums text-ink-muted">
                {statusTotal} total
              </p>
            </div>
            <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-ink/[0.05]">
              {statusCounts
                .filter((s) => s.count > 0)
                .map((s) => (
                  <div
                    key={s.status}
                    className={cn("h-full", STATUS_COLOR[s.status])}
                    style={{ width: `${(s.count / statusTotal) * 100}%` }}
                    title={`${humanize(s.status)}: ${s.count}`}
                  />
                ))}
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {statusCounts
                .filter((s) => s.count > 0 || ["PENDING", "PAID", "SHIPPED", "DELIVERED"].includes(s.status))
                .map((s) => (
                  <li key={s.status}>
                    <Link
                      href={`/admin/orders?status=${s.status}`}
                      className="flex items-center gap-2 text-xs text-ink-muted transition-colors hover:text-ink"
                    >
                      <span className={cn("h-2 w-2 rounded-full", STATUS_COLOR[s.status])} aria-hidden />
                      <span className="flex-1">{humanize(s.status)}</span>
                      <span className="font-medium tabular-nums text-ink">{s.count}</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <AdminPanel
          className="xl:col-span-2"
          title="Recent orders"
          description="Latest activity across all statuses"
          action={<AdminTextLink href="/admin/orders">View all</AdminTextLink>}
          flush
        >
          <AdminTable bare minWidth="640px">
            <AdminTableHead>
              <tr>
                <AdminTh className="pl-5">Order</AdminTh>
                <AdminTh>Customer</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh className="pr-5 text-right">Total</AdminTh>
              </tr>
            </AdminTableHead>
            <tbody>
              {recentOrders.map((o) => {
                const customer = o.shippingName?.trim() || o.email;
                return (
                  <tr key={o.id} className="relative">
                    <AdminTd className="pl-5">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-semibold text-ink after:absolute after:inset-0 hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {formatDistanceToNowStrict(o.createdAt, { addSuffix: true })}
                        {" · "}
                        {o._count.items} item{o._count.items === 1 ? "" : "s"}
                      </p>
                    </AdminTd>
                    <AdminTd>
                      <div className="flex items-center gap-2.5">
                        <span
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/[0.06] text-xs font-semibold text-ink/70"
                          aria-hidden
                        >
                          {customer.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{customer}</p>
                          {o.shippingName ? (
                            <p className="truncate text-xs text-ink-muted">{o.email}</p>
                          ) : null}
                        </div>
                      </div>
                    </AdminTd>
                    <AdminTd>
                      <StatusBadge tone={orderStatusTone(o.status)}>{o.status}</StatusBadge>
                    </AdminTd>
                    <AdminTd className="pr-5 text-right font-semibold tabular-nums text-ink">
                      {formatPrice(decimalToNumber(o.total))}
                    </AdminTd>
                  </tr>
                );
              })}
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-sm text-ink-muted">
                    No orders yet. They&apos;ll show up here as soon as customers check out.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </AdminTable>
        </AdminPanel>

        <AdminPanel
          title="Top products"
          description={`By revenue, ${rangeLabel}`}
          action={<AdminTextLink href="/admin/products">All</AdminTextLink>}
        >
          {topProductGroups.length === 0 ? (
            <EmptyNote icon={ShoppingBag}>No sales in this period.</EmptyNote>
          ) : (
            <ul className="space-y-4">
              {topProductGroups.map((p) => {
                const meta = productMeta.get(p.productName);
                const total = decimalToNumber(p._sum.totalPrice);
                return (
                  <li key={p.productName} className="flex items-center gap-3">
                    <Thumb src={meta?.image} alt={p.productName} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-medium text-ink">{p.productName}</p>
                        <p className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                          {formatPrice(total)}
                        </p>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/[0.05]">
                          <div
                            className="h-full rounded-full bg-coral"
                            style={{ width: `${(total / topRevenueMax) * 100}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-xs tabular-nums text-ink-muted">
                          {p._sum.quantity ?? 0} sold
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminPanel>
      </div>

      <AdminPanel
        title="Inventory alerts"
        description="Products at or below their low-stock threshold"
        action={<AdminTextLink href="/admin/inventory">Manage inventory</AdminTextLink>}
      >
        {lowStock.length === 0 ? (
          <EmptyNote icon={CheckCircle2} positive>
            Stock levels look healthy.
          </EmptyNote>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {lowStock.slice(0, 8).map((p) => {
              const out = p.stock <= 0;
              const pct = Math.min(100, (p.stock / Math.max(p.lowStockThreshold, 1)) * 100);
              return (
                <li key={p.id}>
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="flex items-center gap-3 rounded-lg border border-ink/[0.07] p-3 transition-colors hover:border-ink/15 hover:bg-ink/[0.015]"
                  >
                    <Thumb src={p.images[0]?.url} alt={p.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink/[0.06]">
                          <div
                            className={cn("h-full rounded-full", out ? "bg-rose-500" : "bg-amber-400")}
                            style={{ width: `${Math.max(pct, out ? 0 : 6)}%` }}
                          />
                        </div>
                        <span
                          className={cn(
                            "shrink-0 text-xs font-medium tabular-nums",
                            out ? "text-rose-600" : "text-amber-700"
                          )}
                        >
                          {out ? "Out of stock" : `${p.stock} left`}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}

function Thumb({ src, alt }: { src?: string | null; alt: string }) {
  return (
    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink/[0.06] bg-ink/[0.03]">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-contain p-1" />
      ) : (
        <Package className="h-4 w-4 text-ink/25" aria-hidden />
      )}
    </span>
  );
}

function EmptyNote({
  icon: Icon,
  positive,
  children,
}: {
  icon: typeof ShoppingBag;
  positive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <span
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-full",
          positive ? "bg-emerald-50 text-emerald-600" : "bg-ink/[0.04] text-ink/40"
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="text-sm text-ink-muted">{children}</p>
    </div>
  );
}
