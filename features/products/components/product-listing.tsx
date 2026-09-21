import Image from "next/image";
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
import {
  categoryDescription,
  categoryLabel,
} from "@/lib/i18n/nav";
import type { Dictionary } from "@/lib/i18n/types";
import type { Metadata } from "next";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  skincare: "/images/category-skincare.jpg",
  makeup: "/images/category-makeup.jpg",
  haircare: "/images/category-haircare.jpg",
  body: "/images/category-body.jpg",
};

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
  const dict = await getServerDictionary();
  const cat = category ? await findCategoryBySlug(category) : null;
  const title = categoryLabel(
    dict,
    category,
    cat?.seoTitle ?? cat?.name ?? "Shop"
  );
  const description = categoryDescription(
    dict,
    category,
    cat?.seoDescription ?? cat?.description
  );
  return {
    title,
    description: description ?? undefined,
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

  const title = categoryLabel(
    dict,
    categorySlug,
    category?.name ??
      (categorySlug === "new-in"
        ? dict.listing.newIn
        : onSale || categorySlug === "offers"
          ? dict.listing.offers
          : dict.listing.shop)
  );

  const description = categoryDescription(
    dict,
    categorySlug,
    category?.description
  );

  const heroImage =
    category?.image ??
    (categorySlug ? CATEGORY_FALLBACK_IMAGES[categorySlug] : undefined);

  return (
    <div>
      <header className="relative isolate overflow-hidden border-b border-oak/30">
        {heroImage ? (
          <>
            <Image
              src={heroImage}
              alt=""
              fill
              priority
              className="object-cover object-[center_35%]"
              sizes="100vw"
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-bg via-bg/88 to-bg/35 sm:via-bg/82 sm:to-bg/20"
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-transparent"
              aria-hidden
            />
            <div className="hero-grain pointer-events-none absolute inset-0 opacity-[0.08]" aria-hidden />
          </>
        ) : (
          <div className="home-wash absolute inset-0 bg-bg-muted" aria-hidden />
        )}

        <div className="container-page relative py-10 sm:py-14 lg:py-[4.25rem]">
          <nav
            className="animate-soft-enter text-[10px] uppercase tracking-[0.18em] text-ink-muted"
            aria-label="Breadcrumb"
          >
            <ol className="flex flex-wrap items-center gap-2.5">
              <li>
                <Link
                  href="/"
                  className="transition-colors hover:text-ink"
                >
                  {dict.listing.home}
                </Link>
              </li>
              <li className="text-oak" aria-hidden>
                /
              </li>
              <li className="text-ink">{title}</li>
            </ol>
          </nav>

          <div className="mt-7 max-w-2xl sm:mt-9">
            <h1 className="animate-rise font-serif text-[clamp(2.35rem,8vw,3.75rem)] leading-[0.98] tracking-[-0.02em] text-ink">
              {title}
            </h1>

            {description ? (
              <p className="animate-rise mt-4 max-w-xl text-[14px] leading-[1.7] text-ink-muted sm:mt-5 sm:text-[15px] sm:leading-[1.75]">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <div className="container-page py-8 sm:py-10 lg:py-12">
        <ProductFilters
          facets={facets}
          productCountLabel={t((d) => d.listing.productsCount, {
            count: result.total,
          })}
          sort={<ProductSort current={sort} />}
        >
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
        </ProductFilters>
      </div>
    </div>
  );
}
