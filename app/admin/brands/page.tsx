import { prisma } from "@/db/prisma";
import { requireAdmin } from "@/lib/admin";
import {
  AdminEmpty,
  AdminPageHeader,
  AdminPanel,
  AdminTable,
  AdminTableHead,
  AdminTd,
  AdminTh,
  StatusBadge,
} from "@/features/admin/components/admin-ui";
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
        <AdminPanel title="All brands" description={`${brands.length} total`} flush>
          <AdminTable minWidth="0" bare>
            <AdminTableHead>
              <tr>
                <AdminTh>Brand</AdminTh>
                <AdminTh>Products</AdminTh>
                <AdminTh>Flags</AdminTh>
                <AdminTh />
              </tr>
            </AdminTableHead>
            <tbody className="divide-y divide-oak/20">
              {brands.map((b) => (
                <tr key={b.id} className="transition-colors hover:bg-bg/40">
                  <AdminTd>
                    <p className="font-medium">{b.name}</p>
                    <p className="text-xs text-ink-muted">{b.slug}</p>
                  </AdminTd>
                  <AdminTd className="tabular-nums">{b._count.products}</AdminTd>
                  <AdminTd>
                    <div className="flex flex-wrap gap-1">
                      {b.featured ? (
                        <StatusBadge tone="info">Featured</StatusBadge>
                      ) : null}
                      <StatusBadge tone={b.active ? "success" : "neutral"}>
                        {b.active ? "Active" : "Inactive"}
                      </StatusBadge>
                    </div>
                  </AdminTd>
                  <AdminTd className="text-right">
                    <a
                      href={`/admin/brands?edit=${b.id}`}
                      className="mr-2 text-xs font-semibold text-sage-dark hover:underline"
                    >
                      Edit
                    </a>
                    {b._count.products === 0 ? (
                      <form action={deleteBrand.bind(null, b.id)} className="inline">
                        <button
                          type="submit"
                          className="text-xs font-medium text-coral hover:underline"
                        >
                          Delete
                        </button>
                      </form>
                    ) : null}
                  </AdminTd>
                </tr>
              ))}
              {brands.length === 0 ? (
                <AdminEmpty colSpan={4}>No brands yet.</AdminEmpty>
              ) : null}
            </tbody>
          </AdminTable>
        </AdminPanel>

        <BrandForm brand={editing} key={editing?.id ?? "new"} />
      </div>
    </div>
  );
}
