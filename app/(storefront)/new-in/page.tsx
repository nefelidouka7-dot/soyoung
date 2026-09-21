import { ProductCard } from "@/features/products/components/product-card";
import { ProductGrid } from "@/features/products/components/product-grid";
import { ProductSort } from "@/features/products/components/product-sort";
import { findProducts } from "@/server/repositories/product.repository";
import { EmptyState } from "@/components/ui/empty-state";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New In",
  description: "The latest arrivals at SoYoung.",
};

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
  const result = await findProducts({ sort: "newest", pageSize: 24, newIn: true });

  return (
    <div className="container-page py-8 sm:py-10 lg:py-14">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <h1 className="font-serif text-[1.75rem] sm:text-3xl md:text-4xl">New In</h1>
          <p className="mt-1.5 text-xs text-ink-muted sm:mt-2 sm:text-sm">
            {result.total} recently added products
          </p>
        </div>
        <ProductSort current={sort} />
      </div>
      {result.products.length === 0 ? (
        <EmptyState title="No new products yet" description="Check back soon for new arrivals." />
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
