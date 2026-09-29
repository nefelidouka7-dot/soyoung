"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/utils";

const schema = z.object({
  kind: z.enum(["concern", "skin"]),
  name: z.string().min(1),
  nameEl: z.string().min(1),
  slug: z.string().optional(),
  story: z.string().optional(),
  storyEn: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
  active: z.coerce.boolean().optional(),
});

export type SkinGuideState = { error?: string };

function parse(formData: FormData) {
  return schema.safeParse({
    kind: formData.get("kind"),
    name: formData.get("name"),
    nameEl: formData.get("nameEl"),
    slug: formData.get("slug") || undefined,
    story: formData.get("story") || undefined,
    storyEn: formData.get("storyEn") || undefined,
    sortOrder: formData.get("sortOrder") ?? 0,
    active: formData.getAll("active").map(String).includes("true"),
  });
}

function toData(data: z.infer<typeof schema>, existingSlug?: string) {
  return {
    name: data.name.trim(),
    nameEl: data.nameEl.trim(),
    slug: existingSlug || (data.slug?.trim() ? slugify(data.slug) : slugify(data.name)),
    story: data.story?.trim() || null,
    storyEn: data.storyEn?.trim() || null,
    sortOrder: data.sortOrder,
    active: data.active !== false,
  };
}

function refresh() {
  revalidatePath("/admin/skin");
  revalidatePath("/");
  revalidatePath("/skincare");
}

export async function saveSkinGuide(
  id: string | null,
  _prev: SkinGuideState,
  formData: FormData
): Promise<SkinGuideState> {
  await requireAdmin();
  const parsed = parse(formData);
  if (!parsed.success) return { error: "Συμπλήρωσε τίτλο στα ελληνικά και στα αγγλικά." };

  const kind = parsed.data.kind;
  const existing =
    id && kind === "concern"
      ? await prisma.concern.findUnique({ where: { id }, select: { slug: true } })
      : id && kind === "skin"
        ? await prisma.skinType.findUnique({ where: { id }, select: { slug: true } })
        : null;
  const data = toData(parsed.data, existing?.slug);

  try {
    if (kind === "concern") {
      if (id) await prisma.concern.update({ where: { id }, data });
      else await prisma.concern.create({ data });
    } else if (id) {
      const { story, storyEn, ...rest } = data;
      await prisma.skinType.update({
        where: { id },
        data: { ...rest, story, storyEn },
      });
    } else {
      await prisma.skinType.create({
        data: {
          ...data,
          description: data.story || data.nameEl,
        },
      });
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Υπάρχει ήδη εγγραφή με αυτό το slug." };
    }
    throw e;
  }

  refresh();
  redirect("/admin/skin");
}

export async function deleteSkinGuide(kind: "concern" | "skin", id: string) {
  await requireAdmin();
  if (kind === "concern") {
    const used = await prisma.productConcern.count({ where: { concernId: id } });
    if (used > 0) throw new Error("Ο στόχος χρησιμοποιείται σε προϊόντα.");
    await prisma.concern.delete({ where: { id } });
  } else {
    const used = await prisma.productSkinType.count({ where: { skinTypeId: id } });
    if (used > 0) throw new Error("Ο τύπος δέρματος χρησιμοποιείται σε προϊόντα.");
    await prisma.skinType.delete({ where: { id } });
  }
  refresh();
}
