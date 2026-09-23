import { notFound } from "next/navigation";
import { prisma } from "@/db/prisma";
import { requireAdmin } from "@/lib/admin";
import {
  AdminBreadcrumb,
  AdminPageHeader,
} from "@/features/admin/components/admin-ui";
import {
  ProductForm,
  ProductDangerActions,
} from "@/features/admin/components/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [brands, categories, skinTypes, product] = await Promise.all([
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.skinType.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findUnique({
      where: { id },
      include: {
        skinTypes: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { createdAt: "asc" } },
      },
    }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <AdminPageHeader
        title={product.name}
        description="Edit product details, stock, and media."
        breadcrumb={
          <AdminBreadcrumb
            items={[
              { href: "/admin/products", label: "Products" },
              { label: product.name },
            ]}
          />
        }
      />
      <ProductForm
        product={product}
        brands={brands}
        categories={categories}
        skinTypes={skinTypes}
      />
      <ProductDangerActions productId={product.id} />
    </div>
  );
}
