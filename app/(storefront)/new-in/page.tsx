import { ProductCard } from "@/features/products/components/product-card";
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
    | "best-rated"
    | "price-asc"
    | "price-desc";
  const result = await findProducts({ sort: "newest", pageSize: 24, newIn: true });

  return (
    <div className="container-page py-10 lg:py-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl">New In</h1>
          <p className="mt-2 text-sm text-ink-muted">
            {result.total} recently added products
          </p>
        </div>
        <ProductSort current={sort} />
      </div>
      {result.products.length === 0 ? (
        <EmptyState title="No new products yet" description="Check back soon for new arrivals." />
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {result.products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
