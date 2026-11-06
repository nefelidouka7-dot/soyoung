"use server";

import { revalidatePath } from "next/cache";
import { invalidateNavigation } from "@/server/cache-tags";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma, ProductStatus, VariantType } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { requireAdmin } from "@/lib/admin";
import { sanitizePublicHref } from "@/lib/safe-href";
import { slugify } from "@/lib/utils";
import { storage } from "@/lib/storage";
import {
  MAX_PRODUCT_IMAGE_BYTES,
  MAX_PRODUCT_VIDEO_BYTES,
} from "@/lib/media-limits";

const productSchema = z.object({
  name: z.string().min(1, "Το όνομα είναι υποχρεωτικό"),
  slug: z.string().min(1).optional(),
  sku: z.string().optional(),
  brandId: z.string().min(1, "Το brand είναι υποχρεωτικό"),
  categoryId: z.string().min(1, "Η κατηγορία είναι υποχρεωτική"),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  ingredients: z.string().optional(),
  howToUse: z.string().optional(),
  price: z.coerce.number().positive("Η τιμή πρέπει να είναι θετική"),
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

export type UploadProductImageResult = { url?: string; error?: string };

/** Upload one product image immediately (used by the product form gallery). */
export async function uploadProductImage(
  formData: FormData
): Promise<UploadProductImageResult> {
  await requireAdmin();
  const entry = formData.get("file");
  if (!(entry instanceof File) || entry.size === 0) {
    return { error: "Διάλεξε μια εικόνα." };
  }
  if (entry.size > MAX_PRODUCT_IMAGE_BYTES) {
    return { error: "Η εικόνα είναι πολύ μεγάλη (μέγ. 8MB)." };
  }

  try {
    const buffer = Buffer.from(await entry.arrayBuffer());
    const stored = await storage.upload(
      buffer,
      entry.name || "upload.jpg",
      entry.type || "image/jpeg"
    );
    return { url: stored.url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Only JPEG") || msg.includes("not a valid image")) {
      return { error: "Επίτρεπτα μόνο JPEG, PNG, WebP ή GIF." };
    }
    return { error: "Αποτυχία ανεβάσματος. Δοκίμασε άλλη εικόνα." };
  }
}

export type UploadProductVideoResult = { url?: string; error?: string };

/** Upload one vertical product reel (MP4/WebM) to storage. */
export async function uploadProductVideo(
  formData: FormData
): Promise<UploadProductVideoResult> {
  await requireAdmin();
  const entry = formData.get("file");
  if (!(entry instanceof File) || entry.size === 0) {
    return { error: "Διάλεξε ένα βίντεο." };
  }
  if (entry.size > MAX_PRODUCT_VIDEO_BYTES) {
    return { error: "Το βίντεο είναι πολύ μεγάλο (μέγ. 25MB)." };
  }

  try {
    const buffer = Buffer.from(await entry.arrayBuffer());
    const stored = await storage.upload(
      buffer,
      entry.name || "reel.mp4",
      entry.type || "video/mp4"
    );
    return { url: stored.url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (
      msg.includes("MP4") ||
      msg.includes("not a valid video") ||
      msg.includes("Only JPEG")
    ) {
      return { error: "Επίτρεπτα μόνο MP4 ή WebM." };
    }
    return { error: "Αποτυχία ανεβάσματος. Δοκίμασε άλλο αρχείο." };
  }
}

/** Optional poster frame for the product reel. */
export async function uploadProductVideoPoster(
  formData: FormData
): Promise<UploadProductVideoResult> {
  return uploadProductImage(formData);
}

/** Optional media URL field: own uploads/paths or the https allowlist only. */
function mediaUrlField(formData: FormData, name: string) {
  const raw = String(formData.get(name) ?? "").trim();
  if (!raw) return { url: null };
  const url = sanitizePublicHref(raw);
  return url ? { url } : { error: "Μη έγκυρο URL βίντεο/εικόνας." };
}

async function collectImageUrls(formData: FormData): Promise<string[]> {
  const fromText = String(formData.get("imageUrls") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((url) => {
      const safe = sanitizePublicHref(url);
      if (!safe) throw new Error(`Μη έγκυρο URL εικόνας: ${url.slice(0, 80)}`);
      return safe;
    });

  const uploaded: string[] = [];
  for (const entry of formData.getAll("imageFiles")) {
    if (!(entry instanceof File) || entry.size === 0) continue;
    if (entry.size > MAX_PRODUCT_IMAGE_BYTES) {
      throw new Error("Η εικόνα είναι πολύ μεγάλη (μέγ. 8MB).");
    }
    const buffer = Buffer.from(await entry.arrayBuffer());
    const stored = await storage.upload(
      buffer,
      entry.name || "upload.jpg",
      entry.type || "image/jpeg"
    );
    uploaded.push(stored.url);
  }

  // Prefer explicit gallery order from imageUrls; append any leftover file uploads.
  const seen = new Set(fromText);
  return [...fromText, ...uploaded.filter((u) => !seen.has(u))];
}

function collectVariants(formData: FormData) {
  const ids = formData.getAll("variantId").map(String);
  const originalStocks = formData.getAll("variantStockOriginal").map(String);
  const names = formData.getAll("variantName").map(String);
  const types = formData.getAll("variantType").map(String);
  const skus = formData.getAll("variantSku").map(String);
  const prices = formData.getAll("variantPrice").map(String);
  const stocks = formData.getAll("variantStock").map(String);
  const images = formData.getAll("variantImage").map(String);

  const rows = [];
  for (let i = 0; i < names.length; i++) {
    const name = names[i]?.trim();
    const sku = skus[i]?.trim();
    if (!name || !sku) continue;
    const type = (types[i] || "SHADE") as VariantType;
    const priceRaw = prices[i]?.trim();
    const stock = Number.parseInt(stocks[i] || "0", 10);
    // Invalid / off-allowlist variant images are dropped.
    const image = sanitizePublicHref(images[i]) ?? null;
    const originalStock = Number.parseInt(originalStocks[i] ?? "", 10);
    rows.push({
      id: ids[i]?.trim() || null,
      originalStock: Number.isFinite(originalStock) ? originalStock : null,
      name,
      type,
      sku,
      price:
        priceRaw && !Number.isNaN(Number(priceRaw))
          ? new Prisma.Decimal(priceRaw)
          : null,
      stock: Number.isFinite(stock) ? Math.max(0, stock) : 0,
      image,
    });
  }
  return rows;
}

type VariantInput = ReturnType<typeof collectVariants>[number];

/** Row shape for creating a variant (drops the form-only fields). */
function newVariantData(v: VariantInput) {
  return {
    name: v.name,
    type: v.type,
    sku: v.sku,
    price: v.price,
    stock: v.stock,
    image: v.image,
    active: true,
  };
}

/**
 * New stock after an edit. With a baseline (the value the form loaded) only the
 * admin's change is applied, so sales made while the form was open survive.
 */
function editedStock(current: number, submitted: number, baseline: number | null) {
  if (baseline == null) return submitted;
  return Math.max(0, current + (submitted - baseline));
}

export async function createProduct(
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  await requireAdmin();
  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return {
      error: "Διόρθωσε τα σφάλματα της φόρμας.",
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
      error: e instanceof Error ? e.message : "Μη έγκυρο upload εικόνας.",
    };
  }
  const videoField = mediaUrlField(formData, "videoUrl");
  const posterField = mediaUrlField(formData, "videoPosterUrl");
  if (videoField.error || posterField.error) {
    return { error: videoField.error ?? posterField.error };
  }
  const videoUrl = videoField.url;
  const videoPosterUrl = posterField.url;
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
        videoUrl,
        videoPosterUrl: videoUrl ? videoPosterUrl : null,
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
        variants: variants.length
          ? { create: variants.map(newVariantData) }
          : undefined,
      },
    });
    productId = product.id;
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { error: "Υπάρχει ήδη προϊόν με αυτό το slug ή SKU." };
    }
    throw e;
  }
  invalidateNavigation();
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
      error: "Διόρθωσε τα σφάλματα της φόρμας.",
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
      error: e instanceof Error ? e.message : "Μη έγκυρο upload εικόνας.",
    };
  }
  const videoField = mediaUrlField(formData, "videoUrl");
  const posterField = mediaUrlField(formData, "videoPosterUrl");
  if (videoField.error || posterField.error) {
    return { error: videoField.error ?? posterField.error };
  }
  const videoUrl = videoField.url;
  const videoPosterUrl = posterField.url;
  const variants = collectVariants(formData);

  const stockBaselineRaw = String(formData.get("stockOriginal") ?? "").trim();
  const stockBaseline =
    stockBaselineRaw === "" ? null : Number.parseInt(stockBaselineRaw, 10);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Lock the product and its variants: checkout decrements stock with
      // increments, and we only add the admin's delta on top of the live value.
      const [current] = await tx.$queryRaw<
        { stock: number; publishedAt: Date | null }[]
      >`SELECT "stock", "publishedAt" FROM "Product" WHERE "id" = ${id} FOR UPDATE`;
      if (!current) return { error: "Το προϊόν δεν βρέθηκε." };
      const currentVariants = await tx.$queryRaw<{ id: string; stock: number }[]>`
        SELECT "id", "stock" FROM "ProductVariant" WHERE "productId" = ${id} FOR UPDATE`;
      const variantStock = new Map(currentVariants.map((v) => [v.id, v.stock]));

      // Images are rebuilt from the gallery order; keep alt texts by URL.
      const oldImages = await tx.productImage.findMany({
        where: { productId: id },
        select: { url: true, alt: true },
      });
      const altByUrl = new Map(oldImages.map((img) => [img.url, img.alt]));

      await tx.productSkinType.deleteMany({ where: { productId: id } });
      await tx.productImage.deleteMany({ where: { productId: id } });

      // Variants are updated in place (cart and order lines point at their
      // ids); only rows removed in the form are deleted. Deletes go first so a
      // SKU freed by a removed row can be reused in the same save.
      const keptIds = new Set(
        variants.flatMap((v) => (v.id && variantStock.has(v.id) ? [v.id] : []))
      );
      const removedIds = currentVariants
        .map((v) => v.id)
        .filter((vid) => !keptIds.has(vid));
      if (removedIds.length > 0) {
        await tx.productVariant.deleteMany({ where: { id: { in: removedIds } } });
      }

      const ledger: { variantId: string | null; change: number }[] = [];
      for (const v of variants) {
        const live = v.id ? variantStock.get(v.id) : undefined;
        if (v.id && live !== undefined) {
          const stock = editedStock(live, v.stock, v.originalStock);
          if (stock !== live) ledger.push({ variantId: v.id, change: stock - live });
          await tx.productVariant.update({
            where: { id: v.id },
            // active / compareAtPrice / options aren't in the form: leave them.
            data: {
              name: v.name,
              type: v.type,
              sku: v.sku,
              price: v.price,
              stock,
              image: v.image,
            },
          });
        } else {
          const created = await tx.productVariant.create({
            data: { ...newVariantData(v), productId: id },
            select: { id: true },
          });
          if (v.stock > 0) ledger.push({ variantId: created.id, change: v.stock });
        }
      }

      const stock = editedStock(current.stock, data.stock, stockBaseline);
      if (stock !== current.stock) {
        ledger.push({ variantId: null, change: stock - current.stock });
      }

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
          stock,
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
          videoUrl,
          videoPosterUrl: videoUrl ? videoPosterUrl : null,
          // First time it went live; later saves keep the original date.
          publishedAt:
            current.publishedAt ??
            (data.status === "ACTIVE" ? new Date() : null),
          skinTypes: data.skinTypeIds.length
            ? {
                create: data.skinTypeIds.map((skinTypeId) => ({ skinTypeId })),
              }
            : undefined,
          images: imageUrls.length
            ? {
                create: imageUrls.map((url, i) => ({
                  url,
                  alt: altByUrl.get(url) ?? null,
                  sortOrder: i,
                  isPrimary: i === 0,
                })),
              }
            : undefined,
        },
      });

      if (ledger.length > 0) {
        await tx.inventoryLedger.createMany({
          data: ledger.map((entry) => ({
            productId: id,
            variantId: entry.variantId,
            change: entry.change,
            type: entry.change > 0 ? "RESTOCK" : "ADJUSTMENT",
            note: "Επεξεργασία προϊόντος",
          })),
        });
      }
      return null;
    });
    if (result) return result;
    invalidateNavigation();
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath(`/product/${data.slug}`);
    revalidatePath("/skincare");
    return {};
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { error: "Υπάρχει ήδη προϊόν με αυτό το slug ή SKU." };
    }
    throw e;
  }
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id } });
  invalidateNavigation();
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export type DuplicateProductResult =
  | { id: string; name: string }
  | { error: string };

export async function duplicateProduct(
  id: string
): Promise<DuplicateProductResult> {
  await requireAdmin();
  const product = await prisma.product.findUnique({
    where: { id },
    include: { skinTypes: true, images: true, variants: true },
  });
  if (!product) {
    return { error: "Το προϊόν δεν βρέθηκε." };
  }

  const baseSlug = `${product.slug}-copy`;
  let slug = baseSlug;
  let n = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${n++}`;
  }

  try {
    const created = await prisma.product.create({
      data: {
        name: `${product.name} (Copy)`,
        slug,
        sku: product.sku
          ? `${product.sku}-COPY-${Date.now().toString(36)}`
          : null,
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
        videoUrl: product.videoUrl,
        videoPosterUrl: product.videoPosterUrl,
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

    invalidateNavigation();
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${created.id}`);
    return { id: created.id, name: created.name };
  } catch {
    return { error: "Η αντιγραφή απέτυχε. Δοκίμασε ξανά." };
  }
}
