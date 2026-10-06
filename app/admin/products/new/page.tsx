import { prisma } from "@/db/prisma";
import { requireAdmin } from "@/lib/admin";
import {
  AdminBreadcrumb,
  AdminPageHeader,
} from "@/features/admin/components/admin-ui";
import { ProductForm } from "@/features/admin/components/product-form";

export default async function NewProductPage() {
  await requireAdmin();
  const [brands, categories, skinTypes] = await Promise.all([
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.skinType.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Προσθήκη προϊόντος"
        description="Όνομα, brand, τιμή — και είσαι έτοιμος. Τα υπόλοιπα είναι προαιρετικά."
        breadcrumb={
          <AdminBreadcrumb
            items={[
              { href: "/admin/products", label: "Προϊόντα" },
              { label: "Νέο" },
            ]}
          />
        }
      />
      <ProductForm
        brands={brands}
        categories={categories}
        skinTypes={skinTypes}
      />
    </div>
  );
}
