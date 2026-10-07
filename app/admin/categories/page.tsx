import { prisma } from "@/db/prisma";
import { requireAdmin } from "@/lib/admin";
import {
  AdminPageHeader,
  AdminPanel,
} from "@/features/admin/components/admin-ui";
import { CategoryForm } from "@/features/admin/components/category-form";
import { CategoryList } from "@/features/admin/components/category-list";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; new?: string }>;
}) {
  await requireAdmin();
  const { edit, new: newUnder } = await searchParams;

  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { products: true, children: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const editing = edit ? categories.find((c) => c.id === edit) : undefined;
  const parentForNew =
    newUnder && !editing
      ? categories.find((c) => c.id === newUnder)
      : undefined;

  const listItems = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    active: c.active,
    parentId: c.parentId,
    sortOrder: c.sortOrder,
    productCount: c._count.products,
    childCount: c._count.children,
  }));

  const parentOptions = categories.map((c) => ({
    id: c.id,
    name: c.name,
    parentId: c.parentId,
  }));

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Κατηγορίες"
        description="Το μενού του καταστήματος. Πρόσθεσε κατηγορίες, βάλε υποκατηγορίες μέσα τους, άλλαξε σειρά με drag. (Οι στόχοι επιδερμίδας είναι ξεχωριστή σελίδα.)"
      />

      {editing ? (
        <CategoryForm
          category={editing}
          parents={parentOptions}
          key={`edit-${editing.id}`}
        />
      ) : null}

      <CategoryForm
        key={parentForNew ? `new-under-${parentForNew.id}` : "new"}
        parents={parentOptions}
        defaultParentId={parentForNew?.id}
        defaultOpen={categories.length === 0 || Boolean(parentForNew)}
      />

      <AdminPanel
        className="overflow-visible"
        title="Δομή κατηγοριών"
        description={
          categories.length
            ? `${categories.length} κατηγορίες · δες το πλαίσιο «Πώς δουλεύει» πάνω από τη λίστα`
            : "Πρόσθεσε πρώτα μία κορυφαία κατηγορία από πάνω."
        }
      >
        <CategoryList categories={listItems} editingId={editing?.id} />
      </AdminPanel>
    </div>
  );
}
