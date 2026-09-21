import Link from "next/link";
import { ProductCard } from "@/features/products/components/product-card";
import { ProductGrid } from "@/features/products/components/product-grid";
import { ProductFilters } from "@/features/products/components/product-filters";
import { ProductSort } from "@/features/products/components/product-sort";
import {
  findProducts,
  getFilterFacets,
  findCategoryBySlug,
} from "@/server/repositories/product.repository";
import { EmptyState } from "@/components/ui/empty-state";
import { getServerDictionary } from "@/lib/i18n/server";
import { interpolate } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/types";
import type { Metadata } from "next";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parseList(v: string | string[] | undefined) {
  if (!v) return [];
  const raw = Array.isArray(v) ? v.join(",") : v;
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category?: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = category ? await findCategoryBySlug(category) : null;
  return {
    title: cat?.seoTitle ?? cat?.name ?? "Shop",
    description: cat?.seoDescription ?? cat?.description ?? undefined,
  };
}

export default async function CategoryListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ category?: string }>;
  searchParams: SearchParams;
}) {
  const { category: categorySlug } = await params;
  const sp = await searchParams;
  const brandSlugs = parseList(sp.brand);
  const skinTypeSlugs = parseList(sp.skinType);
  const productTypes = parseList(sp.type);
  const sort = (typeof sp.sort === "string" ? sp.sort : "recommended") as
    | "recommended"
    | "newest"
    | "best-rated"
    | "price-asc"
    | "price-desc";
  const page = Number(typeof sp.page === "string" ? sp.page : 1) || 1;
  const onSale = sp.offers === "1" || sp.offers === "true";
  const inStock = sp.available === "1" || sp.available === "true";
  const q = typeof sp.q === "string" ? sp.q : undefined;

  const dict = await getServerDictionary();

  let category: Awaited<ReturnType<typeof findCategoryBySlug>> = null;
  let result: Awaited<ReturnType<typeof findProducts>> = {
    total: 0,
    page: 1,
    pageSize: 24,
    totalPages: 0,
    products: [],
  };
  let facets: Awaited<ReturnType<typeof getFilterFacets>> = {
    brands: [],
    skinTypes: [],
    productTypes: [],
    minPrice: 0,
    maxPrice: 100,
  };

  try {
    category = categorySlug ? await findCategoryBySlug(categorySlug) : null;
    [result, facets] = await Promise.all([
      findProducts({
        categorySlug,
        brandSlugs,
        skinTypeSlugs,
        productTypes,
        sort,
        page,
        onSale,
        inStock,
        q,
        pageSize: 24,
      }),
      getFilterFacets(categorySlug),
    ]);
  } catch (error) {
    console.error("[listing] Catalog query failed — check DATABASE_URL / Neon:", error);
  }

  function t(
    pick: (d: Dictionary) => string,
    vars?: Record<string, string | number>
  ) {
    const value = pick(dict);
    return vars ? interpolate(value, vars) : value;
  }

  const title =
    category?.name ??
    (categorySlug === "new-in"
      ? dict.listing.newIn
      : onSale || categorySlug === "offers"
        ? dict.listing.offers
        : dict.listing.shop);

  return (
    <div className="container-page py-8 sm:py-10 lg:py-14">
      <nav className="text-[11px] uppercase tracking-[0.1em] text-ink-muted sm:text-xs sm:normal-case sm:tracking-normal" aria-label="Breadcrumb">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link href="/" className="hover:text-ink">
              {dict.listing.home}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-ink">{title}</li>
        </ol>
      </nav>

      <div className="mt-4 flex flex-col gap-3 sm:mt-4 sm:flex-row sm:items-end sm:justify-between sm:gap-2">
        <div>
          <h1 className="font-serif text-[1.75rem] leading-tight text-ink sm:text-3xl md:text-4xl">{title}</h1>
          {category?.description ? (
            <p className="mt-2 hidden max-w-2xl text-sm text-ink-muted sm:block">
              {category.description}
            </p>
          ) : null}
          <p className="mt-1.5 text-xs text-ink-muted sm:mt-2 sm:text-sm">
            {t((d) => d.listing.productsCount, { count: result.total })}
          </p>
        </div>
        <ProductSort current={sort} />
      </div>

      <div className="mt-6 grid gap-8 sm:mt-8 lg:grid-cols-[240px_1fr] lg:gap-10">
        <ProductFilters facets={facets} />
        <div>
          {result.products.length === 0 ? (
            <EmptyState
              title={dict.listing.noProductsTitle}
              description={dict.listing.noProductsDescription}
              action={{
                label: dict.listing.clearFilters,
                href: categorySlug ? `/${categorySlug}` : "/",
              }}
            />
          ) : (
            <ProductGrid variant="listing">
              {result.products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </ProductGrid>
          )}

          {result.totalPages > 1 ? (
            <div className="mt-12 flex justify-center gap-2">
              {Array.from({ length: result.totalPages }, (_, i) => i + 1).map(
                (p) => (
                  <Link
                    key={p}
                    href={`?${new URLSearchParams({
                      ...(typeof sp.brand === "string" ? { brand: sp.brand } : {}),
                      ...(typeof sp.skinType === "string"
                        ? { skinType: sp.skinType }
                        : {}),
                      sort,
                      page: String(p),
                    }).toString()}`}
                    className={`inline-flex h-9 min-w-9 items-center justify-center px-2 text-sm ${
                      p === page
                        ? "bg-ink text-bg"
                        : "border border-oak/50 text-ink hover:border-ink/40"
                    }`}
                  >
                    {p}
                  </Link>
                )
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
