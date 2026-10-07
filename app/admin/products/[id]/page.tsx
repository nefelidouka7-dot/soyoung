import { notFound } from "next/navigation";
import { prisma } from "@/db/prisma";
import { requireAdmin, decimalToNumber } from "@/lib/admin";
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

  const serialized = {
    ...product,
    price: decimalToNumber(product.price),
    compareAtPrice:
      product.compareAtPrice != null
        ? decimalToNumber(product.compareAtPrice)
        : null,
    cost: product.cost != null ? decimalToNumber(product.cost) : null,
    variants: product.variants.map((v) => ({
      ...v,
      price: v.price != null ? decimalToNumber(v.price) : null,
    })),
  };

  return (
    <div>
      <AdminPageHeader
        title={product.name}
        description="Επεξεργασία στοιχείων, stock και media."
        breadcrumb={
          <AdminBreadcrumb
            items={[
              { href: "/admin/products", label: "Προϊόντα" },
              { label: product.name },
            ]}
          />
        }
      />
      <ProductForm
        product={serialized}
        brands={brands}
        categories={categories}
        skinTypes={skinTypes}
      />
      <ProductDangerActions productId={product.id} />
    </div>
  );
}
