import { cache } from "react";
import { prisma } from "@/db/prisma";

export type NavBrand = { name: string; slug: string };

export type NavSkinType = { name: string; nameEl: string; slug: string };

export type NavCategoryPanel = {
  slug: string;
  image: string | null;
  /** Product types present in the category, most stocked first. */
  productTypes: string[];
  /** Brands with active products in the category, most stocked first. */
  brands: NavBrand[];
};

export type NavigationData = {
  categories: NavCategoryPanel[];
  brands: NavBrand[];
  featuredBrands: NavBrand[];
  skinTypes: NavSkinType[];
};

const COLUMN_LIMIT = 8;

const EMPTY_NAVIGATION: NavigationData = {
  categories: [],
  brands: [],
  featuredBrands: [],
  skinTypes: [],
};

/**
 * Menu contents are derived from the catalog instead of a hardcoded list, so a
 * new product type or brand shows up in the nav without a code change.
 */
export const getNavigationData = cache(async (): Promise<NavigationData> => {
  try {
    const [categories, brands, skinTypes, typeGroups, brandGroups] =
      await Promise.all([
        prisma.category.findMany({
          where: { active: true },
          orderBy: { sortOrder: "asc" },
          select: { id: true, slug: true, image: true, parentId: true },
        }),
        prisma.brand.findMany({
          where: { active: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true, slug: true, featured: true },
        }),
        prisma.skinType.findMany({
          where: { active: true },
          orderBy: { sortOrder: "asc" },
          select: { name: true, nameEl: true, slug: true },
        }),
        prisma.product.groupBy({
          by: ["categoryId", "productType"],
          where: { status: "ACTIVE", productType: { not: null } },
          _count: { _all: true },
        }),
        prisma.product.groupBy({
          by: ["categoryId", "brandId"],
          where: { status: "ACTIVE" },
          _count: { _all: true },
        }),
      ]);

    const categoryById = new Map(categories.map((c) => [c.id, c]));
    const brandById = new Map(brands.map((b) => [b.id, b]));

    /** Products of a subcategory belong to the parent's panel. */
    function topLevelSlug(categoryId: string) {
      const category = categoryById.get(categoryId);
      if (!category) return null;
      if (!category.parentId) return category.slug;
      return categoryById.get(category.parentId)?.slug ?? null;
    }

    const typeCounts = new Map<string, Map<string, number>>();
    for (const group of typeGroups) {
      const slug = topLevelSlug(group.categoryId);
      if (!slug || !group.productType) continue;
      const bucket = typeCounts.get(slug) ?? new Map<string, number>();
      bucket.set(
        group.productType,
        (bucket.get(group.productType) ?? 0) + group._count._all
      );
      typeCounts.set(slug, bucket);
    }

    const brandCounts = new Map<string, Map<string, number>>();
    for (const group of brandGroups) {
      const slug = topLevelSlug(group.categoryId);
      if (!slug) continue;
      const bucket = brandCounts.get(slug) ?? new Map<string, number>();
      bucket.set(
        group.brandId,
        (bucket.get(group.brandId) ?? 0) + group._count._all
      );
      brandCounts.set(slug, bucket);
    }

    function mostStocked(counts: Map<string, number> | undefined) {
      if (!counts) return [];
      return [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, COLUMN_LIMIT)
        .map(([key]) => key);
    }

    return {
      categories: categories
        .filter((c) => !c.parentId)
        .map((category) => ({
          slug: category.slug,
          image: category.image,
          productTypes: mostStocked(typeCounts.get(category.slug)),
          brands: mostStocked(brandCounts.get(category.slug))
            .map((id) => brandById.get(id))
            .filter((b): b is NonNullable<typeof b> => Boolean(b))
            .map((b) => ({ name: b.name, slug: b.slug })),
        })),
      brands: brands.map((b) => ({ name: b.name, slug: b.slug })),
      featuredBrands: brands
        .filter((b) => b.featured)
        .map((b) => ({ name: b.name, slug: b.slug })),
      skinTypes,
    };
  } catch (error) {
    console.error("[navigation] Failed to load catalog navigation:", error);
    return EMPTY_NAVIGATION;
  }
});
