import { prisma } from "@/db/prisma";
import { requireAdmin } from "@/lib/admin";
import { adjustStock } from "@/features/admin/actions/misc";
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
    orderBy: { stock: "asc" },
    take: 100,
  });

  return (
    <div>
      <AdminPageHeader
        title="Inventory"
        description="Stock levels and quick adjustments — lowest stock first."
      />

      <form>
        <AdminToolbar>
          <Input
            name="q"
            placeholder="Search product or SKU…"
            defaultValue={q ?? ""}
            className="h-10 min-w-[12rem] flex-1 border-oak/45 bg-white sm:max-w-xs"
          />
          <Button type="submit" size="sm" variant="secondary">
            Search
          </Button>
        </AdminToolbar>
      </form>

      <AdminTable minWidth="640px">
        <AdminTableHead>
          <tr>
            <AdminTh>Product</AdminTh>
            <AdminTh>Stock</AdminTh>
            <AdminTh>Threshold</AdminTh>
            <AdminTh>Adjust</AdminTh>
          </tr>
        </AdminTableHead>
        <tbody className="divide-y divide-oak/20">
          {products.map((p) => {
            const low = p.stock <= p.lowStockThreshold;
            return (
              <tr
                key={p.id}
                className={low ? "bg-coral/[0.04]" : "transition-colors hover:bg-bg/40"}
              >
                <AdminTd>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-ink-muted">
                    {p.sku ?? "—"} · {p.brand.name}
                  </p>
                  {low ? (
                    <span className="mt-1 inline-block">
                      <StatusBadge tone="danger">Low stock</StatusBadge>
                    </span>
                  ) : null}
                </AdminTd>
                <AdminTd className="font-medium tabular-nums">{p.stock}</AdminTd>
                <AdminTd className="tabular-nums text-ink-muted">
                  {p.lowStockThreshold}
                </AdminTd>
                <AdminTd>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <form action={adjustStock.bind(null, p.id)}>
                      <input type="hidden" name="delta" value="-1" />
                      <Button type="submit" size="sm" variant="secondary">
                        −1
                      </Button>
                    </form>
                    <form action={adjustStock.bind(null, p.id)}>
                      <input type="hidden" name="delta" value="1" />
                      <Button type="submit" size="sm" variant="secondary">
                        +1
                      </Button>
                    </form>
                    <form
                      action={adjustStock.bind(null, p.id)}
                      className="flex items-center gap-1"
                    >
                      <Input
                        name="delta"
                        type="number"
                        placeholder="±"
                        className="h-9 w-16 border-oak/45 bg-white px-2 text-sm"
                        required
                      />
                      <Input
                        name="note"
                        placeholder="Note"
                        className="h-9 w-24 border-oak/45 bg-white px-2 text-sm"
                      />
                      <Button type="submit" size="sm">
                        Apply
                      </Button>
                    </form>
                  </div>
                </AdminTd>
              </tr>
            );
          })}
          {products.length === 0 ? (
            <AdminEmpty colSpan={4}>No products found.</AdminEmpty>
          ) : null}
        </tbody>
      </AdminTable>
    </div>
  );
}
