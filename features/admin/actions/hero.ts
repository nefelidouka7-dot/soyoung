"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/db/prisma";
import { requireAdmin } from "@/lib/admin";
import { storage } from "@/lib/storage";
import {
  DEFAULT_HERO_CAROUSEL_SETTINGS,
  HERO_CAROUSEL_SETTING_KEY,
} from "@/server/repositories/hero.repository";

export type HeroActionState = { error?: string; success?: string };

const optionalString = z
  .string()
  .optional()
  .transform((v) => {
    const t = v?.trim();
    return t ? t : null;
  });

const slideSchema = z.object({
  type: z.enum(["CAMPAIGN", "PRODUCT"]),
  active: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(999),
  imageUrl: z.string().min(1),
  imageAltEn: optionalString,
  imageAltEl: optionalString,
  eyebrowEn: optionalString,
  eyebrowEl: optionalString,
  headlineEn: z.string().min(1),
  headlineEl: z.string().min(1),
  headlineAccentEn: optionalString,
  headlineAccentEl: optionalString,
  subheadEn: optionalString,
  subheadEl: optionalString,
  ctaPrimaryLabelEn: optionalString,
  ctaPrimaryLabelEl: optionalString,
  ctaPrimaryHref: optionalString,
  ctaSecondaryLabelEn: optionalString,
  ctaSecondaryLabelEl: optionalString,
  ctaSecondaryHref: optionalString,
  productId: optionalString,
});

async function resolveImageUrl(
  formData: FormData,
  existing?: string | null
): Promise<{ url: string } | { error: string }> {
  const file = formData.get("imageFile");
  if (file instanceof File && file.size > 0) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const stored = await storage.upload(
        buffer,
        file.name || "hero.jpg",
        file.type || "image/jpeg"
      );
      return { url: stored.url };
    } catch (e) {
      return {
        error:
          e instanceof Error
            ? e.message
            : "Αποτυχία ανεβάσματος. Χρησιμοποίησε JPEG, PNG, WebP ή GIF.",
      };
    }
  }

  const url = String(formData.get("imageUrl") ?? "").trim();
  if (url) return { url };
  if (existing) return { url: existing };
  return { error: "Πρόσθεσε εικόνα hero — ανέβασε αρχείο ή επικόλλησε URL." };
}

function parseSlideForm(formData: FormData, imageUrl: string) {
  return slideSchema.safeParse({
    type: formData.get("type") || "CAMPAIGN",
    active:
      formData.get("active") === "on" || formData.get("active") === "true",
    sortOrder: formData.get("sortOrder") || "0",
    imageUrl,
    imageAltEn: formData.get("imageAltEn") || undefined,
    imageAltEl: formData.get("imageAltEl") || undefined,
    eyebrowEn: formData.get("eyebrowEn") || undefined,
    eyebrowEl: formData.get("eyebrowEl") || undefined,
    headlineEn: String(formData.get("headlineEn") ?? "").trim(),
    headlineEl: String(formData.get("headlineEl") ?? "").trim(),
    headlineAccentEn: formData.get("headlineAccentEn") || undefined,
    headlineAccentEl: formData.get("headlineAccentEl") || undefined,
    subheadEn: formData.get("subheadEn") || undefined,
    subheadEl: formData.get("subheadEl") || undefined,
    ctaPrimaryLabelEn: formData.get("ctaPrimaryLabelEn") || undefined,
    ctaPrimaryLabelEl: formData.get("ctaPrimaryLabelEl") || undefined,
    ctaPrimaryHref: formData.get("ctaPrimaryHref") || undefined,
    ctaSecondaryLabelEn: formData.get("ctaSecondaryLabelEn") || undefined,
    ctaSecondaryLabelEl: formData.get("ctaSecondaryLabelEl") || undefined,
    ctaSecondaryHref: formData.get("ctaSecondaryHref") || undefined,
    productId: formData.get("productId") || undefined,
  });
}

function toSlideData(data: z.infer<typeof slideSchema>) {
  if (data.type === "PRODUCT" && !data.productId) {
    return {
      error: "Για product promo, διάλεξε ποιο προϊόν θα προβληθεί." as const,
    };
  }
  return {
    data: {
      type: data.type,
      active: data.active,
      sortOrder: data.sortOrder,
      imageUrl: data.imageUrl,
      imageAltEn: data.imageAltEn,
      imageAltEl: data.imageAltEl,
      eyebrowEn: data.eyebrowEn,
      eyebrowEl: data.eyebrowEl,
      headlineEn: data.headlineEn,
      headlineEl: data.headlineEl,
      headlineAccentEn: data.headlineAccentEn,
      headlineAccentEl: data.headlineAccentEl,
      subheadEn: data.subheadEn,
      subheadEl: data.subheadEl,
      ctaPrimaryLabelEn: data.ctaPrimaryLabelEn,
      ctaPrimaryLabelEl: data.ctaPrimaryLabelEl,
      ctaPrimaryHref: data.ctaPrimaryHref,
      ctaSecondaryLabelEn: data.ctaSecondaryLabelEn,
      ctaSecondaryLabelEl: data.ctaSecondaryLabelEl,
      ctaSecondaryHref: data.ctaSecondaryHref,
      productId: data.type === "PRODUCT" ? data.productId : null,
    },
  };
}

export async function createHeroSlide(
  _prev: HeroActionState,
  formData: FormData
): Promise<HeroActionState> {
  await requireAdmin();
  const image = await resolveImageUrl(formData);
  if ("error" in image) return { error: image.error };

  const parsed = parseSlideForm(formData, image.url);
  if (!parsed.success) {
    return {
      error: "Συμπλήρωσε τα υποχρεωτικά πεδία (τίτλος σε EN και EL).",
    };
  }
  const next = toSlideData(parsed.data);
  if ("error" in next) return { error: next.error };

  await prisma.heroSlide.create({ data: next.data });
  revalidatePath("/");
  revalidatePath("/admin/hero");
  return { success: "Το slide προστέθηκε στο carousel της αρχικής." };
}

export async function updateHeroSlide(
  id: string,
  _prev: HeroActionState,
  formData: FormData
): Promise<HeroActionState> {
  await requireAdmin();
  const existing = await prisma.heroSlide.findUnique({ where: { id } });
  if (!existing) return { error: "Το slide δεν βρέθηκε." };

  const image = await resolveImageUrl(formData, existing.imageUrl);
  if ("error" in image) return { error: image.error };

  const parsed = parseSlideForm(formData, image.url);
  if (!parsed.success) {
    return {
      error: "Συμπλήρωσε τα υποχρεωτικά πεδία (τίτλος σε EN και EL).",
    };
  }
  const next = toSlideData(parsed.data);
  if ("error" in next) return { error: next.error };

  await prisma.heroSlide.update({ where: { id }, data: next.data });
  revalidatePath("/");
  revalidatePath("/admin/hero");
  revalidatePath(`/admin/hero/${id}`);
  return { success: "Το slide ενημερώθηκε." };
}

export async function toggleHeroSlide(id: string, active: boolean) {
  await requireAdmin();
  await prisma.heroSlide.update({ where: { id }, data: { active } });
  revalidatePath("/");
  revalidatePath("/admin/hero");
}

export async function deleteHeroSlide(id: string) {
  await requireAdmin();
  await prisma.heroSlide.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin/hero");
  redirect("/admin/hero");
}

export async function saveHeroCarouselSettings(
  _prev: HeroActionState,
  formData: FormData
): Promise<HeroActionState> {
  await requireAdmin();
  const autoplay =
    formData.get("autoplay") === "on" || formData.get("autoplay") === "true";
  const interval = Number(formData.get("intervalSeconds"));
  if (!Number.isFinite(interval) || interval < 2 || interval > 60) {
    return { error: "Διάλεξε από 2 έως 60 δευτερόλεπτα." };
  }

  const value = {
    autoplay,
    intervalSeconds: Math.round(interval),
  };

  await prisma.siteSetting.upsert({
    where: { key: HERO_CAROUSEL_SETTING_KEY },
    create: { key: HERO_CAROUSEL_SETTING_KEY, value },
    update: { value },
  });

  revalidatePath("/");
  revalidatePath("/admin/hero");
  return {
    success: autoplay
      ? `Autoplay ανοιχτό — αλλαγή κάθε ${value.intervalSeconds}δ`
      : "Autoplay κλειστό — μόνο swipe από τον επισκέπτη",
  };
}

export async function ensureDefaultHeroSettings() {
  await prisma.siteSetting.upsert({
    where: { key: HERO_CAROUSEL_SETTING_KEY },
    create: {
      key: HERO_CAROUSEL_SETTING_KEY,
      value: DEFAULT_HERO_CAROUSEL_SETTINGS,
    },
    update: {},
  });
}
