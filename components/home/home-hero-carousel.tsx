"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import type {
  HeroCarouselSettings,
  HeroSlideView,
} from "@/server/repositories/hero.repository";

type Labels = {
  previous: string;
  next: string;
  goToSlide: string;
  onSale: string;
};

type Props = {
  slides: HeroSlideView[];
  settings: HeroCarouselSettings;
  labels: Labels;
};

export function HomeHeroCarousel({ slides, settings, labels }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const rootRef = useRef<HTMLElement | null>(null);
  const dragXRef = useRef(0);
  const touchRef = useRef<{
    x: number;
    y: number;
    width: number;
    locked: "x" | "y" | null;
  } | null>(null);
  const count = slides.length;

  const goTo = useCallback(
    (next: number) => {
      if (count <= 1) return;
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  const next = useCallback(() => {
    setIndex((i) => (count <= 1 ? i : (i + 1) % count));
  }, [count]);
  const prev = useCallback(() => {
    setIndex((i) => (count <= 1 ? i : (i - 1 + count) % count));
  }, [count]);

  useEffect(() => {
    if (!settings.autoplay || count <= 1 || paused || dragging) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % count),
      settings.intervalSeconds * 1000
    );
    return () => window.clearInterval(id);
  }, [settings.autoplay, settings.intervalSeconds, count, paused, dragging]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || count <= 1) return;

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      touchRef.current = {
        x: t.clientX,
        y: t.clientY,
        width: el.offsetWidth || 1,
        locked: null,
      };
      dragXRef.current = 0;
      setPaused(true);
      setDragging(true);
      setDragX(0);
    };

    const onMove = (e: TouchEvent) => {
      const start = touchRef.current;
      const t = e.touches[0];
      if (!start || !t) return;

      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;

      if (start.locked == null) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        start.locked = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }

      if (start.locked !== "x") return;
      e.preventDefault();
      dragXRef.current = dx;
      setDragX(dx);
    };

    const onEnd = () => {
      const start = touchRef.current;
      const dx = dragXRef.current;
      touchRef.current = null;
      dragXRef.current = 0;
      setDragging(false);
      setPaused(false);
      setDragX(0);

      if (!start || start.locked !== "x") return;
      const threshold = Math.min(72, start.width * 0.18);
      if (dx <= -threshold) next();
      else if (dx >= threshold) prev();
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [count, next, prev]);

  if (count === 0) return null;

  const trackOffset = `calc(${-index * 100}% + ${dragX}px)`;

  return (
    <section
      ref={rootRef}
      className="group/hero relative isolate touch-pan-y overflow-hidden bg-bg"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
      aria-roledescription="carousel"
    >
      <div
        className={cn(
          "flex will-change-transform",
          dragging
            ? "transition-none"
            : "transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        )}
        style={{ transform: `translateX(${trackOffset})` }}
      >
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className="relative w-full shrink-0"
            aria-hidden={i !== index}
          >
            <HeroSlide slide={slide} priority={i === 0} labels={labels} />
          </div>
        ))}
      </div>

      {count > 1 ? (
        <>
          <SideArrow side="left" onClick={prev} label={labels.previous} />
          <SideArrow side="right" onClick={next} label={labels.next} />
        </>
      ) : null}

      {count > 1 ? (
        <div className="pointer-events-none absolute inset-x-0 top-[calc(min(118vw,60svh)-2rem)] z-10 flex justify-center gap-1.5 sm:hidden">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`${labels.goToSlide} ${i + 1}`}
              aria-current={i === index}
              onClick={() => goTo(i)}
              className={cn(
                "pointer-events-auto h-1.5 rounded-full shadow-[0_1px_4px_rgba(28,27,26,0.25)] transition-all duration-300",
                i === index ? "w-6 bg-white" : "w-1.5 bg-white/60"
              )}
            />
          ))}
        </div>
      ) : null}

      {count > 1 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-10 hidden items-center justify-center gap-4 sm:flex">
          <button
            type="button"
            onClick={prev}
            aria-label={labels.previous}
            className="pointer-events-auto inline-flex h-9 w-9 md:hidden items-center justify-center rounded-full bg-bg/55 text-ink shadow-[0_1px_0_rgba(28,27,26,0.06)] ring-1 ring-ink/10 backdrop-blur-[2px] transition-[background-color] hover:bg-bg/80"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <div className="flex items-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`${labels.goToSlide} ${i + 1}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className={cn(
                  "pointer-events-auto h-1.5 rounded-full transition-all duration-300",
                  i === index
                    ? "w-7 bg-ink"
                    : "w-1.5 bg-ink/30 hover:bg-ink/50"
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={next}
            aria-label={labels.next}
            className="pointer-events-auto inline-flex h-9 w-9 md:hidden items-center justify-center rounded-full bg-bg/55 text-ink shadow-[0_1px_0_rgba(28,27,26,0.06)] ring-1 ring-ink/10 backdrop-blur-[2px] transition-[background-color] hover:bg-bg/80"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      ) : null}
    </section>
  );
}

/** Tablet/desktop arrows, vertically centred on the slide edges. */
function SideArrow({
  side,
  onClick,
  label,
}: {
  side: "left" | "right";
  onClick: () => void;
  label: string;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "group/arrow absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-bg/70 text-ink opacity-80 shadow-[0_10px_30px_-12px_rgba(28,27,26,0.35)] ring-1 ring-ink/10 backdrop-blur-md transition-[opacity,background-color,scale] duration-300 ease-out hover:scale-105 hover:bg-bg hover:opacity-100 focus-visible:opacity-100 group-hover/hero:opacity-100 md:inline-flex lg:h-14 lg:w-14",
        side === "left" ? "left-4 lg:left-6" : "right-4 lg:right-6"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 transition-transform duration-300 ease-out",
          side === "left"
            ? "group-hover/arrow:-translate-x-0.5"
            : "group-hover/arrow:translate-x-0.5"
        )}
        strokeWidth={1.5}
      />
    </button>
  );
}

function HeroSlide({
  slide,
  priority,
  labels,
}: {
  slide: HeroSlideView;
  priority: boolean;
  labels: Labels;
}) {
  const showSale =
    slide.type === "PRODUCT" &&
    slide.product &&
    slide.product.compareAtPrice != null &&
    slide.product.compareAtPrice > slide.product.price;

  return (
    <div className="relative isolate flex flex-col sm:block sm:min-h-[88svh] lg:min-h-[min(90svh,46rem)]">
      {/* Phones: clean image on top that fades into the page; text below it.
          sm+: full-bleed image behind the text with the soft veil. */}
      <div className="relative h-[min(118vw,60svh)] w-full overflow-hidden sm:absolute sm:inset-0 sm:h-auto">
        <Image
          src={slide.imageUrl}
          alt={slide.imageAlt || slide.headline}
          fill
          priority={priority}
          className="animate-hero-zoom object-cover object-[70%_40%] sm:object-[70%_48%] lg:object-[62%_46%]"
          sizes="100vw"
        />
        <div className="hero-veil pointer-events-none absolute inset-0 hidden sm:block" aria-hidden />
        <div className="hero-grain pointer-events-none absolute inset-0" aria-hidden />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-bg via-bg/60 to-transparent sm:hidden"
          aria-hidden
        />

        {showSale ? (
          <span className="absolute left-5 top-5 bg-coral px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white sm:hidden">
            {slide.product?.discountPercent != null
              ? `−${slide.product.discountPercent}% · ${labels.onSale}`
              : labels.onSale}
          </span>
        ) : null}
      </div>

      <div className="container-page relative -mt-6 flex flex-col pb-12 sm:mt-0 sm:min-h-[88svh] sm:justify-center sm:pb-24 sm:pt-28 lg:min-h-[min(90svh,46rem)]">
        <div className="w-full max-w-[34rem] md:ml-14 lg:ml-16 2xl:ml-0">
          {slide.eyebrow ? (
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-coral sm:w-14 sm:bg-oak" aria-hidden />
              <p className="text-[10px] uppercase tracking-[0.26em] text-ink-muted sm:tracking-[0.32em]">
                {slide.eyebrow}
              </p>
            </div>
          ) : null}

          <h1 className="mt-3 font-serif text-[clamp(2.2rem,10vw,2.9rem)] leading-[1.02] tracking-[-0.025em] text-ink text-balance sm:mt-7 sm:text-[clamp(2.6rem,7vw,4.75rem)] sm:leading-[0.98]">
            <span className="block">{slide.headline}</span>
            {slide.headlineAccent ? (
              <span className="mt-1 block italic text-coral">
                {slide.headlineAccent}
              </span>
            ) : null}
          </h1>

          {slide.subhead ? (
            <p className="mt-3 line-clamp-3 max-w-[36ch] text-[14px] leading-[1.65] text-ink-muted sm:mt-7 sm:line-clamp-none sm:max-w-[34ch] sm:text-base sm:leading-[1.8]">
              {slide.subhead}
            </p>
          ) : null}

          {slide.product ? (
            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 sm:mt-6">
              <span className="font-serif text-[1.6rem] leading-none tracking-tight text-ink sm:text-[1.85rem]">
                {formatPrice(slide.product.price)}
              </span>
              {showSale && slide.product.compareAtPrice != null ? (
                <>
                  <span className="text-[14px] text-ink-muted line-through sm:text-[15px]">
                    {formatPrice(slide.product.compareAtPrice)}
                  </span>
                  <span className="hidden bg-coral px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white sm:inline">
                    {slide.product.discountPercent != null
                      ? `−${slide.product.discountPercent}% · ${labels.onSale}`
                      : labels.onSale}
                  </span>
                </>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6 flex w-full items-center gap-2.5 sm:mt-10 sm:flex-wrap sm:gap-4">
            {slide.ctaPrimaryHref && slide.ctaPrimaryLabel ? (
              <Link
                href={slide.ctaPrimaryHref}
                className="group inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2.5 bg-coral px-5 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_14px_34px_-16px_rgba(28,27,26,0.45)] transition-colors hover:bg-coral-dark sm:flex-none sm:px-7"
              >
                <span className="truncate">{slide.ctaPrimaryLabel}</span>
                <ArrowRight
                  className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-1"
                  strokeWidth={1.75}
                />
              </Link>
            ) : null}
            {slide.ctaSecondaryHref && slide.ctaSecondaryLabel ? (
              <Link
                href={slide.ctaSecondaryHref}
                className="inline-flex h-12 min-w-0 shrink-0 items-center justify-center border border-ink/20 px-4 text-[11px] uppercase tracking-[0.16em] text-ink transition-colors hover:border-ink/40 hover:bg-bg/80 sm:bg-bg/55 sm:px-6 sm:backdrop-blur-[2px]"
              >
                <span className="truncate">{slide.ctaSecondaryLabel}</span>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
