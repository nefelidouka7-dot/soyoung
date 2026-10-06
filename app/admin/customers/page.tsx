import Link from "next/link";
import { prisma } from "@/db/prisma";
import { requireAdmin, decimalToNumber, formatAdminDate } from "@/lib/admin";
import { formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AdminEmpty,
  AdminPageHeader,
  AdminTable,
  AdminTableHead,
  AdminTd,
  AdminTh,
  AdminToolbar,
  StatusBadge,
} from "@/features/admin/components/admin-ui";

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
      <AdminPageHeader
        title="Πελάτες"
        description={`${customers.length} πελάτ${customers.length === 1 ? "ης" : "ες"}`}
      />

      <form>
        <AdminToolbar>
          <Input
            name="q"
            placeholder="Αναζήτηση ονόματος ή email…"
            defaultValue={q ?? ""}
            className="h-10 min-w-[12rem] flex-1 border-oak/45 bg-white sm:max-w-xs"
          />
          <Button type="submit" size="sm" variant="secondary">
            Αναζήτηση
          </Button>
        </AdminToolbar>
      </form>

      <AdminTable minWidth="700px">
        <AdminTableHead>
          <tr>
            <AdminTh>Πελάτης</AdminTh>
            <AdminTh>Παραγγελίες</AdminTh>
            <AdminTh>Σύνολο αγορών</AdminTh>
            <AdminTh>Ρόλος</AdminTh>
            <AdminTh>Ενεργός</AdminTh>
            <AdminTh>Εγγραφή</AdminTh>
          </tr>
        </AdminTableHead>
        <tbody className="divide-y divide-oak/20">
          {customers.map((c) => {
            const spent = c.orders
              .filter((o) => paid.has(o.status))
              .reduce((sum, o) => sum + decimalToNumber(o.total), 0);
            return (
              <tr key={c.id} className="transition-colors hover:bg-bg/40">
                <AdminTd>
                  <Link
                    href={`/admin/customers/${c.id}`}
                    className="font-medium hover:underline"
                  >
                    {c.name ??
                      (`${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "—")}
                  </Link>
                  <p className="text-xs text-ink-muted">{c.email}</p>
                </AdminTd>
                <AdminTd className="tabular-nums">{c._count.orders}</AdminTd>
                <AdminTd className="tabular-nums">{formatPrice(spent)}</AdminTd>
                <AdminTd>
                  <StatusBadge tone="neutral">{c.role}</StatusBadge>
                </AdminTd>
                <AdminTd>
                  <StatusBadge tone={c.active ? "success" : "danger"}>
                    {c.active ? "Ναι" : "Όχι"}
                  </StatusBadge>
                </AdminTd>
                <AdminTd className="text-ink-muted">
                  {formatAdminDate(c.createdAt)}
                </AdminTd>
              </tr>
            );
          })}
          {customers.length === 0 ? (
            <AdminEmpty colSpan={6}>Δεν βρέθηκαν πελάτες.</AdminEmpty>
          ) : null}
        </tbody>
      </AdminTable>
    </div>
  );
}
