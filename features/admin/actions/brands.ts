"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/utils";

const brandSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  banner: z.string().optional(),
  website: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  active: z.coerce.boolean().optional(),
});

export type BrandActionState = {
  error?: string;
};

function parseBrand(formData: FormData) {
  return brandSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    description: formData.get("description") || undefined,
    logo: formData.get("logo") || undefined,
    banner: formData.get("banner") || undefined,
    website: formData.get("website") || undefined,
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
    featured: formData.get("featured") === "on" || formData.get("featured") === "true",
    active: formData.getAll("active").map(String).includes("true"),
  });
}

function toBrandData(data: z.infer<typeof brandSchema>) {
  return {
    name: data.name.trim(),
    slug: data.slug?.trim() ? slugify(data.slug) : slugify(data.name),
    description: data.description?.trim() || null,
    logo: data.logo?.trim() || null,
    banner: data.banner?.trim() || null,
    website: data.website?.trim() || null,
    seoTitle: data.seoTitle?.trim() || null,
    seoDescription: data.seoDescription?.trim() || null,
    featured: Boolean(data.featured),
    active: data.active !== false,
  };
}

export async function createBrand(
  _prev: BrandActionState,
  formData: FormData
): Promise<BrandActionState> {
  await requireAdmin();
  const parsed = parseBrand(formData);
  if (!parsed.success) return { error: "Please check the brand fields." };

  try {
    await prisma.brand.create({ data: toBrandData(parsed.data) });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "A brand with this slug already exists." };
    }
    throw e;
  }
  revalidatePath("/admin/brands");
  redirect("/admin/brands");
}

export async function updateBrand(
  id: string,
  _prev: BrandActionState,
  formData: FormData
): Promise<BrandActionState> {
  await requireAdmin();
  const parsed = parseBrand(formData);
  if (!parsed.success) return { error: "Please check the brand fields." };

  try {
    await prisma.brand.update({ where: { id }, data: toBrandData(parsed.data) });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "A brand with this slug already exists." };
    }
    throw e;
  }
  revalidatePath("/admin/brands");
  redirect("/admin/brands");
}

export async function deleteBrand(id: string) {
  await requireAdmin();
  const count = await prisma.product.count({ where: { brandId: id } });
  if (count > 0) {
    throw new Error("Cannot delete a brand with products.");
  }
  await prisma.brand.delete({ where: { id } });
  revalidatePath("/admin/brands");
}
