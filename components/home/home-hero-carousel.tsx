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
      className="relative isolate touch-pan-y overflow-hidden bg-bg"
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
        <div className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex items-center justify-center gap-3 sm:bottom-8 sm:gap-4">
          <button
            type="button"
            onClick={prev}
            aria-label={labels.previous}
            className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-bg/55 text-ink shadow-[0_1px_0_rgba(28,27,26,0.06)] ring-1 ring-ink/10 backdrop-blur-[2px] transition-[background-color] hover:bg-bg/80"
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
            className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-bg/55 text-ink shadow-[0_1px_0_rgba(28,27,26,0.06)] ring-1 ring-ink/10 backdrop-blur-[2px] transition-[background-color] hover:bg-bg/80"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      ) : null}
    </section>
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
    <div className="relative isolate min-h-[min(86svh,38rem)] sm:min-h-[88svh] lg:min-h-[min(90svh,46rem)]">
      <Image
        src={slide.imageUrl}
        alt={slide.imageAlt || slide.headline}
        fill
        priority={priority}
        className="animate-hero-zoom object-cover object-[82%_38%] sm:object-[70%_48%] lg:object-[62%_46%]"
        sizes="100vw"
      />
      <div className="hero-veil pointer-events-none absolute inset-0" aria-hidden />
      <div className="hero-grain pointer-events-none absolute inset-0" aria-hidden />

      <div className="container-page relative flex min-h-[min(86svh,38rem)] flex-col items-center justify-center pb-16 pt-24 text-center sm:min-h-[88svh] sm:items-start sm:pb-24 sm:pt-28 sm:text-left lg:min-h-[min(90svh,46rem)]">
        <div className="w-full max-w-[22rem] sm:max-w-[34rem]">
          {slide.eyebrow ? (
            <div className="flex items-center justify-center gap-3 sm:justify-start">
              <span className="h-px w-8 bg-oak sm:w-14" aria-hidden />
              <p className="text-[10px] uppercase tracking-[0.26em] text-ink-muted sm:tracking-[0.32em]">
                {slide.eyebrow}
              </p>
            </div>
          ) : null}

          <h1 className="mt-4 font-serif text-[clamp(2.35rem,11vw,3.4rem)] leading-[1.02] tracking-[-0.025em] text-ink sm:mt-7 sm:text-[clamp(2.6rem,7vw,4.75rem)] sm:leading-[0.98]">
            <span className="block">{slide.headline}</span>
            {slide.headlineAccent ? (
              <span className="mt-1 block italic text-coral">
                {slide.headlineAccent}
              </span>
            ) : null}
          </h1>

          {slide.subhead ? (
            <p className="mx-auto mt-4 max-w-[30ch] text-[14px] leading-[1.7] text-ink-muted sm:mx-0 sm:mt-7 sm:max-w-[34ch] sm:text-base sm:leading-[1.8]">
              {slide.subhead}
            </p>
          ) : null}

          {slide.product ? (
            <div className="mt-5 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 sm:mt-6 sm:justify-start">
              <span className="font-serif text-[1.65rem] leading-none tracking-tight text-ink sm:text-[1.85rem]">
                {formatPrice(slide.product.price)}
              </span>
              {showSale && slide.product.compareAtPrice != null ? (
                <>
                  <span className="text-[15px] text-ink-muted line-through">
                    {formatPrice(slide.product.compareAtPrice)}
                  </span>
                  {slide.product.discountPercent != null ? (
                    <span className="bg-coral px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
                      −{slide.product.discountPercent}% · {labels.onSale}
                    </span>
                  ) : (
                    <span className="bg-coral px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
                      {labels.onSale}
                    </span>
                  )}
                </>
              ) : null}
            </div>
          ) : null}

          <div className="mx-auto mt-7 flex w-full max-w-xs flex-col gap-2.5 sm:mx-0 sm:mt-10 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            {slide.ctaPrimaryHref && slide.ctaPrimaryLabel ? (
              <Link
                href={slide.ctaPrimaryHref}
                className="group inline-flex h-12 w-full items-center justify-center gap-2.5 bg-coral px-7 text-[11px] uppercase tracking-[0.16em] font-bold text-white shadow-[0_14px_34px_-16px_rgba(28,27,26,0.45)] transition-colors hover:bg-coral-dark sm:w-auto"
              >
                {slide.ctaPrimaryLabel}
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:translate-x-1"
                  strokeWidth={1.75}
                />
              </Link>
            ) : null}
            {slide.ctaSecondaryHref && slide.ctaSecondaryLabel ? (
              <Link
                href={slide.ctaSecondaryHref}
                className="inline-flex h-12 min-h-12 w-full shrink-0 items-center justify-center border border-ink/20 bg-bg/70 px-6 text-[11px] uppercase tracking-[0.16em] text-ink backdrop-blur-[2px] transition-colors hover:border-ink/40 hover:bg-bg/80 sm:w-auto sm:bg-bg/55"
              >
                {slide.ctaSecondaryLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
