import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/db/prisma";
import { requireAdmin, decimalToNumber, formatAdminDate } from "@/lib/admin";
import { formatPrice } from "@/lib/utils";
import { updateOrderStatus } from "@/features/admin/actions/orders";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AdminBreadcrumb,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  StatusBadge,
  orderStatusTone,
} from "@/features/admin/components/admin-ui";

const STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      timeline: { orderBy: { createdAt: "asc" } },
      payment: true,
      shipment: true,
      user: { select: { id: true, email: true, name: true } },
    },
  });
  if (!order) notFound();

  const updateWithId = updateOrderStatus.bind(null, order.id);

  return (
    <div>
      <AdminPageHeader
        title={order.orderNumber}
        description={`Placed ${formatAdminDate(order.createdAt)}`}
        breadcrumb={
          <AdminBreadcrumb
            items={[
              { href: "/admin/orders", label: "Orders" },
              { label: order.orderNumber },
            ]}
          />
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <StatusBadge tone={orderStatusTone(order.status)}>{order.status}</StatusBadge>
        <StatusBadge tone={order.paymentStatus === "PAID" ? "success" : "warning"}>
          Payment: {order.paymentStatus}
        </StatusBadge>
        <StatusBadge tone="neutral">
          {order.shippingMethod === "pickup" ? "Store pickup" : "Courier"}
        </StatusBadge>
        {order.payment?.method ? (
          <StatusBadge tone="neutral">
            {order.payment.method === "cod" ? "Cash on delivery" : "Card"}
          </StatusBadge>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <AdminPanel title="Items">
            <ul className="divide-y divide-oak/20">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-sm">{item.productName}</p>
                    <p className="text-xs text-ink-muted">
                      {[item.brandName, item.variantName, item.sku]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {item.quantity} × {formatPrice(decimalToNumber(item.unitPrice))}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    {formatPrice(decimalToNumber(item.totalPrice))}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1 border-t border-oak/30 pt-3 text-sm">
              <Row label="Subtotal" value={formatPrice(decimalToNumber(order.subtotal))} />
              <Row
                label="Discount"
                value={formatPrice(decimalToNumber(order.discountAmount))}
              />
              <Row
                label="Shipping"
                value={formatPrice(decimalToNumber(order.shippingAmount))}
              />
              <Row label="Tax" value={formatPrice(decimalToNumber(order.taxAmount))} />
              <Row
                label="Total"
                value={formatPrice(decimalToNumber(order.total))}
                strong
              />
            </div>
          </AdminPanel>

          <AdminPanel title="Timeline">
            <ol className="space-y-3">
              {order.timeline.map((t) => (
                <li key={t.id} className="flex gap-3 text-sm">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-coral" />
                  <div>
                    <p className="font-medium">{t.status}</p>
                    {t.note ? (
                      <p className="text-ink-muted">{t.note}</p>
                    ) : null}
                    <p className="text-xs text-ink-muted">
                      {formatAdminDate(t.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
              {order.timeline.length === 0 ? (
                <li className="text-sm text-ink-muted">No timeline events yet.</li>
              ) : null}
            </ol>
          </AdminPanel>
        </div>

        <div className="space-y-4">
          <AdminPanel title="Update status">
            <form action={updateWithId} className="space-y-3">
              <div>
                <Label htmlFor="status">Status</Label>
                <AdminSelect
                  id="status"
                  name="status"
                  defaultValue={order.status}
                  className="mt-1.5 w-full"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </AdminSelect>
              </div>
              <div>
                <Label htmlFor="note">Note (optional)</Label>
                <Input
                  id="note"
                  name="note"
                  className="mt-1.5 h-10 border-oak/50 bg-white"
                />
              </div>
              <Button type="submit" size="sm" className="w-full">
                Save status
              </Button>
            </form>
          </AdminPanel>

          <AdminPanel title="Customer">
            <p className="text-sm">{order.email}</p>
            {order.phone ? (
              <p className="text-sm text-ink-muted">{order.phone}</p>
            ) : null}
            {order.user ? (
              <Link
                href={`/admin/customers/${order.user.id}`}
                className="mt-2 inline-block text-xs text-sage hover:underline"
              >
                View customer →
              </Link>
            ) : null}
          </AdminPanel>

          <AdminPanel title="Shipping address">
            {order.shippingLine1 ? (
              <address className="not-italic text-sm leading-relaxed text-ink-muted">
                {order.shippingName ? <p className="text-ink">{order.shippingName}</p> : null}
                <p>{order.shippingLine1}</p>
                {order.shippingLine2 ? <p>{order.shippingLine2}</p> : null}
                <p>
                  {[order.shippingPostal, order.shippingCity]
                    .filter(Boolean)
                    .join(" ")}
                </p>
                <p>
                  {[order.shippingState, order.shippingCountry]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {order.shippingPhone ? <p>{order.shippingPhone}</p> : null}
              </address>
            ) : (
              <p className="text-sm text-ink-muted">No shipping address.</p>
            )}
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className={strong ? "font-medium text-ink" : ""}>{value}</span>
    </div>
  );
}
