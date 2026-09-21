"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Heart, Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { formatPrice, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/features/cart/store";
import { useWishlistStore } from "@/features/wishlist/store";
import { useTranslation } from "@/lib/i18n/use-translation";

type Variant = {
  id: string;
  name: string;
  type: string;
  price: number | null;
  stock: number;
  image: string | null;
};

type Props = {
  product: {
    id: string;
    name: string;
    slug: string;
    brand: string;
    brandSlug: string;
    price: number;
    compareAtPrice: number | null;
    shortDescription: string | null;
    stock: number;
    images: Array<{ id: string; url: string; alt: string | null }>;
    variants: Variant[];
    rating: number | null;
    reviewCount: number;
    skinTypes: string[];
  };
};

export function ProductPurchasePanel({ product }: Props) {
  const { dict, t } = useTranslation();
  const [activeImage, setActiveImage] = useState(0);
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const [lightbox, setLightbox] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const wishlistHydrated = useWishlistStore((s) => s.hydrated);
  const wishlisted = useWishlistStore((s) => s.has(product.id));
  const toggleWish = useWishlistStore((s) => s.toggle);
  const showWishlisted = wishlistHydrated && wishlisted;

  const variant = product.variants.find((v) => v.id === variantId);
  const price = variant?.price ?? product.price;
  const stock = variant?.stock ?? product.stock;
  const onSale =
    product.compareAtPrice != null && product.compareAtPrice > price;

  const images = useMemo(() => {
    if (variant?.image) {
      return [
        { id: "variant", url: variant.image, alt: variant.name },
        ...product.images,
      ];
    }
    return product.images.length
      ? product.images
      : [{ id: "ph", url: "/images/placeholder-product.svg", alt: product.name }];
  }, [product.images, product.name, variant]);

  function addToCart(buyNow = false) {
    if (stock < 1) {
      toast.error(dict.common.outOfStock);
      return;
    }
    addItem({
      productId: product.id,
      variantId,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      image: images[0]?.url ?? "/images/placeholder-product.svg",
      price,
      compareAtPrice: product.compareAtPrice,
      variantName: variant?.name,
      quantity: qty,
      maxStock: stock,
    });
    toast.success(dict.common.addedToBag);
    if (buyNow) {
      window.location.href = "/checkout";
    }
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-12 xl:gap-14">
      <div className="flex justify-center gap-2.5 lg:justify-start">
        {images.length > 1 ? (
          <div className="hidden shrink-0 flex-col gap-2 sm:flex">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveImage(i)}
                className={cn(
                  "relative block h-14 w-14 overflow-hidden border bg-bg-muted transition-colors",
                  i === activeImage
                    ? "border-ink"
                    : "border-transparent hover:border-oak"
                )}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  className="object-contain p-1"
                  sizes="56px"
                />
              </button>
            ))}
          </div>
        ) : null}

        <div>
          <button
            type="button"
            className="relative block h-[300px] w-[300px] overflow-hidden bg-bg-muted sm:h-[340px] sm:w-[340px] lg:h-[380px] lg:w-[380px]"
            onClick={() => setLightbox(true)}
            aria-label={dict.product.openGallery}
          >
            <Image
              src={images[activeImage]?.url ?? "/images/placeholder-product.svg"}
              alt={images[activeImage]?.alt ?? product.name}
              fill
              className="object-contain p-5 sm:p-6"
              sizes="380px"
              priority
            />
            {onSale ? (
              <span className="absolute left-3 top-3">
                <Badge variant="sale">{dict.product.sale}</Badge>
              </span>
            ) : null}
          </button>

          {images.length > 1 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto sm:hidden">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "relative block h-12 w-12 shrink-0 overflow-hidden border bg-bg-muted",
                    i === activeImage ? "border-ink" : "border-transparent"
                  )}
                >
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    className="object-contain p-0.5"
                    sizes="48px"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="lg:max-w-xl lg:pt-1">
        <Link
          href={`/brands/${product.brandSlug}`}
          className="text-[11px] uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-ink"
        >
          {product.brand}
        </Link>

        <h1 className="mt-3 font-serif text-[2rem] leading-[1.15] text-ink sm:text-[2.35rem]">
          {product.name}
        </h1>

        {product.reviewCount > 0 && product.rating != null ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
            <span className="tracking-wide text-ink">
              ★ {product.rating.toFixed(1)}
            </span>
            <span className="h-3 w-px bg-oak/60" aria-hidden />
            <span>
              {t((d) => d.product.reviewsCount, { count: product.reviewCount })}
            </span>
          </p>
        ) : null}

        <div className="mt-5 flex items-baseline gap-3 border-b border-oak/35 pb-5">
          <span className="font-serif text-2xl text-ink">
            {formatPrice(price)}
          </span>
          {onSale ? (
            <span className="text-sm text-ink-muted line-through">
              {formatPrice(product.compareAtPrice!)}
            </span>
          ) : null}
        </div>

        {product.shortDescription ? (
          <p className="mt-5 text-[15px] leading-relaxed text-ink-muted">
            {product.shortDescription}
          </p>
        ) : null}

        {product.skinTypes.length > 0 ? (
          <div className="mt-5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
              {dict.product.skinTypesLabel}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {product.skinTypes.map((type) => (
                <span
                  key={type}
                  className="border border-oak/50 bg-bg-muted/80 px-2.5 py-1 text-xs text-ink-muted"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {product.variants.length > 0 ? (
          <div className="mt-7">
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
              {product.variants[0]?.type === "SHADE"
                ? dict.product.shade
                : dict.product.option}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariantId(v.id)}
                  className={cn(
                    "min-w-[3rem] border px-3.5 py-2 text-sm transition-colors",
                    variantId === v.id
                      ? "border-ink bg-ink text-bg"
                      : "border-oak/55 text-ink hover:border-ink/50"
                  )}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-7 flex flex-wrap items-center gap-4">
          <div className="inline-flex items-center border border-oak/55">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center text-ink transition-opacity hover:opacity-60"
              aria-label="Decrease quantity"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              <Minus className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
            <span className="w-9 text-center text-sm tabular-nums">{qty}</span>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center text-ink transition-opacity hover:opacity-60"
              aria-label="Increase quantity"
              onClick={() => setQty((q) => Math.min(stock, q + 1))}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
          <p
            className={cn(
              "text-xs",
              stock > 0 ? "text-sage-dark" : "text-coral"
            )}
          >
            {stock > 0
              ? t((d) => d.product.inStockCount, { count: stock })
              : dict.product.outOfStockLabel}
          </p>
        </div>

        <div className="mt-6 flex gap-2">
          <Button
            className="min-w-0 flex-[1.4]"
            size="lg"
            disabled={stock < 1}
            onClick={() => addToCart(false)}
          >
            {dict.product.addToCart}
          </Button>
          <Button
            className="min-w-0 flex-1"
            size="lg"
            variant="secondary"
            disabled={stock < 1}
            onClick={() => addToCart(true)}
          >
            {dict.product.buyNow}
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="shrink-0 px-3"
            aria-label={
              showWishlisted
                ? dict.product.removeFromWishlist
                : dict.product.addToWishlist
            }
            onClick={() => {
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
                "h-5 w-5",
                showWishlisted && "fill-coral text-coral"
              )}
              strokeWidth={1.5}
            />
          </Button>
        </div>
      </div>

      {lightbox ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/75 p-4 backdrop-blur-[2px]">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close"
            onClick={() => setLightbox(false)}
          />
          <button
            type="button"
            className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center text-bg transition-opacity hover:opacity-70"
            aria-label="Close"
            onClick={() => setLightbox(false)}
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <div className="relative h-[min(70vw,24rem)] w-[min(70vw,24rem)] bg-bg-muted">
            <Image
              src={images[activeImage]?.url ?? "/images/placeholder-product.svg"}
              alt=""
              fill
              className="object-contain p-8"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
