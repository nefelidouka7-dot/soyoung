import Link from "next/link";
import { prisma } from "@/db/prisma";
import { requireAdmin, decimalToNumber, formatAdminDate } from "@/lib/admin";
import { formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdminPageHeader, StatusBadge } from "@/features/admin/components/admin-ui";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;

  const customers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(q?.trim()
        ? {
            OR: [
              { email: { contains: q.trim(), mode: "insensitive" } },
              { name: { contains: q.trim(), mode: "insensitive" } },
              { firstName: { contains: q.trim(), mode: "insensitive" } },
              { lastName: { contains: q.trim(), mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      orders: {
        select: { total: true, status: true },
      },
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const paid = new Set(["PAID", "PROCESSING", "SHIPPED", "DELIVERED"]);

  return (
    <div>
      <AdminPageHeader title="Customers" description="Customer accounts." />

      <form className="mb-4 flex flex-wrap gap-2">
        <Input
          name="q"
          placeholder="Search name or email…"
          defaultValue={q ?? ""}
          className="h-10 max-w-xs border-oak/50 bg-white"
        />
        <Button type="submit" size="sm" variant="secondary">
          Search
        </Button>
      </form>

      <div className="overflow-x-auto rounded-sm border border-oak/40 bg-white">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-oak/30 bg-bg-muted text-[10px] uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-3 py-2.5 font-medium">Customer</th>
              <th className="px-3 py-2.5 font-medium">Orders</th>
              <th className="px-3 py-2.5 font-medium">Total spent</th>
              <th className="px-3 py-2.5 font-medium">Role</th>
              <th className="px-3 py-2.5 font-medium">Active</th>
              <th className="px-3 py-2.5 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oak/20">
            {customers.map((c) => {
              const spent = c.orders
                .filter((o) => paid.has(o.status))
                .reduce((sum, o) => sum + decimalToNumber(o.total), 0);
              return (
                <tr key={c.id} className="hover:bg-bg-muted/50">
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="font-medium hover:underline"
                    >
                      {c.name ??
                        (`${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "—")}
                    </Link>
                    <p className="text-xs text-ink-muted">{c.email}</p>
                  </td>
                  <td className="px-3 py-2.5">{c._count.orders}</td>
                  <td className="px-3 py-2.5">{formatPrice(spent)}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge tone="neutral">{c.role}</StatusBadge>
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge tone={c.active ? "success" : "danger"}>
                      {c.active ? "Yes" : "No"}
                    </StatusBadge>
                  </td>
                  <td className="px-3 py-2.5 text-ink-muted">
                    {formatAdminDate(c.createdAt)}
                  </td>
                </tr>
              );
            })}
            {customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-ink-muted">
                  No customers found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
