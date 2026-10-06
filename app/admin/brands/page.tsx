import Link from "next/link";
import { prisma } from "@/db/prisma";
import { requireAdmin } from "@/lib/admin";
import { cn } from "@/lib/utils";
import {
  AdminEmpty,
  AdminPageHeader,
  AdminPanel,
  StatusBadge,
} from "@/features/admin/components/admin-ui";
import { BrandForm } from "@/features/admin/components/brand-form";
import { deleteBrand } from "@/features/admin/actions/brands";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-8">
      <AdminPageHeader
        title="Brands"
        description="Διαχείριση καταλόγου brands που εμφανίζονται στο shop."
      />

      {editing ? (
        <BrandForm brand={editing} key={`edit-${editing.id}`} />
      ) : null}

      <BrandForm
        key="new"
        defaultOpen={brands.length === 0 && !editing}
      />

      <AdminPanel
        title="Όλα τα brands"
        description={
          brands.length
            ? `${brands.length} συνολικά · πάτα Επεξεργασία για αλλαγές`
            : "Δεν υπάρχουν ακόμα — πρόσθεσε το πρώτο παραπάνω."
        }
      >
        {brands.length === 0 ? (
          <AdminEmpty>Χωρίς brands, τα προϊόντα δεν μπορούν να αντιστοιχιστούν.</AdminEmpty>
        ) : (
          <ul className="grid gap-2">
            {brands.map((b) => {
              const isEditing = editing?.id === b.id;
              return (
                <li
                  key={b.id}
                  className={cn(
                    "flex flex-col gap-3 rounded-xl border px-4 py-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between",
                    isEditing
                      ? "border-coral/40 bg-coral/[0.04]"
                      : "border-oak/30 bg-bg/40 hover:border-oak/45"
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{b.name}</p>
                      {b.featured ? (
                        <StatusBadge tone="info">Featured</StatusBadge>
                      ) : null}
                      <StatusBadge tone={b.active ? "success" : "neutral"}>
                        {b.active ? "Ενεργό" : "Ανενεργό"}
                      </StatusBadge>
                      {isEditing ? (
                        <StatusBadge tone="warning">Επεξεργασία</StatusBadge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">
                      <span className="font-mono text-xs">{b.slug}</span>
                      <span className="mx-1.5 text-ink/25">·</span>
                      {b._count.products} προϊόντ
                      {b._count.products === 1 ? "ο" : "α"}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {isEditing ? (
                      <Link
                        href="/admin/brands"
                        className="text-sm font-medium text-ink-muted hover:text-ink hover:underline"
                      >
                        Κλείσιμο
                      </Link>
                    ) : (
                      <Link href={`/admin/brands?edit=${b.id}`}>
                        <Button type="button" size="sm" variant="secondary">
                          Επεξεργασία
                        </Button>
                      </Link>
                    )}
                    {b._count.products === 0 ? (
                      <form action={deleteBrand.bind(null, b.id)}>
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          className="text-coral hover:bg-coral/10 hover:text-coral"
                        >
                          Διαγραφή
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}
