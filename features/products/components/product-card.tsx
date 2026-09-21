"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Plus } from "lucide-react";
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

  function quickAdd(e: React.MouseEvent) {
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
  }

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden border border-oak/25 bg-white sm:aspect-[3/4]">
        <Link
          href={`/product/${product.slug}`}
          className="absolute inset-0 z-0"
          aria-label={product.name}
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            className={cn(
              "object-contain p-3 transition-opacity duration-500 sm:p-5",
              product.hoverImage
                ? "group-hover:opacity-0"
                : "transition-transform duration-700 group-hover:scale-[1.03]"
            )}
            sizes="(max-width:640px) 48vw, (max-width:1024px) 33vw, 25vw"
          />
          {product.hoverImage ? (
            <Image
              src={product.hoverImage}
              alt=""
              fill
              className="object-contain p-3 opacity-0 transition-opacity duration-500 group-hover:opacity-100 sm:p-5"
              sizes="(max-width:640px) 48vw, (max-width:1024px) 33vw, 25vw"
            />
          ) : null}
        </Link>

        <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col gap-1 sm:left-3 sm:top-3">
          {onSale ? (
            <Badge variant="sale" className="px-1.5 py-0.5 text-[9px] sm:px-2 sm:text-[10px]">
              {dict.product.sale}
            </Badge>
          ) : null}
          {product.isNew && !onSale ? (
            <Badge variant="new" className="px-1.5 py-0.5 text-[9px] sm:px-2 sm:text-[10px]">
              {dict.product.newBadge}
            </Badge>
          ) : null}
        </div>

        <button
          type="button"
          aria-label={
            showWishlisted
              ? dict.product.removeFromWishlist
              : dict.product.addToWishlist
          }
          className="absolute right-2 top-2 z-20 inline-flex h-8 w-8 items-center justify-center bg-white/90 text-ink shadow-sm transition-colors hover:bg-white sm:right-3 sm:top-3 sm:h-9 sm:w-9"
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
            className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", showWishlisted && "fill-coral text-coral")}
            strokeWidth={1.5}
          />
        </button>

        {/* Desktop: hover quick-add over image */}
        <button
          type="button"
          className="absolute inset-x-3 bottom-3 z-20 hidden bg-bg/95 py-2.5 text-[11px] uppercase tracking-[0.12em] text-ink opacity-0 transition-all duration-300 translate-y-1.5 md:block md:group-hover:translate-y-0 md:group-hover:opacity-100"
          onClick={quickAdd}
        >
          {dict.common.quickAdd}
        </button>
      </div>

      {/* Mobile: compact add under image — Greek label is too long for overlay */}
      <button
        type="button"
        className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 border border-oak/40 bg-white text-[10px] uppercase tracking-[0.14em] text-ink transition-colors active:bg-bg-muted md:hidden"
        onClick={quickAdd}
        aria-label={dict.common.quickAdd}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
        <span>{dict.common.quickAdd}</span>
      </button>

      <div className="mt-2.5 flex flex-1 flex-col sm:mt-3.5">
        <p className="truncate text-[9px] uppercase tracking-[0.14em] text-ink-muted sm:text-[10px] sm:tracking-[0.16em]">
          {product.brand}
        </p>
        <Link
          href={`/product/${product.slug}`}
          className="mt-0.5 line-clamp-2 font-serif text-[0.95rem] leading-[1.25] text-ink transition-opacity hover:opacity-65 sm:mt-1 sm:text-[1.05rem] sm:leading-snug"
        >
          {product.name}
        </Link>
        {product.rating != null && product.reviewCount ? (
          <p className="mt-1 hidden text-xs text-ink-muted sm:mt-1.5 sm:block">
            ★ {product.rating.toFixed(1)} · {product.reviewCount}
          </p>
        ) : null}
        {product.suitableFor ? (
          <p className="mt-1 hidden text-xs text-ink-muted sm:block">
            {t((d) => d.product.suitableFor, { type: product.suitableFor })}
          </p>
        ) : null}
        <div className="mt-auto flex items-baseline gap-1.5 pt-2 sm:gap-2 sm:pt-2.5">
          <span className="text-[13px] tabular-nums text-ink sm:text-sm">
            {formatPrice(product.price)}
          </span>
          {onSale ? (
            <span className="text-[12px] tabular-nums text-ink-muted line-through sm:text-sm">
              {formatPrice(product.compareAtPrice!)}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
