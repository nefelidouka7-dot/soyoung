import type { MetadataRoute } from "next";
import { prisma } from "@/db/prisma";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = absoluteUrl();
  const staticRoutes = [
    "",
    "/skincare",
    "/makeup",
    "/haircare",
    "/body",
    "/brands",
    "/skin-type",
    "/new-in",
    "/offers",
    "/cart",
    "/contact",
    "/shipping",
    "/returns",
    "/faq",
    "/privacy",
    "/terms",
    "/cookies",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  try {
    const [products, brands, categories] = await Promise.all([
      prisma.product.findMany({
        where: { status: "ACTIVE" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.brand.findMany({
        where: { active: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({
        where: { active: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    return [
      ...staticRoutes,
      ...products.map((p) => ({
        url: `${base}/product/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...brands.map((b) => ({
        url: `${base}/brands/${b.slug}`,
        lastModified: b.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
      ...categories.map((c) => ({
        url: `${base}/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch (error) {
    console.error("[sitemap] Failed to load catalog routes:", error);
    return staticRoutes;
  }
}
