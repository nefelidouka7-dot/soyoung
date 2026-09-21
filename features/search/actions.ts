"use server";

import { prisma } from "@/db/prisma";

export async function searchCatalog(query: string) {
  const q = query.trim();
  if (q.length < 2) {
    return { products: [], brands: [], categories: [] };
  }

  const [products, brands, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { shortDescription: { contains: q, mode: "insensitive" } },
          { tags: { has: q.toLowerCase() } },
          { brand: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      take: 8,
      include: {
        brand: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
    }),
    prisma.brand.findMany({
      where: {
        active: true,
        name: { contains: q, mode: "insensitive" },
      },
      take: 5,
    }),
    prisma.category.findMany({
      where: {
        active: true,
        name: { contains: q, mode: "insensitive" },
      },
      take: 5,
    }),
  ]);

  return {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      brand: p.brand.name,
      image: p.images[0]?.url ?? "/images/placeholder-product.svg",
    })),
    brands: brands.map((b) => ({ id: b.id, name: b.name, slug: b.slug })),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    })),
  };
}
