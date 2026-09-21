"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { formatPrice, cn } from "@/lib/utils";
import { useCartStore } from "@/features/cart/store";
import { useWishlistStore } from "@/features/wishlist/store";
import { useTranslation } from "@/lib/i18n/use-translation";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  compareAtPrice?: number | null;
  image: string;
  hoverImage?: string | null;
  rating?: number | null;
  reviewCount?: number;
  isNew?: boolean;
  suitableFor?: string | null;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const { dict, t } = useTranslation();
  const addItem = useCartStore((s) => s.addItem);
  const wishlistHydrated = useWishlistStore((s) => s.hydrated);
  const wishlisted = useWishlistStore((s) => s.has(product.id));
  const toggleWish = useWishlistStore((s) => s.toggle);
  const onSale =
    product.compareAtPrice != null && product.compareAtPrice > product.price;
  const showWishlisted = wishlistHydrated && wishlisted;

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden bg-bg-muted">
        <Link href={`/product/${product.slug}`} className="absolute inset-0 z-0">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className={cn(
              "object-contain p-4 transition-opacity duration-500 sm:p-5",
              product.hoverImage
                ? "group-hover:opacity-0"
                : "transition-transform duration-700 group-hover:scale-[1.03]"
            )}
            sizes="(max-width:768px) 50vw, 25vw"
          />
          {product.hoverImage ? (
            <Image
              src={product.hoverImage}
              alt=""
              fill
              className="object-contain p-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100 sm:p-5"
              sizes="(max-width:768px) 50vw, 25vw"
            />
          ) : null}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-1">
          {onSale ? <Badge variant="sale">{dict.product.sale}</Badge> : null}
          {product.isNew && !onSale ? (
            <Badge variant="new">{dict.product.newBadge}</Badge>
          ) : null}
        </div>

        <button
          type="button"
          aria-label={
            showWishlisted
              ? dict.product.removeFromWishlist
              : dict.product.addToWishlist
          }
          className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center bg-bg/80 text-ink transition-colors hover:bg-bg"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWish(product.id);
            toast.success(
              showWishlisted
                ? dict.product.removedFromWishlist
                : dict.product.addedToWishlist
            );
          }}
        >
          <Heart
            className={cn("h-4 w-4", showWishlisted && "fill-coral text-coral")}
            strokeWidth={1.5}
          />
        </button>

        <button
          type="button"
          className="absolute inset-x-3 bottom-3 z-20 bg-bg/95 py-2.5 text-[11px] uppercase tracking-[0.12em] text-ink transition-all duration-300 opacity-100 translate-y-0 md:translate-y-1.5 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addItem({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              brand: product.brand,
              image: product.image,
              price: product.price,
              compareAtPrice: product.compareAtPrice,
              maxStock: 99,
            });
            toast.success(dict.common.addedToBag);
          }}
        >
          {dict.common.quickAdd}
        </button>
      </div>

      <div className="mt-3.5 flex flex-1 flex-col">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink-muted">
          {product.brand}
        </p>
        <Link
          href={`/product/${product.slug}`}
          className="mt-1 line-clamp-2 font-serif text-[1.05rem] leading-snug text-ink transition-opacity hover:opacity-65"
        >
          {product.name}
        </Link>
        {product.rating != null && product.reviewCount ? (
          <p className="mt-1.5 text-xs text-ink-muted">
            ★ {product.rating.toFixed(1)} · {product.reviewCount}
          </p>
        ) : null}
        {product.suitableFor ? (
          <p className="mt-1 text-xs text-ink-muted">
            {t((d) => d.product.suitableFor, { type: product.suitableFor })}
          </p>
        ) : null}
        <div className="mt-auto flex items-baseline gap-2 pt-2.5">
          <span className="text-sm tabular-nums text-ink">
            {formatPrice(product.price)}
          </span>
          {onSale ? (
            <span className="text-sm tabular-nums text-ink-muted line-through">
              {formatPrice(product.compareAtPrice!)}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
