/**
 * Storefront menu taxonomy inspired by Soko Glam’s Skin Care /
 * Hair, Body & Makeup product-type columns.
 * Product.productType values should match these English labels.
 */
export const CATEGORY_ORDER = [
  "makeup",
  "skincare",
  "haircare",
  "body",
] as const;

export type TopCategorySlug = (typeof CATEGORY_ORDER)[number];

export const CATALOG_PRODUCT_TYPES: Record<TopCategorySlug, readonly string[]> = {
  skincare: [
    "Cleansing Balm",
    "Oil Cleanser",
    "Water Cleanser",
    "Exfoliator",
    "Toner",
    "Toner Pads",
    "Facial Mist",
    "Essence",
    "Serum",
    "Acne Treatment",
    "Sheet Mask",
    "Wash-off Mask",
    "Sleeping Mask",
    "Eye Cream",
    "Eye Mask",
    "Moisturizer",
    "Facial Oil",
    "Sunscreen",
  ],
  makeup: [
    "Makeup with SPF",
    "Primer & Face",
    "Eye & Brow",
    "Lip",
    "Blush",
    "Makeup Remover",
    "Tools",
  ],
  haircare: ["Shampoo", "Conditioner", "Hair Treatment"],
  body: ["Body Wash", "Body Treatment", "Body Lotion"],
};

export function isTopCategorySlug(slug: string): slug is TopCategorySlug {
  return (CATEGORY_ORDER as readonly string[]).includes(slug);
}

/** Taxonomy first, then any live catalog types not yet in the fixed list. */
export function mergeProductTypes(
  slug: string,
  liveTypes: string[]
): string[] {
  if (!isTopCategorySlug(slug)) return liveTypes;
  const taxonomy = CATALOG_PRODUCT_TYPES[slug];
  const seen = new Set(taxonomy);
  const extras = liveTypes.filter((type) => !seen.has(type));
  return [...taxonomy, ...extras];
}
