import { prisma } from "@/db/prisma";
import { requireAdmin } from "@/lib/admin";
import { adjustStock } from "@/features/admin/actions/misc";
import { AdminPageHeader, StatusBadge } from "@/features/admin/components/admin-ui";
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
        description="Stock levels and quick adjustments."
      />

      <form className="mb-4 flex gap-2">
        <Input
          name="q"
          placeholder="Search product or SKU…"
          defaultValue={q ?? ""}
          className="h-10 max-w-xs border-oak/50 bg-white"
        />
        <Button type="submit" size="sm" variant="secondary">
          Search
        </Button>
      </form>

      <div className="overflow-x-auto rounded-sm border border-oak/40 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-oak/30 bg-bg-muted text-[10px] uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-3 py-2.5 font-medium">Product</th>
              <th className="px-3 py-2.5 font-medium">Stock</th>
              <th className="px-3 py-2.5 font-medium">Threshold</th>
              <th className="px-3 py-2.5 font-medium">Adjust</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oak/20">
            {products.map((p) => {
              const low = p.stock <= p.lowStockThreshold;
              return (
                <tr
                  key={p.id}
                  className={low ? "bg-coral/5" : "hover:bg-bg-muted/50"}
                >
                  <td className="px-3 py-2.5">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-ink-muted">
                      {p.sku ?? "—"} · {p.brand.name}
                    </p>
                    {low ? (
                      <StatusBadge tone="danger">Low stock</StatusBadge>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 font-medium">{p.stock}</td>
                  <td className="px-3 py-2.5 text-ink-muted">
                    {p.lowStockThreshold}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-1">
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
                          className="h-9 w-16 border-oak/50 bg-white px-2 text-sm"
                          required
                        />
                        <Input
                          name="note"
                          placeholder="Note"
                          className="h-9 w-24 border-oak/50 bg-white px-2 text-sm"
                        />
                        <Button type="submit" size="sm">
                          Apply
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-ink-muted">
                  No products found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
