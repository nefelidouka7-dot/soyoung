"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/utils";

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  parentId: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  active: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().default(0),
});

export type CategoryActionState = {
  error?: string;
};

function parseCategory(formData: FormData) {
  const parentId = String(formData.get("parentId") ?? "").trim();
  return categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    description: formData.get("description") || undefined,
    image: formData.get("image") || undefined,
    parentId: parentId || undefined,
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
    active: formData.getAll("active").map(String).includes("true"),
    sortOrder: formData.get("sortOrder") ?? 0,
  });
}

function toCategoryData(data: z.infer<typeof categorySchema>) {
  return {
    name: data.name.trim(),
    slug: data.slug?.trim() ? slugify(data.slug) : slugify(data.name),
    description: data.description?.trim() || null,
    image: data.image?.trim() || null,
    parentId: data.parentId || null,
    seoTitle: data.seoTitle?.trim() || null,
    seoDescription: data.seoDescription?.trim() || null,
    active: data.active !== false,
    sortOrder: data.sortOrder,
  };
}

export async function createCategory(
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  await requireAdmin();
  const parsed = parseCategory(formData);
  if (!parsed.success) return { error: "Please check the category fields." };

  try {
    await prisma.category.create({ data: toCategoryData(parsed.data) });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "A category with this slug already exists." };
    }
    throw e;
  }
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategory(
  id: string,
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  await requireAdmin();
  const parsed = parseCategory(formData);
  if (!parsed.success) return { error: "Please check the category fields." };

  const data = toCategoryData(parsed.data);
  if (data.parentId === id) {
    return { error: "A category cannot be its own parent." };
  }

  try {
    await prisma.category.update({ where: { id }, data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "A category with this slug already exists." };
    }
    throw e;
  }
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  const [products, children] = await Promise.all([
    prisma.product.count({ where: { categoryId: id } }),
    prisma.category.count({ where: { parentId: id } }),
  ]);
  if (products > 0 || children > 0) {
    throw new Error("Cannot delete a category with products or children.");
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
}
