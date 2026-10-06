import { prisma } from "@/db/prisma";
import { requireAdmin } from "@/lib/admin";
import {
  AdminEmpty,
  AdminPageHeader,
  AdminTable,
  AdminTableHead,
  AdminTd,
  AdminTh,
  AdminToolbar,
} from "@/features/admin/components/admin-ui";
import { InventoryStockControls } from "@/features/admin/components/inventory-stock-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;

  const products = await prisma.product.findMany({
    where: {
      status: { not: "ARCHIVED" },
      ...(q?.trim()
        ? {
            OR: [
              { name: { contains: q.trim(), mode: "insensitive" } },
              { sku: { contains: q.trim(), mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { brand: { select: { name: true } } },
    // Stable order so adjusting stock doesn't reshuffle rows mid-edit.
    orderBy: [{ name: "asc" }],
    take: 100,
  });

  const lowCount = products.filter((p) => p.stock <= p.lowStockThreshold).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Απόθεμα"
        description="Γρήγορες ρυθμίσεις stock. Η σειρά μένει σταθερή (Α–Ω) — τα χαμηλά φαίνονται με κόκκινο."
      />

      {lowCount > 0 ? (
        <div className="rounded-xl border border-coral/25 bg-coral/[0.06] px-4 py-3 text-sm text-ink">
          <span className="font-semibold text-coral">{lowCount}</span>
          {" "}
          προϊόντ{lowCount === 1 ? "ο είναι" : "α είναι"} στο ή κάτω από το όριο
          χαμηλού stock.
        </div>
      ) : null}

      <form>
        <AdminToolbar>
          <Input
            name="q"
            placeholder="Αναζήτηση προϊόντος ή SKU…"
            defaultValue={q ?? ""}
            className="h-10 min-w-[12rem] flex-1 border-oak/45 bg-white sm:max-w-xs"
          />
          <Button type="submit" size="sm" variant="secondary">
            Αναζήτηση
          </Button>
        </AdminToolbar>
      </form>

      <AdminTable minWidth="720px">
        <AdminTableHead>
          <tr>
            <AdminTh>Προϊόν</AdminTh>
            <AdminTh>Ρύθμιση stock</AdminTh>
          </tr>
        </AdminTableHead>
        <tbody className="divide-y divide-oak/20">
          {products.map((p) => {
            const low = p.stock <= p.lowStockThreshold;
            return (
              <tr
                key={p.id}
                className={
                  low ? "bg-coral/[0.04]" : "transition-colors hover:bg-bg/40"
                }
              >
                <AdminTd>
                  <p className="font-medium text-ink">{p.name}</p>
                  <p className="text-xs text-ink-muted">
                    {p.sku ?? "—"} · {p.brand.name}
                  </p>
                </AdminTd>
                <AdminTd>
                  <InventoryStockControls
                    productId={p.id}
                    initialStock={p.stock}
                    lowStockThreshold={p.lowStockThreshold}
                  />
                </AdminTd>
              </tr>
            );
          })}
          {products.length === 0 ? (
            <AdminEmpty colSpan={2}>Δεν βρέθηκαν προϊόντα.</AdminEmpty>
          ) : null}
        </tbody>
      </AdminTable>
    </div>
  );
}
