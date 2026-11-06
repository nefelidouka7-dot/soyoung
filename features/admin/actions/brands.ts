"use server";

import { revalidatePath } from "next/cache";
import { invalidateNavigation } from "@/server/cache-tags";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { sanitizeExternalHttpsUrl, sanitizePublicHref } from "@/lib/safe-href";
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

/** Rejects unsafe URLs; `undefined` means a field was invalid. */
function safeBrandUrls(data: z.infer<typeof brandSchema>) {
  const website = data.website?.trim() ? sanitizeExternalHttpsUrl(data.website) : null;
  const logo = data.logo?.trim() ? sanitizePublicHref(data.logo) : null;
  const banner = data.banner?.trim() ? sanitizePublicHref(data.banner) : null;
  if (
    (data.website?.trim() && !website) ||
    (data.logo?.trim() && !logo) ||
    (data.banner?.trim() && !banner)
  ) {
    return undefined;
  }
  return { website, logo, banner };
}

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

function toBrandData(
  data: z.infer<typeof brandSchema>,
  urls: NonNullable<ReturnType<typeof safeBrandUrls>>
) {
  return {
    name: data.name.trim(),
    slug: data.slug?.trim() ? slugify(data.slug) : slugify(data.name),
    description: data.description?.trim() || null,
    logo: urls.logo,
    banner: urls.banner,
    website: urls.website,
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
  if (!parsed.success) return { error: "Έλεγξε τα πεδία του brand." };
  const urls = safeBrandUrls(parsed.data);
  if (!urls) return { error: "Μη έγκυρο URL (website: μόνο https://)." };

  try {
    await prisma.brand.create({ data: toBrandData(parsed.data, urls) });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Υπάρχει ήδη brand με αυτό το slug." };
    }
    throw e;
  }
  invalidateNavigation();
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
  if (!parsed.success) return { error: "Έλεγξε τα πεδία του brand." };
  const urls = safeBrandUrls(parsed.data);
  if (!urls) return { error: "Μη έγκυρο URL (website: μόνο https://)." };

  try {
    await prisma.brand.update({
      where: { id },
      data: toBrandData(parsed.data, urls),
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Υπάρχει ήδη brand με αυτό το slug." };
    }
    throw e;
  }
  invalidateNavigation();
  revalidatePath("/admin/brands");
  redirect("/admin/brands");
}

export async function deleteBrand(id: string) {
  await requireAdmin();
  const count = await prisma.product.count({ where: { brandId: id } });
  if (count > 0) {
    throw new Error("Δεν γίνεται διαγραφή brand που έχει προϊόντα.");
  }
  await prisma.brand.delete({ where: { id } });
  invalidateNavigation();
  revalidatePath("/admin/brands");
}
