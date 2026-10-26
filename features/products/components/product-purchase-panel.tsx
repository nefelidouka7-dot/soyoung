"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice, cn } from "@/lib/utils";
import { useCommerceSettings } from "@/lib/commerce-settings";
import { MAX_QTY_PER_LINE } from "@/lib/checkout-options";
import { useCartStore } from "@/features/cart/store";
import { useWishlistStore } from "@/features/wishlist/store";
import { useTranslation } from "@/lib/i18n/use-translation";

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const LOW_STOCK = 5;

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
    skinTypes: string[];
  };
};

export function ProductPurchasePanel({ product }: Props) {
  const { dict, t } = useTranslation();
  const { freeShippingThreshold } = useCommerceSettings();
  const [activeImage, setActiveImage] = useState(0);
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const [lightbox, setLightbox] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
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
  const discount = onSale
    ? Math.round((1 - price / product.compareAtPrice!) * 100)
    : 0;
  const freeShippingFrom = formatPrice(freeShippingThreshold).replace(
    /[.,]00$/,
    ""
  );

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

  // Sticky mobile bar appears once the main CTA has scrolled above the viewport.
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") setActiveImage((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft")
        setActiveImage((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox, images.length]);

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

  function toggleWishlist() {
    toggleWish(product.id);
    toast.success(
      showWishlisted
        ? dict.product.removedFromWishlist
        : dict.product.addedToWishlist
    );
  }

  function selectVariant(id: string) {
    setVariantId(id);
    setActiveImage(0);
    setQty(1);
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14 xl:gap-20">
      {/* ── Gallery ─────────────────────────────────────────── */}
      <div className="lg:sticky lg:top-28">
        <MobileGallery
          images={images}
          productName={product.name}
          onOpen={(i) => {
            setActiveImage(i);
            setLightbox(true);
          }}
          badge={onSale ? `−${discount}%` : null}
          wishlist={
            <WishlistButton
              active={showWishlisted}
              onClick={toggleWishlist}
              label={
                showWishlisted
                  ? dict.product.removeFromWishlist
                  : dict.product.addToWishlist
              }
            />
          }
        />

        <div className="hidden gap-4 sm:flex">
          {images.length > 1 ? (
            <div className="flex w-[4.5rem] shrink-0 flex-col gap-3">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  aria-label={`${dict.product.openGallery} ${i + 1}`}
                  aria-current={i === activeImage}
                  className={cn(
                    "relative block aspect-square w-full overflow-hidden rounded-sm bg-surface ring-1 transition-[box-shadow,opacity] duration-300",
                    i === activeImage
                      ? "ring-ink"
                      : "opacity-70 ring-oak/50 hover:opacity-100 hover:ring-oak"
                  )}
                >
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    className="object-contain p-1.5"
                    sizes="72px"
                  />
                </button>
              ))}
            </div>
          ) : null}

          <div className="relative min-w-0 flex-1">
            <button
              type="button"
              className="group relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-sm bg-surface"
              onClick={() => setLightbox(true)}
              aria-label={dict.product.openGallery}
            >
              <span
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_45%,transparent,color-mix(in_srgb,var(--oak-soft)_55%,transparent))]"
                aria-hidden
              />
              {images.map((img, i) => (
                <span
                  key={img.id}
                  className={cn(
                    "absolute inset-8 transition-opacity duration-500 lg:inset-12",
                    EASE,
                    i === activeImage ? "opacity-100" : "opacity-0"
                  )}
                  aria-hidden={i !== activeImage}
                >
                  <Image
                    src={img.url}
                    alt={img.alt ?? product.name}
                    fill
                    className={cn(
                      "object-contain transition-transform duration-700 group-hover:scale-[1.06]",
                      EASE
                    )}
                    sizes="(max-width:1024px) 80vw, 46vw"
                    loading={i === 0 ? "eager" : "lazy"}
                    fetchPriority={i === 0 ? "high" : undefined}
                  />
                </span>
              ))}
            </button>

            {onSale ? (
              <span className="absolute left-4 top-4 z-10 bg-coral px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] text-white">
                −{discount}%
              </span>
            ) : null}
            <div className="absolute right-4 top-4 z-10">
              <WishlistButton
                active={showWishlisted}
                onClick={toggleWishlist}
                label={
                  showWishlisted
                    ? dict.product.removeFromWishlist
                    : dict.product.addToWishlist
                }
              />
            </div>
            {images.length > 1 ? (
              <span className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-full bg-bg/80 px-2.5 py-1 text-[11px] tabular-nums tracking-[0.08em] text-ink-muted backdrop-blur-sm">
                {activeImage + 1} / {images.length}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Info ────────────────────────────────────────────── */}
      {/* Phones: a rounded sheet that overlaps the gallery's bottom edge. */}
      <div className="relative z-10 -mx-4 -mt-14 rounded-t-[1.75rem] bg-bg px-5 pt-3 shadow-[0_-18px_40px_-28px_rgba(28,27,26,0.35)] sm:mx-0 sm:mt-0 sm:rounded-none sm:bg-transparent sm:px-0 sm:pt-0 sm:shadow-none lg:pt-2">
        <span className="mx-auto mb-5 block h-1 w-10 rounded-full bg-oak sm:hidden" aria-hidden />

        <div className="flex flex-col">
          <Link
            href={`/brands/${product.brandSlug}`}
            className="group inline-flex items-center gap-3 self-start text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-muted transition-colors hover:text-ink sm:text-[11px]"
          >
            <span
              className={cn(
                "h-px w-6 bg-coral transition-[width] duration-500 group-hover:w-12 sm:w-8",
                EASE
              )}
              aria-hidden
            />
            {product.brand}
          </Link>

          <h1 className="mt-3 font-serif text-[1.85rem] leading-[1.08] tracking-[-0.02em] text-ink text-balance sm:mt-4 sm:text-[2.6rem] sm:leading-[1.06] xl:text-[3.1rem]">
            {product.name}
          </h1>

          {/* On phones the description drops below price + stock. */}
          {product.shortDescription ? (
            <p className="mt-5 max-w-[46ch] text-[14px] leading-[1.7] text-ink-muted max-sm:order-1 sm:text-[15px] sm:leading-[1.75]">
              {product.shortDescription}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 sm:mt-7 sm:gap-x-4">
            <span className="font-serif text-[1.9rem] leading-none tracking-tight text-ink sm:text-[2.1rem]">
              {formatPrice(price)}
            </span>
            {onSale ? (
              <>
                <span className="text-[14px] text-ink-muted line-through sm:text-[15px]">
                  {formatPrice(product.compareAtPrice!)}
                </span>
                <span className="rounded-full bg-coral/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-coral-dark sm:text-[11px]">
                  {dict.product.sale} −{discount}%
                </span>
              </>
            ) : null}
          </div>

          <StockLine stock={stock} t={t} dict={dict} />
        </div>

        {product.skinTypes.length > 0 ? (
          <div className="mt-6 border-t border-oak/35 pt-5 sm:mt-8 sm:pt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage">
              {dict.product.skinTypesLabel}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.skinTypes.map((type) => (
                <span
                  key={type}
                  className="rounded-full bg-oak-soft/80 px-3.5 py-1.5 text-[13px] text-ink"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {product.variants.length > 0 ? (
          <div className="mt-5 border-t border-oak/35 pt-5 sm:mt-6 sm:pt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage">
              {product.variants[0]?.type === "SHADE"
                ? dict.product.shade
                : dict.product.option}
              {variant ? (
                <span className="ml-2 normal-case tracking-normal text-ink">
                  · {variant.name}
                </span>
              ) : null}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => selectVariant(v.id)}
                  disabled={v.stock < 1}
                  className={cn(
                    "min-w-[3.25rem] rounded-full border px-4 py-2 text-[13px] transition-colors duration-300 disabled:cursor-not-allowed disabled:line-through disabled:opacity-40",
                    variantId === v.id
                      ? "border-ink bg-ink text-bg"
                      : "border-oak text-ink hover:border-ink/60"
                  )}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div ref={ctaRef} className="mt-6 flex gap-2.5 sm:mt-8 sm:gap-3">
          <div
            className="inline-flex h-12 shrink-0 items-center rounded-full border border-oak bg-surface sm:h-14"
            role="group"
            aria-label={dict.product.quantity}
          >
            <button
              type="button"
              className="inline-flex h-12 w-10 items-center justify-center text-ink transition-opacity sm:h-14 sm:w-11 hover:opacity-60 disabled:opacity-30"
              aria-label="Decrease quantity"
              disabled={qty <= 1}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              <Minus className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
            <span className="w-7 text-center text-[15px] tabular-nums">{qty}</span>
            <button
              type="button"
              className="inline-flex h-12 w-10 items-center justify-center text-ink transition-opacity sm:h-14 sm:w-11 hover:opacity-60 disabled:opacity-30"
              aria-label="Increase quantity"
              disabled={qty >= Math.min(stock, MAX_QTY_PER_LINE)}
              onClick={() =>
                setQty((q) => Math.min(stock, MAX_QTY_PER_LINE, q + 1))
              }
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>

          <button
            type="button"
            disabled={stock < 1}
            onClick={() => addToCart(false)}
            className={cn(
              "group relative inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-3 overflow-hidden rounded-full bg-coral px-5 text-[11px] sm:h-14 sm:px-6 sm:text-[12px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_18px_40px_-20px_rgba(217,119,87,0.9)] transition-[background-color,box-shadow] duration-300 hover:bg-coral-dark disabled:cursor-not-allowed disabled:bg-ink/30 disabled:shadow-none"
            )}
          >
            <span className="truncate">
              {stock < 1 ? dict.product.outOfStockLabel : dict.product.addToCart}
            </span>
            {stock > 0 ? (
              <>
                <span className="h-4 w-px bg-white/40 max-[380px]:hidden" aria-hidden />
                <span className="tabular-nums max-[380px]:hidden">{formatPrice(price * qty)}</span>
              </>
            ) : null}
          </button>
        </div>

        <button
          type="button"
          disabled={stock < 1}
          onClick={() => addToCart(true)}
          className="mt-2.5 inline-flex h-12 w-full items-center justify-center rounded-full border border-ink/20 text-[11px] sm:mt-3 sm:text-[12px] font-bold uppercase tracking-[0.14em] text-ink transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-bg disabled:pointer-events-none disabled:opacity-40"
        >
          {dict.product.buyNow}
        </button>

        <ul className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-sm bg-oak/40 ring-1 ring-oak/40 sm:mt-8">
          {[
            {
              icon: Truck,
              label: t((d) => d.product.freeShippingFrom, { amount: freeShippingFrom }),
            },
            { icon: RotateCcw, label: dict.product.easyReturns },
            { icon: ShieldCheck, label: dict.product.authentic },
          ].map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex flex-col items-center gap-2 bg-bg px-2 py-3.5 text-center sm:items-start sm:px-4 sm:text-left"
            >
              <Icon className="h-[18px] w-[18px] shrink-0 text-sage" strokeWidth={1.5} />
              <span className="text-[11px] leading-snug text-ink-muted sm:text-[12px]">{label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Sticky mobile purchase bar ──────────────────────── */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-oak/40 bg-bg/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md transition-[translate,opacity] duration-500 lg:hidden",
          EASE,
          showStickyBar
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-full opacity-0"
        )}
        aria-hidden={!showStickyBar}
      >
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-surface ring-1 ring-oak/40">
            <Image
              src={images[0]?.url ?? "/images/placeholder-product.svg"}
              alt=""
              fill
              className="object-contain p-1"
              sizes="48px"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] text-ink">{product.name}</span>
            <span className="block font-serif text-[1.15rem] leading-tight text-ink">
              {formatPrice(price)}
            </span>
          </span>
          <button
            type="button"
            disabled={stock < 1}
            tabIndex={showStickyBar ? 0 : -1}
            onClick={() => addToCart(false)}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-coral px-5 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-coral-dark disabled:bg-ink/30"
          >
            {stock < 1 ? dict.product.outOfStockLabel : dict.product.addToCart}
          </button>
        </div>
      </div>

      {/* ── Lightbox ────────────────────────────────────────── */}
      {lightbox ? (
        <div
          className="animate-fade-in fixed inset-0 z-[90] flex flex-col bg-bg/95 backdrop-blur-md"
          role="dialog"
          aria-modal
          aria-label={dict.product.openGallery}
        >
          <div className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-6">
            <span className="text-[11px] tabular-nums tracking-[0.14em] text-ink-muted">
              {activeImage + 1} / {images.length}
            </span>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-oak-soft"
              aria-label="Close"
              onClick={() => setLightbox(false)}
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>

          <div className="relative min-h-0 flex-1">
            <button
              type="button"
              className="absolute inset-0 cursor-zoom-out"
              aria-label="Close"
              onClick={() => setLightbox(false)}
            />
            <span className="pointer-events-none absolute inset-6 sm:inset-16">
              <Image
                key={images[activeImage]?.id}
                src={images[activeImage]?.url ?? "/images/placeholder-product.svg"}
                alt={images[activeImage]?.alt ?? product.name}
                fill
                className="animate-fade-in object-contain"
                sizes="100vw"
              />
            </span>
            {images.length > 1 ? (
              <>
                <LightboxArrow
                  side="left"
                  onClick={() =>
                    setActiveImage((i) => (i - 1 + images.length) % images.length)
                  }
                />
                <LightboxArrow
                  side="right"
                  onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                />
              </>
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className="flex shrink-0 justify-center gap-2 overflow-x-auto px-4 py-5">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  aria-label={`${dict.product.openGallery} ${i + 1}`}
                  className={cn(
                    "relative h-14 w-14 shrink-0 overflow-hidden rounded-sm bg-surface ring-1 transition-[box-shadow,opacity]",
                    i === activeImage ? "ring-ink" : "opacity-60 ring-oak/50 hover:opacity-100"
                  )}
                >
                  <Image src={img.url} alt="" fill className="object-contain p-1" sizes="56px" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Phones: full-bleed swipeable gallery with dots. */
function MobileGallery({
  images,
  productName,
  onOpen,
  badge,
  wishlist,
}: {
  images: Array<{ id: string; url: string; alt: string | null }>;
  productName: string;
  onOpen: (index: number) => void;
  badge: string | null;
  wishlist: React.ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  return (
    <div className="relative -mx-4 sm:hidden">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
        }}
      >
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => onOpen(i)}
            className="relative aspect-square w-full shrink-0 snap-center bg-surface"
          >
            <span className="absolute inset-8">
              <Image
                src={img.url}
                alt={img.alt ?? productName}
                fill
                className="object-contain"
                sizes="100vw"
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : undefined}
              />
            </span>
          </button>
        ))}
      </div>
      {badge ? (
        <span className="absolute left-4 top-4 bg-coral px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] text-white">
          {badge}
        </span>
      ) : null}
      <div className="absolute right-4 top-4">{wishlist}</div>
      {images.length > 1 ? (
        <div className="absolute inset-x-0 bottom-10 flex justify-center gap-1.5">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              aria-label={`${i + 1}`}
              onClick={() => {
                const el = trackRef.current;
                el?.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
              }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === index ? "w-6 bg-ink" : "w-1.5 bg-ink/25"
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function WishlistButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className="group inline-flex h-11 w-11 items-center justify-center rounded-full bg-bg/85 text-ink shadow-[0_8px_24px_-12px_rgba(28,27,26,0.35)] ring-1 ring-ink/5 backdrop-blur-sm transition-[scale,background-color] duration-300 hover:scale-105 hover:bg-bg"
    >
      <Heart
        className={cn(
          "h-[18px] w-[18px] transition-[color,fill,scale] duration-300 group-active:scale-90",
          active ? "fill-coral text-coral" : "text-ink"
        )}
        strokeWidth={1.5}
      />
    </button>
  );
}

function StockLine({
  stock,
  t,
  dict,
}: {
  stock: number;
  t: ReturnType<typeof useTranslation>["t"];
  dict: ReturnType<typeof useTranslation>["dict"];
}) {
  const state = stock < 1 ? "out" : stock <= LOW_STOCK ? "low" : "in";
  return (
    <p className="mt-3 flex items-center gap-2.5 text-[13px] text-ink-muted sm:mt-5">
      <span className="relative flex h-2 w-2" aria-hidden>
        {state !== "out" ? (
          <span
            className={cn(
              "absolute inset-0 animate-ping rounded-full opacity-60",
              state === "low" ? "bg-coral" : "bg-sage"
            )}
          />
        ) : null}
        <span
          className={cn(
            "relative h-2 w-2 rounded-full",
            state === "out" ? "bg-ink/30" : state === "low" ? "bg-coral" : "bg-sage"
          )}
        />
      </span>
      {state === "out"
        ? dict.product.outOfStockLabel
        : state === "low"
          ? t((d) => d.product.lowStock, { count: stock })
          : dict.product.inStock}
    </p>
  );
}

function LightboxArrow({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous image" : "Next image"}
      className={cn(
        "absolute top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-ink shadow-[0_10px_30px_-12px_rgba(28,27,26,0.35)] ring-1 ring-ink/10 transition-[scale] duration-300 hover:scale-105",
        side === "left" ? "left-3 sm:left-6" : "right-3 sm:right-6"
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={1.5} />
    </button>
  );
}
