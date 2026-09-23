import Link from "next/link";
import { prisma } from "@/db/prisma";
import { requireAdmin, decimalToNumber, formatAdminDate } from "@/lib/admin";
import { formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AdminEmpty,
  AdminPageHeader,
  AdminSelect,
  AdminTable,
  AdminTableHead,
  AdminTd,
  AdminTh,
  AdminToolbar,
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
        ? {
            status: status as
              | "PENDING"
              | "PAID"
              | "PROCESSING"
              | "SHIPPED"
              | "DELIVERED"
              | "CANCELLED"
              | "REFUNDED",
          }
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
      <AdminPageHeader
        title="Orders"
        description={`${orders.length} order${orders.length === 1 ? "" : "s"} in this view.`}
      />

      <form>
        <AdminToolbar>
          <Input
            name="q"
            placeholder="Order # or email…"
            defaultValue={q ?? ""}
            className="h-10 min-w-[12rem] flex-1 border-oak/45 bg-white sm:max-w-xs"
          />
          <AdminSelect name="status" defaultValue={status ?? ""}>
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
          </AdminSelect>
          <Button type="submit" size="sm" variant="secondary">
            Filter
          </Button>
        </AdminToolbar>
      </form>

      <AdminTable minWidth="800px">
        <AdminTableHead>
          <tr>
            <AdminTh>Order</AdminTh>
            <AdminTh>Customer</AdminTh>
            <AdminTh>Date</AdminTh>
            <AdminTh>Total</AdminTh>
            <AdminTh>Payment</AdminTh>
            <AdminTh>Status</AdminTh>
          </tr>
        </AdminTableHead>
        <tbody className="divide-y divide-oak/20">
          {orders.map((o) => (
            <tr key={o.id} className="transition-colors hover:bg-bg/40">
              <AdminTd>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="font-medium text-ink hover:underline"
                >
                  {o.orderNumber}
                </Link>
              </AdminTd>
              <AdminTd className="text-ink-muted">{o.email}</AdminTd>
              <AdminTd className="text-ink-muted">
                {formatAdminDate(o.createdAt)}
              </AdminTd>
              <AdminTd className="tabular-nums">
                {formatPrice(decimalToNumber(o.total))}
              </AdminTd>
              <AdminTd>
                <StatusBadge
                  tone={o.paymentStatus === "PAID" ? "success" : "warning"}
                >
                  {o.paymentStatus}
                </StatusBadge>
              </AdminTd>
              <AdminTd>
                <StatusBadge tone={orderStatusTone(o.status)}>
                  {o.status}
                </StatusBadge>
              </AdminTd>
            </tr>
          ))}
          {orders.length === 0 ? (
            <AdminEmpty colSpan={6}>No orders found.</AdminEmpty>
          ) : null}
        </tbody>
      </AdminTable>
    </div>
  );
}
