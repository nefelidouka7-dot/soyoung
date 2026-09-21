import { ProductCard } from "@/features/products/components/product-card";
import { ProductGrid } from "@/features/products/components/product-grid";
import { ProductSort } from "@/features/products/components/product-sort";
import { findProducts } from "@/server/repositories/product.repository";
import { EmptyState } from "@/components/ui/empty-state";
import { interpolate } from "@/lib/i18n";
import { getServerDictionary } from "@/lib/i18n/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getServerDictionary();
  return {
    title: dict.listing.newIn,
    description: dict.home.newInSubhead,
  };
}

export default async function NewInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const sort = (typeof sp.sort === "string" ? sp.sort : "newest") as
    | "recommended"
    | "newest"
    | "price-asc"
    | "price-desc";
  const [dict, result] = await Promise.all([
    getServerDictionary(),
    findProducts({ sort, pageSize: 24, newIn: true }),
  ]);

  return (
    <div className="container-page py-8 sm:py-10 lg:py-14">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <h1 className="font-serif text-[1.75rem] sm:text-3xl md:text-4xl">
            {dict.listing.newIn}
          </h1>
          <p className="mt-1.5 text-xs text-ink-muted sm:mt-2 sm:text-sm">
            {interpolate(dict.listing.productsCount, { count: result.total })}
          </p>
        </div>
        <ProductSort current={sort} />
      </div>
      {result.products.length === 0 ? (
        <EmptyState
          title={dict.listing.noProductsTitle}
          description={dict.listing.noProductsDescription}
        />
      ) : (
        <div className="mt-6 sm:mt-8">
          <ProductGrid>
            {result.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ProductGrid>
        </div>
      )}
    </div>
  );
}
