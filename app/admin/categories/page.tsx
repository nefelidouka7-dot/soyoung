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
        title="Κατηγορίες"
        description="Όνομα και κείμενο κάθε κατηγορίας στο κατάστημα. Οι στόχοι επιδερμίδας αλλάζουν από Στόχοι επιδερμίδας."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminPanel
          title="Όλες οι κατηγορίες"
          description={`${categories.length} συνολικά`}
          flush
        >
          <AdminTable minWidth="0" bare>
            <AdminTableHead>
              <tr>
                <AdminTh>Κατηγορία</AdminTh>
                <AdminTh>Γονική</AdminTh>
                <AdminTh>Σειρά</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh />
              </tr>
            </AdminTableHead>
            <tbody className="divide-y divide-oak/20">
              {categories.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-bg/40">
                  <AdminTd>
                    <p className="font-medium">
                      {c.parentId ? (
                        <span className="mr-1 text-ink-muted">↳</span>
                      ) : null}
                      {c.name}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {c.slug} · {c._count.products} products
                    </p>
                  </AdminTd>
                  <AdminTd className="text-ink-muted">
                    {c.parent?.name ?? "—"}
                  </AdminTd>
                  <AdminTd className="tabular-nums">{c.sortOrder}</AdminTd>
                  <AdminTd>
                    <StatusBadge tone={c.active ? "success" : "neutral"}>
                      {c.active ? "Ενεργή" : "Ανενεργή"}
                    </StatusBadge>
                  </AdminTd>
                  <AdminTd className="text-right">
                    <a
                      href={`/admin/categories?edit=${c.id}`}
                      className="mr-2 text-xs font-semibold text-sage-dark hover:underline"
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
                          className="text-xs font-medium text-coral hover:underline"
                        >
                          Διαγραφή
                        </button>
                      </form>
                    ) : null}
                  </AdminTd>
                </tr>
              ))}
              {categories.length === 0 ? (
                <AdminEmpty colSpan={5}>Δεν υπάρχουν κατηγορίες ακόμα.</AdminEmpty>
              ) : null}
            </tbody>
          </AdminTable>
        </AdminPanel>

        <CategoryForm
          category={editing}
          parents={categories}
          key={editing?.id ?? "new"}
        />
      </div>
    </div>
  );
}
