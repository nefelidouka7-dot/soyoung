import type { Dictionary } from "@/lib/i18n/types";

const NAV_BY_HREF: Record<string, keyof Dictionary["nav"]> = {
  "/new-in": "newIn",
  "/makeup": "makeup",
  "/skincare": "skincare",
  "/haircare": "haircare",
  "/body": "body",
  "/brands": "brands",
  "/offers": "offers",
};

export function navLabel(dict: Dictionary, href: string, fallback: string) {
  const key = NAV_BY_HREF[href];
  return key ? dict.nav[key] : fallback;
}

/** Catalog product types are stored in English; translate for display only. */
export function productTypeLabel(dict: Dictionary, productType: string) {
  return dict.productTypes[productType] ?? productType;
}
