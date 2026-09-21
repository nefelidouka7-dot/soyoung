import { prisma } from "@/db/prisma";
import { requireAdmin } from "@/lib/admin";
import { AdminPageHeader, StatusBadge } from "@/features/admin/components/admin-ui";
import { CategoryForm } from "@/features/admin/components/category-form";
import { deleteCategory } from "@/features/admin/actions/categories";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requireAdmin();
  const { edit } = await searchParams;

  const categories = await prisma.category.findMany({
    include: {
      parent: true,
      _count: { select: { products: true, children: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const editing = edit ? categories.find((c) => c.id === edit) : undefined;

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description="Catalog taxonomy with nesting."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-x-auto rounded-sm border border-oak/40 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-oak/30 bg-bg-muted text-[10px] uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-3 py-2.5 font-medium">Category</th>
                <th className="px-3 py-2.5 font-medium">Parent</th>
                <th className="px-3 py-2.5 font-medium">Sort</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-oak/20">
              {categories.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2.5">
                    <p className="font-medium">
                      {c.parentId ? "↳ " : ""}
                      {c.name}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {c.slug} · {c._count.products} products
                    </p>
                  </td>
                  <td className="px-3 py-2.5 text-ink-muted">
                    {c.parent?.name ?? "—"}
                  </td>
                  <td className="px-3 py-2.5">{c.sortOrder}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge tone={c.active ? "success" : "neutral"}>
                      {c.active ? "Active" : "Inactive"}
                    </StatusBadge>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <a
                      href={`/admin/categories?edit=${c.id}`}
                      className="mr-2 text-xs font-medium text-sage hover:underline"
                    >
                      Edit
                    </a>
                    {c._count.products === 0 && c._count.children === 0 ? (
                      <form
                        action={deleteCategory.bind(null, c.id)}
                        className="inline"
                      >
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

        <CategoryForm
          category={editing}
          parents={categories}
          key={editing?.id ?? "new"}
        />
      </div>
    </div>
  );
}
