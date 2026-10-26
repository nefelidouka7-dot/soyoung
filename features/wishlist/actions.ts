"use server";

import { prisma } from "@/db/prisma";
import { mapProductCard } from "@/server/repositories/product.repository";

const MAX_WISHLIST_IDS = 100;

export async function getWishlistProducts(ids: string[]) {
  // Public action: bound the input so it can't be used for oversized queries.
  if (!Array.isArray(ids) || !ids.length) return [];
  const safeIds = ids
    .filter((id): id is string => typeof id === "string" && id.length <= 64)
    .slice(0, MAX_WISHLIST_IDS);
  const products = await prisma.product.findMany({
    where: { id: { in: safeIds }, status: "ACTIVE" },
    include: {
      brand: true,
      images: { orderBy: { sortOrder: "asc" } },
      skinTypes: { include: { skinType: true } },
    },
  });
  return products.map(mapProductCard);
}
