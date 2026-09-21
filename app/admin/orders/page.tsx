import Link from "next/link";
import { prisma } from "@/db/prisma";
import { requireAdmin, decimalToNumber, formatAdminDate } from "@/lib/admin";
import { formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AdminPageHeader,
  StatusBadge,
  orderStatusTone,
} from "@/features/admin/components/admin-ui";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin();
  const { q, status } = await searchParams;

  const orders = await prisma.order.findMany({
    where: {
      ...(status
        ? { status: status as "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED" }
        : {}),
      ...(q?.trim()
        ? {
            OR: [
              { orderNumber: { contains: q.trim(), mode: "insensitive" } },
              { email: { contains: q.trim(), mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <AdminPageHeader title="Orders" description="Fulfillment queue." />

      <form className="mb-4 flex flex-wrap gap-2">
        <Input
          name="q"
          placeholder="Order # or email…"
          defaultValue={q ?? ""}
          className="h-10 max-w-xs border-oak/50 bg-white"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-10 border border-oak/50 bg-white px-3 text-sm"
        >
          <option value="">All statuses</option>
          {[
            "PENDING",
            "PAID",
            "PROCESSING",
            "SHIPPED",
            "DELIVERED",
            "CANCELLED",
            "REFUNDED",
          ].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" variant="secondary">
          Filter
        </Button>
      </form>

      <div className="overflow-x-auto rounded-sm border border-oak/40 bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-oak/30 bg-bg-muted text-[10px] uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-3 py-2.5 font-medium">Order</th>
              <th className="px-3 py-2.5 font-medium">Customer</th>
              <th className="px-3 py-2.5 font-medium">Date</th>
              <th className="px-3 py-2.5 font-medium">Total</th>
              <th className="px-3 py-2.5 font-medium">Payment</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oak/20">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-bg-muted/50">
                <td className="px-3 py-2.5">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-medium text-ink hover:underline"
                  >
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-ink-muted">{o.email}</td>
                <td className="px-3 py-2.5 text-ink-muted">
                  {formatAdminDate(o.createdAt)}
                </td>
                <td className="px-3 py-2.5">
                  {formatPrice(decimalToNumber(o.total))}
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge tone={o.paymentStatus === "PAID" ? "success" : "warning"}>
                    {o.paymentStatus}
                  </StatusBadge>
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge tone={orderStatusTone(o.status)}>
                    {o.status}
                  </StatusBadge>
                </td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-ink-muted">
                  No orders found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
