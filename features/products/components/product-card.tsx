"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Heart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { formatPrice, cn } from "@/lib/utils";
import { useCartStore } from "@/features/cart/store";
import { useWishlistStore } from "@/features/wishlist/store";
import { useUIStore } from "@/lib/ui-store";
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
  isNew?: boolean;
  suitableFor?: string | null;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const { dict, t } = useTranslation();
  const addItem = useCartStore((s) => s.addItem);
  const wishlistHydrated = useWishlistStore((s) => s.hydrated);
  const wishlisted = useWishlistStore((s) => s.has(product.id));
  const toggleWish = useWishlistStore((s) => s.toggle);
  const [justAdded, setJustAdded] = useState(false);
  const addedTimer = useRef<number | null>(null);
  const onSale =
    product.compareAtPrice != null && product.compareAtPrice > product.price;
  const showWishlisted = wishlistHydrated && wishlisted;

  useEffect(() => {
    return () => {
      if (addedTimer.current) window.clearTimeout(addedTimer.current);
    };
  }, []);

  function quickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (justAdded) return;

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

    setJustAdded(true);
    if (addedTimer.current) window.clearTimeout(addedTimer.current);
    addedTimer.current = window.setTimeout(() => setJustAdded(false), 1600);

    // Open bag: free-shipping progress + checkout are one step away
    useUIStore.getState().openCart();
  }

  return (
    <article className="group relative flex h-full flex-col">
      <div
        className={cn(
          "flex h-full flex-col bg-white outline outline-1 outline-oak/35 transition-[outline-color,box-shadow] duration-300",
          "group-hover:outline-oak/60 group-hover:shadow-[0_18px_40px_-28px_rgba(28,27,26,0.35)]"
        )}
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-white sm:aspect-[3/4]">
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
            className="absolute right-2 top-2 z-20 inline-flex h-8 w-8 items-center justify-center bg-white/90 text-ink backdrop-blur-[2px] transition-colors hover:bg-white sm:right-3 sm:top-3 sm:h-9 sm:w-9"
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
              className={cn(
                "h-3.5 w-3.5 sm:h-4 sm:w-4",
                showWishlisted && "fill-coral text-coral"
              )}
              strokeWidth={1.5}
            />
          </button>
        </div>

        <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5 sm:px-4 sm:pb-4 sm:pt-3.5">
          <p className="truncate text-[9px] uppercase tracking-[0.14em] text-ink-muted sm:text-[10px] sm:tracking-[0.16em]">
            {product.brand}
          </p>
          <Link
            href={`/product/${product.slug}`}
            className="mt-0.5 line-clamp-2 font-serif text-[0.95rem] leading-[1.25] text-ink transition-opacity hover:opacity-65 sm:mt-1 sm:text-[1.05rem] sm:leading-snug"
          >
            {product.name}
          </Link>
          {product.suitableFor ? (
            <p className="mt-1 hidden text-xs text-ink-muted sm:block">
              {t((d) => d.product.suitableFor, { type: product.suitableFor })}
            </p>
          ) : null}

          <div className="mt-auto flex items-baseline gap-1.5 pt-2.5 sm:gap-2 sm:pt-3">
            <span className="text-[13px] tabular-nums text-ink sm:text-sm">
              {formatPrice(product.price)}
            </span>
            {onSale ? (
              <span className="text-[12px] tabular-nums text-ink-muted line-through sm:text-sm">
                {formatPrice(product.compareAtPrice!)}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={quickAdd}
            aria-label={justAdded ? dict.common.addedToBag : dict.common.add}
            className={cn(
              "mt-2.5 flex h-10 w-full items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors sm:mt-3 sm:h-11 sm:text-[11px]",
              justAdded
                ? "bg-sage text-white"
                : "bg-ink text-white hover:bg-coral active:bg-coral-dark"
            )}
          >
            {justAdded ? (
              <>
                <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                <span>{dict.common.added}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                <span>{dict.common.add}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
