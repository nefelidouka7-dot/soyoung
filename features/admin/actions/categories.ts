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
  success?: string;
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

/** True if setting `id`'s parent to `parentId` would create a cycle. */
async function wouldCreateCycle(id: string, parentId: string | null) {
  if (!parentId) return false;
  let current: string | null = parentId;
  const seen = new Set<string>();
  while (current) {
    if (current === id) return true;
    if (seen.has(current)) return true;
    seen.add(current);
    const node: { parentId: string | null } | null =
      await prisma.category.findUnique({
        where: { id: current },
        select: { parentId: true },
      });
    current = node?.parentId ?? null;
  }
  return false;
}

function revalidateCategories() {
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function createCategory(
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  await requireAdmin();
  const parsed = parseCategory(formData);
  if (!parsed.success) return { error: "Έλεγξε τα πεδία της κατηγορίας." };

  const data = toCategoryData(parsed.data);

  if (data.parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: data.parentId },
      select: { id: true },
    });
    if (!parent) return { error: "Η γονική κατηγορία δεν βρέθηκε." };
  }

  // Place new category at the end of its sibling group if sortOrder left at 0
  // and siblings already exist — only when user didn't pick a custom order.
  if (data.sortOrder === 0) {
    const max = await prisma.category.aggregate({
      where: { parentId: data.parentId },
      _max: { sortOrder: true },
    });
    data.sortOrder = (max._max.sortOrder ?? -1) + 1;
  }

  try {
    await prisma.category.create({ data });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { error: "Υπάρχει ήδη κατηγορία με αυτό το slug." };
    }
    throw e;
  }
  revalidateCategories();
  redirect("/admin/categories");
}

export async function updateCategory(
  id: string,
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  await requireAdmin();
  const parsed = parseCategory(formData);
  if (!parsed.success) return { error: "Έλεγξε τα πεδία της κατηγορίας." };

  const data = toCategoryData(parsed.data);
  if (data.parentId === id) {
    return { error: "Μια κατηγορία δεν μπορεί να είναι γονική του εαυτού της." };
  }
  if (await wouldCreateCycle(id, data.parentId)) {
    return {
      error:
        "Δεν γίνεται — αυτή η γονική θα δημιουργούσε κύκλο στην ιεραρχία.",
    };
  }

  try {
    await prisma.category.update({ where: { id }, data });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { error: "Υπάρχει ήδη κατηγορία με αυτό το slug." };
    }
    throw e;
  }
  revalidateCategories();
  redirect("/admin/categories");
}

export async function deleteCategory(
  id: string
): Promise<{ error?: string } | void> {
  await requireAdmin();
  const [products, children] = await Promise.all([
    prisma.product.count({ where: { categoryId: id } }),
    prisma.category.count({ where: { parentId: id } }),
  ]);
  if (products > 0) {
    return {
      error: `Έχει ${products} προϊόντ${products === 1 ? "ο" : "α"} — μετακίνησέ τα πρώτα.`,
    };
  }
  if (children > 0) {
    return {
      error: `Έχει ${children} υποκατηγορί${children === 1 ? "α" : "ες"} — διέγραψέ τες ή μετακίνησέ τες πρώτα.`,
    };
  }
  await prisma.category.delete({ where: { id } });
  revalidateCategories();
}

export async function toggleCategory(id: string, active: boolean) {
  await requireAdmin();
  await prisma.category.update({ where: { id }, data: { active } });
  revalidateCategories();
}

/** Persist sibling order after drag-and-drop. `parentId` null = top-level. */
export async function reorderCategories(
  parentId: string | null,
  orderedIds: string[]
): Promise<{ error?: string } | void> {
  await requireAdmin();
  if (orderedIds.length === 0) return;

  const siblings = await prisma.category.findMany({
    where: { parentId },
    select: { id: true },
  });
  const siblingIds = new Set(siblings.map((s) => s.id));

  if (
    orderedIds.length !== siblingIds.size ||
    orderedIds.some((id) => !siblingIds.has(id))
  ) {
    return { error: "Η σειρά δεν είναι έγκυρη. Ανανέωσε τη σελίδα." };
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.category.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );

  revalidateCategories();
}

/** Move a category under a new parent (or to top-level) and place it last. */
export async function reparentCategory(
  id: string,
  newParentId: string | null
): Promise<{ error?: string } | void> {
  await requireAdmin();
  if (newParentId === id) {
    return { error: "Μια κατηγορία δεν μπορεί να είναι γονική του εαυτού της." };
  }
  if (await wouldCreateCycle(id, newParentId)) {
    return {
      error: "Δεν γίνεται — αυτή η γονική θα δημιουργούσε κύκλο στην ιεραρχία.",
    };
  }

  const max = await prisma.category.aggregate({
    where: { parentId: newParentId },
    _max: { sortOrder: true },
  });

  await prisma.category.update({
    where: { id },
    data: {
      parentId: newParentId,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });

  revalidateCategories();
}
