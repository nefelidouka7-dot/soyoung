import { prisma } from "@/db/prisma";
import { requireAdmin } from "@/lib/admin";
import { AdminPageHeader, StatusBadge } from "@/features/admin/components/admin-ui";
import { BrandForm } from "@/features/admin/components/brand-form";
import { deleteBrand } from "@/features/admin/actions/brands";

export default async function AdminBrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requireAdmin();
  const { edit } = await searchParams;

  const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  const editing = edit ? brands.find((b) => b.id === edit) : undefined;

  return (
    <div>
      <AdminPageHeader
        title="Brands"
        description="Manage brand directory."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-x-auto rounded-sm border border-oak/40 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-oak/30 bg-bg-muted text-[10px] uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-3 py-2.5 font-medium">Brand</th>
                <th className="px-3 py-2.5 font-medium">Products</th>
                <th className="px-3 py-2.5 font-medium">Flags</th>
                <th className="px-3 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-oak/20">
              {brands.map((b) => (
                <tr key={b.id}>
                  <td className="px-3 py-2.5">
                    <p className="font-medium">{b.name}</p>
                    <p className="text-xs text-ink-muted">{b.slug}</p>
                  </td>
                  <td className="px-3 py-2.5">{b._count.products}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {b.featured ? (
                        <StatusBadge tone="info">Featured</StatusBadge>
                      ) : null}
                      <StatusBadge tone={b.active ? "success" : "neutral"}>
                        {b.active ? "Active" : "Inactive"}
                      </StatusBadge>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <a
                      href={`/admin/brands?edit=${b.id}`}
                      className="mr-2 text-xs font-medium text-sage hover:underline"
                    >
                      Edit
                    </a>
                    {b._count.products === 0 ? (
                      <form action={deleteBrand.bind(null, b.id)} className="inline">
                        <button
                          type="submit"
                          className="text-xs text-coral hover:underline"
                        >
                          Delete
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <BrandForm brand={editing} key={editing?.id ?? "new"} />
      </div>
    </div>
  );
}
