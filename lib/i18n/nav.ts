import type { Dictionary } from "@/lib/i18n/types";
import { CATEGORY_ORDER } from "@/lib/catalog-taxonomy";

const NAV_BY_HREF: Record<string, keyof Dictionary["nav"]> = {
  "/new-in": "newIn",
  "/makeup": "makeup",
  "/skincare": "skincare",
  "/haircare": "haircare",
  "/body": "body",
  "/brands": "brands",
  "/offers": "offers",
  "/best-sellers": "bestSellers",
};

export function navLabel(dict: Dictionary, href: string, fallback: string) {
  const key = NAV_BY_HREF[href];
  return key ? dict.nav[key] : fallback;
}

/** Catalog product types are stored in English; translate for display only. */
export function productTypeLabel(dict: Dictionary, productType: string) {
  return dict.productTypes[productType] ?? productType;
}

export function concernLabel(dict: Dictionary, slug: string, fallback: string) {
  return dict.concerns[slug] ?? fallback;
}

type CategorySlug = (typeof CATEGORY_ORDER)[number];

function isCategorySlug(slug: string): slug is CategorySlug {
  return (CATEGORY_ORDER as readonly string[]).includes(slug);
}

/** Top-level category titles live in nav; DB stores English only. */
export function categoryLabel(
  dict: Dictionary,
  slug: string | undefined,
  fallback: string
) {
  if (slug && isCategorySlug(slug)) return dict.nav[slug];
  return fallback;
}

export function categoryDescription(
  dict: Dictionary,
  slug: string | undefined,
  fallback?: string | null
) {
  if (slug && isCategorySlug(slug)) {
    return dict.listing.categoryDescriptions[slug];
  }
  return fallback ?? undefined;
}
