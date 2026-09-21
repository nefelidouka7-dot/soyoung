"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma, ProductStatus, VariantType } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/utils";
import { storage } from "@/lib/storage";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1).optional(),
  sku: z.string().optional(),
  brandId: z.string().min(1, "Brand is required"),
  categoryId: z.string().min(1, "Category is required"),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  ingredients: z.string().optional(),
  howToUse: z.string().optional(),
  price: z.coerce.number().positive("Price must be positive"),
  compareAtPrice: z.coerce.number().positive().optional().or(z.literal("")),
  cost: z.coerce.number().nonnegative().optional().or(z.literal("")),
  stock: z.coerce.number().int().nonnegative().default(0),
  lowStockThreshold: z.coerce.number().int().nonnegative().default(5),
  productType: z.string().optional(),
  volume: z.string().optional(),
  weight: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  featured: z.coerce.boolean().optional(),
  bestSeller: z.coerce.boolean().optional(),
  skinTypeIds: z.array(z.string()).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export type ProductActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function parseOptionalDecimal(
  value: number | "" | undefined
): Prisma.Decimal | null {
  if (value === "" || value == null || Number.isNaN(value)) return null;
  return new Prisma.Decimal(value);
}

function parseFormData(formData: FormData) {
  const skinTypeIds = formData
    .getAll("skinTypeIds")
    .map(String)
    .filter(Boolean);
  return productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    sku: formData.get("sku") || undefined,
    brandId: formData.get("brandId"),
    categoryId: formData.get("categoryId"),
    shortDescription: formData.get("shortDescription") || undefined,
    description: formData.get("description") || undefined,
    ingredients: formData.get("ingredients") || undefined,
    howToUse: formData.get("howToUse") || undefined,
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") || "",
    cost: formData.get("cost") || "",
    stock: formData.get("stock") ?? 0,
    lowStockThreshold: formData.get("lowStockThreshold") ?? 5,
    productType: formData.get("productType") || undefined,
    volume: formData.get("volume") || undefined,
    weight: formData.get("weight") || undefined,
    tags: formData.get("tags") || undefined,
    status: formData.get("status") ?? "DRAFT",
    featured:
      formData.get("featured") === "on" || formData.get("featured") === "true",
    bestSeller:
      formData.get("bestSeller") === "on" ||
      formData.get("bestSeller") === "true",
    skinTypeIds,
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
  });
}

function toProductData(data: z.infer<typeof productSchema>) {
  const tags = (data.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const slug = data.slug?.trim() ? slugify(data.slug) : slugify(data.name);
  const status = data.status as ProductStatus;

  return {
    name: data.name.trim(),
    slug,
    sku: data.sku?.trim() || null,
    brandId: data.brandId,
    categoryId: data.categoryId,
    shortDescription: data.shortDescription?.trim() || null,
    description: data.description?.trim() || null,
    ingredients: data.ingredients?.trim() || null,
    howToUse: data.howToUse?.trim() || null,
    price: new Prisma.Decimal(data.price),
    compareAtPrice: parseOptionalDecimal(data.compareAtPrice),
    cost: parseOptionalDecimal(data.cost),
    stock: data.stock,
    lowStockThreshold: data.lowStockThreshold,
    productType: data.productType?.trim() || null,
    volume: data.volume?.trim() || null,
    weight: data.weight?.trim() || null,
    tags,
    status,
    featured: Boolean(data.featured),
    bestSeller: Boolean(data.bestSeller),
    seoTitle: data.seoTitle?.trim() || null,
    seoDescription: data.seoDescription?.trim() || null,
    publishedAt: status === "ACTIVE" ? new Date() : null,
    skinTypeIds: data.skinTypeIds ?? [],
  };
}

async function collectImageUrls(formData: FormData): Promise<string[]> {
  const fromText = String(formData.get("imageUrls") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const uploaded: string[] = [];
  for (const entry of formData.getAll("imageFiles")) {
    if (!(entry instanceof File) || entry.size === 0) continue;
    const buffer = Buffer.from(await entry.arrayBuffer());
    const stored = await storage.upload(
      buffer,
      entry.name || "upload.jpg",
      entry.type || "image/jpeg"
    );
    uploaded.push(stored.url);
  }

  return [...fromText, ...uploaded];
}

function collectVariants(formData: FormData) {
  const names = formData.getAll("variantName").map(String);
  const types = formData.getAll("variantType").map(String);
  const skus = formData.getAll("variantSku").map(String);
  const prices = formData.getAll("variantPrice").map(String);
  const stocks = formData.getAll("variantStock").map(String);

  const rows = [];
  for (let i = 0; i < names.length; i++) {
    const name = names[i]?.trim();
    const sku = skus[i]?.trim();
    if (!name || !sku) continue;
    const type = (types[i] || "SHADE") as VariantType;
    const priceRaw = prices[i]?.trim();
    const stock = Number.parseInt(stocks[i] || "0", 10);
    rows.push({
      name,
      type,
      sku,
      price:
        priceRaw && !Number.isNaN(Number(priceRaw))
          ? new Prisma.Decimal(priceRaw)
          : null,
      stock: Number.isFinite(stock) ? stock : 0,
      active: true,
    });
  }
  return rows;
}

export async function createProduct(
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  await requireAdmin();
  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return {
      error: "Please fix the form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const data = toProductData(parsed.data);
  let imageUrls: string[];
  try {
    imageUrls = await collectImageUrls(formData);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Invalid image upload.",
    };
  }
  const variants = collectVariants(formData);
  let productId: string;
  try {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        sku: data.sku,
        brandId: data.brandId,
        categoryId: data.categoryId,
        shortDescription: data.shortDescription,
        description: data.description,
        ingredients: data.ingredients,
        howToUse: data.howToUse,
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        cost: data.cost,
        stock: data.stock,
        lowStockThreshold: data.lowStockThreshold,
        productType: data.productType,
        volume: data.volume,
        weight: data.weight,
        tags: data.tags,
        status: data.status,
        featured: data.featured,
        bestSeller: data.bestSeller,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        publishedAt: data.publishedAt,
        skinTypes: data.skinTypeIds.length
          ? { create: data.skinTypeIds.map((skinTypeId) => ({ skinTypeId })) }
          : undefined,
        images: imageUrls.length
          ? {
              create: imageUrls.map((url, i) => ({
                url,
                sortOrder: i,
                isPrimary: i === 0,
              })),
            }
          : undefined,
        variants: variants.length ? { create: variants } : undefined,
      },
    });
    productId = product.id;
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { error: "A product with this slug or SKU already exists." };
    }
    throw e;
  }
  revalidatePath("/admin/products");
  redirect(`/admin/products/${productId}`);
}

export async function updateProduct(
  id: string,
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  await requireAdmin();
  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return {
      error: "Please fix the form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const data = toProductData(parsed.data);
  let imageUrls: string[];
  try {
    imageUrls = await collectImageUrls(formData);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Invalid image upload.",
    };
  }
  const variants = collectVariants(formData);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.productSkinType.deleteMany({ where: { productId: id } });
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          slug: data.slug,
          sku: data.sku,
          brandId: data.brandId,
          categoryId: data.categoryId,
          shortDescription: data.shortDescription,
          description: data.description,
          ingredients: data.ingredients,
          howToUse: data.howToUse,
          price: data.price,
          compareAtPrice: data.compareAtPrice,
          cost: data.cost,
          stock: data.stock,
          lowStockThreshold: data.lowStockThreshold,
          productType: data.productType,
          volume: data.volume,
          weight: data.weight,
          tags: data.tags,
          status: data.status,
          featured: data.featured,
          bestSeller: data.bestSeller,
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          publishedAt: data.status === "ACTIVE" ? new Date() : null,
          skinTypes: data.skinTypeIds.length
            ? {
                create: data.skinTypeIds.map((skinTypeId) => ({ skinTypeId })),
              }
            : undefined,
          images: imageUrls.length
            ? {
                create: imageUrls.map((url, i) => ({
                  url,
                  sortOrder: i,
                  isPrimary: i === 0,
                })),
              }
            : undefined,
          variants: variants.length ? { create: variants } : undefined,
        },
      });
    });
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath("/skincare");
    return {};
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { error: "A product with this slug or SKU already exists." };
    }
    throw e;
  }
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function duplicateProduct(id: string) {
  await requireAdmin();
  const product = await prisma.product.findUnique({
    where: { id },
    include: { skinTypes: true, images: true, variants: true },
  });
  if (!product) {
    redirect("/admin/products");
  }

  const baseSlug = `${product.slug}-copy`;
  let slug = baseSlug;
  let n = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${n++}`;
  }

  const created = await prisma.product.create({
    data: {
      name: `${product.name} (Copy)`,
      slug,
      sku: product.sku ? `${product.sku}-COPY-${Date.now().toString(36)}` : null,
      shortDescription: product.shortDescription,
      description: product.description,
      ingredients: product.ingredients,
      howToUse: product.howToUse,
      productType: product.productType,
      volume: product.volume,
      weight: product.weight,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      cost: product.cost,
      stock: 0,
      lowStockThreshold: product.lowStockThreshold,
      status: "DRAFT",
      featured: false,
      bestSeller: false,
      tags: product.tags,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      brandId: product.brandId,
      categoryId: product.categoryId,
      skinTypes: product.skinTypes.length
        ? {
            create: product.skinTypes.map((st) => ({
              skinTypeId: st.skinTypeId,
            })),
          }
        : undefined,
      images: product.images.length
        ? {
            create: product.images.map((img, i) => ({
              url: img.url,
              alt: img.alt,
              sortOrder: i,
              isPrimary: i === 0,
            })),
          }
        : undefined,
    },
  });

  revalidatePath("/admin/products");
  redirect(`/admin/products/${created.id}`);
}
