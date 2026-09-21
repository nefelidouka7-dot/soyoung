"use client";

import { useEffect, useState } from "react";
import { ProductCard, type ProductCardData } from "@/features/products/components/product-card";
import { useWishlistStore } from "@/features/wishlist/store";
import { EmptyState } from "@/components/ui/empty-state";
import { getWishlistProducts } from "@/features/wishlist/actions";
import { useTranslation } from "@/lib/i18n/use-translation";

export default function AccountWishlistPage() {
  const { dict } = useTranslation();
  const ids = useWishlistStore((s) => s.productIds);
  const hydrated = useWishlistStore((s) => s.hydrated);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    setLoading(true);
    getWishlistProducts(ids).then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, [ids, hydrated]);

  return (
    <div className="container-page py-10 lg:py-14">
      <h1 className="font-serif text-3xl">{dict.wishlist.title}</h1>
      {!hydrated || loading ? (
        <p className="mt-8 text-sm text-ink-muted">{dict.wishlist.loading}</p>
      ) : products.length === 0 ? (
        <EmptyState
          title={dict.wishlist.emptyTitle}
          description={dict.wishlist.emptyDescription}
          action={{ label: dict.home.exploreSkincare, href: "/skincare" }}
        />
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
