import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
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
      compareAtPrice:
        v.compareAtPrice != null ? decimalToNumber(v.compareAtPrice) : null,
    })),
  };

  return (
    <div>
      <AdminPageHeader
        title={product.name}
        description="Επεξεργασία στοιχείων, stock και media."
        actions={
          product.status === "ACTIVE" ? (
            <Link
              href={`/product/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "secondary", size: "sm", className: "gap-1.5" })}
            >
              Προβολή στο shop
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </Link>
          ) : (
            <span
              className={buttonVariants({
                variant: "secondary",
                size: "sm",
                className: "cursor-not-allowed gap-1.5 opacity-50",
              })}
              title="Το προϊόν φαίνεται στο shop μόνο όταν είναι Ενεργό"
            >
              Προβολή στο shop
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </span>
          )
        }
        breadcrumb={
          <AdminBreadcrumb
            items={[
              { href: "/admin/products", label: "Προϊόντα" },
              { label: product.name },
            ]}
          />
        }
      />
      {/* Remount after a save so variant ids and stock baselines come from the DB. */}
      <ProductForm
        key={product.updatedAt.toISOString()}
        product={serialized}
        brands={brands}
        categories={categories}
        skinTypes={skinTypes}
      />
      <ProductDangerActions productId={product.id} />
    </div>
  );
}
