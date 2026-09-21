"use server";

import { prisma } from "@/db/prisma";
import { mapProductCard } from "@/server/repositories/product.repository";

export async function getWishlistProducts(ids: string[]) {
  if (!ids.length) return [];
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, status: "ACTIVE" },
    include: {
      brand: true,
      images: { orderBy: { sortOrder: "asc" } },
      reviews: { where: { status: "APPROVED" }, select: { rating: true } },
      skinTypes: { include: { skinType: true } },
    },
  });
  return products.map(mapProductCard);
}
