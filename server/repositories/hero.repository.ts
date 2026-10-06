import { prisma } from "@/db/prisma";
import type { Locale } from "@/lib/i18n/types";

export const HERO_CAROUSEL_SETTING_KEY = "hero.carousel";

export type HeroCarouselSettings = {
  autoplay: boolean;
  intervalSeconds: number;
};

export const DEFAULT_HERO_CAROUSEL_SETTINGS: HeroCarouselSettings = {
  autoplay: true,
  intervalSeconds: 6,
};

export type HeroSlideView = {
  id: string;
  type: "CAMPAIGN" | "PRODUCT";
  imageUrl: string;
  imageAlt: string;
  eyebrow: string | null;
  headline: string;
  headlineAccent: string | null;
  subhead: string | null;
  ctaPrimaryLabel: string | null;
  ctaPrimaryHref: string | null;
  ctaSecondaryLabel: string | null;
  ctaSecondaryHref: string | null;
  product: {
    name: string;
    slug: string;
    price: number;
    compareAtPrice: number | null;
    discountPercent: number | null;
  } | null;
};

function pickLocale<T>(locale: Locale, en: T, el: T): T {
  return locale === "el" ? el : en;
}

function discountPercent(price: number, compareAt: number | null): number | null {
  if (compareAt == null || compareAt <= price || compareAt <= 0) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export async function getHeroCarouselSettings(): Promise<HeroCarouselSettings> {
  const row = await prisma.siteSetting.findUnique({
    where: { key: HERO_CAROUSEL_SETTING_KEY },
  });
  if (!row || typeof row.value !== "object" || row.value === null || Array.isArray(row.value)) {
    return DEFAULT_HERO_CAROUSEL_SETTINGS;
  }
  const value = row.value as Record<string, unknown>;
  const interval = Number(value.intervalSeconds);
  return {
    autoplay: value.autoplay !== false,
    intervalSeconds:
      Number.isFinite(interval) && interval >= 2 && interval <= 60
        ? Math.round(interval)
        : DEFAULT_HERO_CAROUSEL_SETTINGS.intervalSeconds,
  };
}

export async function findActiveHeroSlides(locale: Locale): Promise<HeroSlideView[]> {
  const now = new Date();
  const slides = await prisma.heroSlide.findMany({
    where: {
      active: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    include: {
      product: {
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return slides.map((slide) => {
    const product =
      slide.type === "PRODUCT" && slide.product && slide.product.status === "ACTIVE"
        ? slide.product
        : null;
    const price = product ? Number(product.price) : 0;
    const compareAtPrice = product?.compareAtPrice
      ? Number(product.compareAtPrice)
      : null;
    const imageUrl =
      slide.imageUrl ||
      product?.images[0]?.url ||
      "/images/hero.jpg";

    return {
      id: slide.id,
      type: slide.type,
      imageUrl,
      imageAlt:
        pickLocale(locale, slide.imageAltEn, slide.imageAltEl) ||
        product?.name ||
        "",
      eyebrow: pickLocale(locale, slide.eyebrowEn, slide.eyebrowEl),
      headline: pickLocale(locale, slide.headlineEn, slide.headlineEl),
      headlineAccent: pickLocale(
        locale,
        slide.headlineAccentEn,
        slide.headlineAccentEl
      ),
      subhead: pickLocale(locale, slide.subheadEn, slide.subheadEl),
      ctaPrimaryLabel: pickLocale(
        locale,
        slide.ctaPrimaryLabelEn,
        slide.ctaPrimaryLabelEl
      ),
      ctaPrimaryHref:
        slide.ctaPrimaryHref ||
        (product ? `/product/${product.slug}` : null),
      ctaSecondaryLabel: pickLocale(
        locale,
        slide.ctaSecondaryLabelEn,
        slide.ctaSecondaryLabelEl
      ),
      ctaSecondaryHref: slide.ctaSecondaryHref,
      product: product
        ? {
            name: product.name,
            slug: product.slug,
            price,
            compareAtPrice,
            discountPercent: discountPercent(price, compareAtPrice),
          }
        : null,
    };
  });
}

export async function findAllHeroSlides() {
  return prisma.heroSlide.findMany({
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          compareAtPrice: true,
          status: true,
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export type AdminHeroSlide = Awaited<ReturnType<typeof findAllHeroSlides>>[number];

export async function findHeroSlideById(id: string) {
  return prisma.heroSlide.findUnique({
    where: { id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          compareAtPrice: true,
        },
      },
    },
  });
}
