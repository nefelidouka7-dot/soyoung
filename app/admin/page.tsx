import Link from "next/link";
import { prisma } from "@/db/prisma";
import { requireAdmin, decimalToNumber, formatAdminDate } from "@/lib/admin";
import { formatPrice } from "@/lib/utils";
import {
  AdminPageHeader,
  AdminPanel,
  StatusBadge,
  orderStatusTone,
} from "@/features/admin/components/admin-ui";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const paidStatuses = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

  const [
    revenueAgg,
    orderCount,
    customerCount,
    productsSoldAgg,
    recentOrders,
    pendingOrders,
    last7Orders,
    topProductGroups,
    lowStockProducts,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { in: [...paidStatuses] } },
      _sum: { total: true },
    }),
    prisma.order.count({
      where: { status: { in: [...paidStatuses] } },
    }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.orderItem.aggregate({
      where: { order: { status: { in: [...paidStatuses] } } },
      _sum: { quantity: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        orderNumber: true,
        email: true,
        total: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.order.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        orderNumber: true,
        email: true,
        total: true,
        createdAt: true,
      },
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: { in: [...paidStatuses] },
      },
      select: { total: true, createdAt: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productName"],
      where: { order: { status: { in: [...paidStatuses] } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
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
      },
      orderBy: { stock: "asc" },
      take: 50,
    }),
  ]);

  const lowStockFiltered = lowStockProducts
    .filter((p) => p.stock <= p.lowStockThreshold)
    .slice(0, 8);

  const revenue = decimalToNumber(revenueAgg._sum.total);
  const aov = orderCount > 0 ? revenue / orderCount : 0;
  const productsSold = productsSoldAgg._sum.quantity ?? 0;

  const dayKeys: string[] = [];
  const dayTotals: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayKeys.push(key);
    dayTotals[key] = 0;
  }
  for (const order of last7Orders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    if (key in dayTotals) {
      dayTotals[key] += decimalToNumber(order.total);
    }
  }
  const maxDay = Math.max(...dayKeys.map((k) => dayTotals[k] ?? 0), 1);
  const maxTop = Math.max(
    ...topProductGroups.map((p) => p._sum.quantity ?? 0),
    1
  );

  const stats = [
    { label: "Revenue", value: formatPrice(revenue) },
    { label: "Orders", value: String(orderCount) },
    { label: "Customers", value: String(customerCount) },
    { label: "AOV", value: formatPrice(aov) },
    { label: "Products sold", value: String(productsSold) },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="Store performance at a glance."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-sm border border-oak/40 bg-white px-4 py-3"
          >
            <p className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">
              {s.label}
            </p>
            <p className="mt-1 font-serif text-2xl text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <AdminPanel title="Revenue — last 7 days">
          <div className="flex h-40 items-end gap-2">
            {dayKeys.map((key) => {
              const val = dayTotals[key] ?? 0;
              const pct = Math.round((val / maxDay) * 100);
              return (
                <div key={key} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] text-ink-muted">
                    {val > 0 ? formatPrice(val).replace(/\.00$/, "") : "—"}
                  </span>
                  <div className="flex h-28 w-full items-end rounded-sm bg-bg-muted">
                    <div
                      className="w-full rounded-sm bg-sage transition-all"
                      style={{ height: `${Math.max(pct, val > 0 ? 4 : 0)}%` }}
                      title={formatPrice(val)}
                    />
                  </div>
                  <span className="text-[10px] text-ink-muted">
                    {key.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </AdminPanel>

        <AdminPanel title="Top products">
          <div className="space-y-3">
            {topProductGroups.length === 0 ? (
              <p className="text-sm text-ink-muted">No sales yet.</p>
            ) : (
              topProductGroups.map((p) => {
                const qty = p._sum.quantity ?? 0;
                const pct = Math.round((qty / maxTop) * 100);
                return (
                  <div key={p.productName}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="truncate pr-2 text-ink">{p.productName}</span>
                      <span className="shrink-0 text-ink-muted">{qty}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-sm bg-bg-muted">
                      <div
                        className="h-full rounded-sm bg-oak"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <AdminPanel title="Recent orders" className="lg:col-span-1">
          <ul className="divide-y divide-oak/20">
            {recentOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="text-sm font-medium text-ink hover:underline"
                  >
                    {o.orderNumber}
                  </Link>
                  <p className="truncate text-xs text-ink-muted">{o.email}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm">{formatPrice(decimalToNumber(o.total))}</p>
                  <StatusBadge tone={orderStatusTone(o.status)}>
                    {o.status}
                  </StatusBadge>
                </div>
              </li>
            ))}
            {recentOrders.length === 0 ? (
              <li className="text-sm text-ink-muted">No orders yet.</li>
            ) : null}
          </ul>
        </AdminPanel>

        <AdminPanel title="Pending orders">
          <ul className="divide-y divide-oak/20">
            {pendingOrders.map((o) => (
              <li key={o.id} className="py-2.5 first:pt-0 last:pb-0">
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {o.orderNumber}
                </Link>
                <p className="text-xs text-ink-muted">
                  {o.email} · {formatAdminDate(o.createdAt)}
                </p>
                <p className="text-sm">{formatPrice(decimalToNumber(o.total))}</p>
              </li>
            ))}
            {pendingOrders.length === 0 ? (
              <li className="text-sm text-ink-muted">No pending orders.</li>
            ) : null}
          </ul>
        </AdminPanel>

        <AdminPanel title="Low stock">
          <ul className="divide-y divide-oak/20">
            {lowStockFiltered.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="truncate text-sm font-medium hover:underline"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs text-ink-muted">{p.sku ?? "—"}</p>
                </div>
                <StatusBadge tone="danger">
                  {p.stock} / {p.lowStockThreshold}
                </StatusBadge>
              </li>
            ))}
            {lowStockFiltered.length === 0 ? (
              <li className="text-sm text-ink-muted">Stock levels look good.</li>
            ) : null}
          </ul>
        </AdminPanel>
      </div>
    </div>
  );
}
