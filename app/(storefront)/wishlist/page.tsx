"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { ProductCard, type ProductCardData } from "@/features/products/components/product-card";
import { useWishlistStore } from "@/features/wishlist/store";
import { EmptyState } from "@/components/ui/empty-state";
import { getWishlistProducts } from "@/features/wishlist/actions";
import { useCartStore } from "@/features/cart/store";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/use-translation";

export default function WishlistPage() {
  const { dict } = useTranslation();
  const ids = useWishlistStore((s) => s.productIds);
  const hydrated = useWishlistStore((s) => s.hydrated);
  const toggle = useWishlistStore((s) => s.toggle);
  const addItem = useCartStore((s) => s.addItem);
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
      <p className="mt-2 text-sm text-ink-muted">{dict.wishlist.subtitle}</p>
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
      {products.length > 0 ? (
        <div className="mt-10 flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 bg-sage px-6 text-xs uppercase tracking-wide text-bg hover:bg-sage-dark"
            onClick={() => {
              products.forEach((p) => {
                addItem({
                  productId: p.id,
                  slug: p.slug,
                  name: p.name,
                  brand: p.brand,
                  image: p.image,
                  price: p.price,
                  compareAtPrice: p.compareAtPrice,
                  maxStock: 99,
                });
              });
              toast.success(dict.wishlist.movedToBag);
            }}
          >
            <Heart className="h-4 w-4" strokeWidth={1.5} />
            {dict.wishlist.addAllToBag}
          </button>
          <Link
            href="/skincare"
            className="inline-flex h-11 items-center border border-ink/20 px-6 text-xs uppercase tracking-wide"
          >
            {dict.common.continueShopping}
          </Link>
          <button
            type="button"
            className="text-xs text-ink-muted underline-offset-4 hover:underline"
            onClick={() => {
              ids.forEach((id) => toggle(id));
              toast.success(dict.wishlist.cleared);
            }}
          >
            {dict.wishlist.clear}
          </button>
        </div>
      ) : null}
    </div>
  );
}
