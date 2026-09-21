import { prisma } from "@/db/prisma";
import type { Prisma, ProductStatus } from "@prisma/client";

export type ProductListParams = {
  categorySlug?: string;
  brandSlugs?: string[];
  skinTypeSlugs?: string[];
  productTypes?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
  q?: string;
  sort?: "recommended" | "newest" | "price-asc" | "price-desc";
  page?: number;
  pageSize?: number;
  featured?: boolean;
  bestSeller?: boolean;
  newIn?: boolean;
};

function buildWhere(params: ProductListParams): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [{ status: "ACTIVE" }];

  if (params.categorySlug) {
    and.push({
      OR: [
        { category: { slug: params.categorySlug } },
        { category: { parent: { slug: params.categorySlug } } },
      ],
    });
  }
  if (params.brandSlugs?.length) {
    and.push({ brand: { slug: { in: params.brandSlugs } } });
  }
  if (params.skinTypeSlugs?.length) {
    and.push({
      skinTypes: { some: { skinType: { slug: { in: params.skinTypeSlugs } } } },
    });
  }
  if (params.productTypes?.length) {
    and.push({ productType: { in: params.productTypes } });
  }
  if (params.minPrice != null || params.maxPrice != null) {
    and.push({
      price: {
        gte: params.minPrice,
        lte: params.maxPrice,
      },
    });
  }
  if (params.inStock) and.push({ stock: { gt: 0 } });
  if (params.onSale) {
    and.push({ compareAtPrice: { not: null } });
  }
  if (params.q) {
    and.push({
      OR: [
        { name: { contains: params.q, mode: "insensitive" } },
        { brand: { name: { contains: params.q, mode: "insensitive" } } },
        { tags: { has: params.q.toLowerCase() } },
      ],
    });
  }
  if (params.featured) and.push({ featured: true });
  if (params.bestSeller) and.push({ bestSeller: true });
  if (params.newIn) {
    const since = new Date();
    since.setDate(since.getDate() - 60);
    and.push({ createdAt: { gte: since } });
  }

  return { AND: and };
}

function buildOrderBy(
  sort?: ProductListParams["sort"]
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }];
    case "price-asc":
      return [{ price: "asc" }];
    case "price-desc":
      return [{ price: "desc" }];
    default:
      return [{ bestSeller: "desc" }, { featured: "desc" }, { createdAt: "desc" }];
  }
}

const productCardInclude = {
  brand: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  skinTypes: { include: { skinType: true } },
} satisfies Prisma.ProductInclude;

export async function findProducts(params: ProductListParams = {}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 24;
  const where = buildWhere(params);
  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: productCardInclude,
      orderBy: buildOrderBy(params.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    products: products.map(mapProductCard),
  };
}

export function mapProductCard(
  p: Prisma.ProductGetPayload<{ include: typeof productCardInclude }>
) {
  const primary = p.images.find((i) => i.isPrimary) ?? p.images[0];
  const secondary = p.images.find((i) => i.id !== primary?.id);

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand.name,
    brandSlug: p.brand.slug,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    image: primary?.url ?? "/images/placeholder-product.svg",
    hoverImage: secondary?.url ?? null,
    isNew:
      p.createdAt > new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
    skinTypes: p.skinTypes.map((s) => s.skinType.nameEl),
    stock: p.stock,
  };
}

export async function findProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      brand: true,
      category: { include: { parent: true } },
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { active: true }, orderBy: { name: "asc" } },
      skinTypes: { include: { skinType: true } },
      concerns: { include: { concern: true } },
    },
  });
}

export async function findBrandBySlug(slug: string) {
  return prisma.brand.findFirst({
    where: { slug, active: true },
    include: { _count: { select: { products: true } } },
  });
}

export async function findAllBrands() {
  return prisma.brand.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: { where: { status: "ACTIVE" } } } } },
  });
}

export async function findFeaturedBrands(take = 8) {
  return prisma.brand.findMany({
    where: { active: true, featured: true },
    orderBy: { name: "asc" },
    take,
  });
}

export async function findCategoryBySlug(slug: string) {
  return prisma.category.findFirst({
    where: { slug, active: true },
    include: { children: { where: { active: true }, orderBy: { sortOrder: "asc" } } },
  });
}

export async function findSkinTypes() {
  return prisma.skinType.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function findSkinTypeBySlug(slug: string) {
  return prisma.skinType.findFirst({ where: { slug, active: true } });
}

export async function getFilterFacets(categorySlug?: string) {
  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    ...(categorySlug
      ? {
          OR: [
            { category: { slug: categorySlug } },
            { category: { parent: { slug: categorySlug } } },
          ],
        }
      : {}),
  };

  const [brands, skinTypes, products] = await Promise.all([
    prisma.brand.findMany({
      where: { active: true, products: { some: where } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.skinType.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, nameEl: true, slug: true },
    }),
    prisma.product.findMany({
      where,
      select: { productType: true, price: true },
    }),
  ]);

  const types = [
    ...new Set(products.map((p) => p.productType).filter(Boolean) as string[]),
  ].sort();
  const prices = products.map((p) => Number(p.price));
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 100;

  return { brands, skinTypes, productTypes: types, minPrice, maxPrice };
}

export async function updateProductStatus(id: string, status: ProductStatus) {
  return prisma.product.update({ where: { id }, data: { status } });
}
