import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/db/prisma";
import { requireAdmin, decimalToNumber, formatAdminDate } from "@/lib/admin";
import { formatPrice } from "@/lib/utils";
import {
  AdminPageHeader,
  AdminPanel,
  StatusBadge,
  orderStatusTone,
} from "@/features/admin/components/admin-ui";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      addresses: { orderBy: { isDefault: "desc" } },
      orders: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!customer) notFound();

  return (
    <div>
      <AdminPageHeader
        title={
          customer.name ??
          (`${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() ||
            customer.email)
        }
        description={customer.email}
        actions={
          <Link
            href="/admin/customers"
            className="text-sm text-sage hover:underline"
          >
            ← All customers
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge tone="neutral">{customer.role}</StatusBadge>
        <StatusBadge tone={customer.active ? "success" : "danger"}>
          {customer.active ? "Active" : "Inactive"}
        </StatusBadge>
        {customer.phone ? (
          <span className="text-sm text-ink-muted">{customer.phone}</span>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminPanel title="Orders">
          <ul className="divide-y divide-oak/20">
            {customer.orders.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
              >
                <div>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {o.orderNumber}
                  </Link>
                  <p className="text-xs text-ink-muted">
                    {formatAdminDate(o.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    {formatPrice(decimalToNumber(o.total))}
                  </p>
                  <StatusBadge tone={orderStatusTone(o.status)}>
                    {o.status}
                  </StatusBadge>
                </div>
              </li>
            ))}
            {customer.orders.length === 0 ? (
              <li className="text-sm text-ink-muted">No orders.</li>
            ) : null}
          </ul>
        </AdminPanel>

        <AdminPanel title="Addresses">
          <ul className="space-y-4">
            {customer.addresses.map((a) => (
              <li key={a.id} className="text-sm leading-relaxed text-ink-muted">
                {a.isDefault ? (
                  <StatusBadge tone="info">Default</StatusBadge>
                ) : null}
                {a.label ? <p className="mt-1 text-ink">{a.label}</p> : null}
                <p className="text-ink">
                  {a.firstName} {a.lastName}
                </p>
                <p>{a.line1}</p>
                {a.line2 ? <p>{a.line2}</p> : null}
                <p>
                  {a.postalCode} {a.city}
                </p>
                <p>
                  {[a.state, a.country].filter(Boolean).join(", ")}
                </p>
              </li>
            ))}
            {customer.addresses.length === 0 ? (
              <li className="text-sm text-ink-muted">No saved addresses.</li>
            ) : null}
          </ul>
        </AdminPanel>
      </div>
    </div>
  );
}
