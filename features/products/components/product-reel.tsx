"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Volume2, VolumeX } from "lucide-react";

const INSTAGRAM_URL = "https://www.instagram.com/soyoung/";
const HANDLE = "@soyoung";

type Props = {
  src: string;
  poster?: string | null;
  productName: string;
  brandName?: string | null;
  eyebrow: string;
  title: string;
  support: string;
  followCta: string;
};

/**
 * Lightweight vertical reel: no network until near viewport, pause off-screen,
 * muted autoplay only when visible (respects prefers-reduced-motion).
 */
export function ProductReel({
  src,
  poster,
  productName,
  brandName,
  eyebrow,
  title,
  support,
  followCta,
}: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeSrc, setActiveSrc] = useState<string | undefined>(undefined);
  const [muted, setMuted] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = Boolean(entry?.isIntersecting);
        setInView(visible);
        if (visible) {
          setActiveSrc((prev) => prev ?? src);
        }
        const el = videoRef.current;
        if (!el) return;
        if (visible && !reducedMotion) {
          void el.play().catch(() => {
            /* autoplay blocked — user can tap */
          });
        } else {
          el.pause();
        }
      },
      { rootMargin: "120px 0px", threshold: 0.28 }
    );

    io.observe(root);
    return () => io.disconnect();
  }, [src, reducedMotion]);

  return (
    <section
      ref={rootRef}
      className="relative isolate overflow-hidden border-b border-oak/30"
      aria-label={title}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-bg-muted"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 85% 40%, color-mix(in srgb, var(--color-oak) 55%, transparent), transparent 70%), radial-gradient(ellipse 55% 60% at 10% 80%, color-mix(in srgb, var(--color-coral) 12%, transparent), transparent 65%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in srgb, var(--color-oak) 35%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--color-oak) 35%, transparent) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 50%, black 20%, transparent 75%)",
        }}
      />

      <div className="container-page relative grid items-center gap-10 py-14 sm:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:gap-16 lg:py-20">
        <div
          className={`max-w-xl transition-all duration-700 ease-out ${
            inView || reducedMotion
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0"
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coral">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-[2rem] leading-[1.1] tracking-tight text-ink sm:text-[2.5rem]">
            {title}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-muted sm:text-[15px]">
            {support}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3"
            >
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-oak/50 transition-transform duration-500 group-hover:scale-[1.03]">
                <Image
                  src="/images/soyoung_logo.png"
                  alt=""
                  fill
                  className="object-contain p-2"
                  sizes="48px"
                />
              </span>
              <span className="text-left">
                <span className="block text-sm font-bold text-ink">{HANDLE}</span>
                <span className="block text-[12px] text-ink-muted">
                  Instagram
                </span>
              </span>
            </Link>

            <Link
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center bg-ink px-6 text-[12px] font-bold uppercase tracking-[0.08em] text-bg transition-opacity hover:opacity-85"
            >
              {followCta}
            </Link>
          </div>
        </div>

        <div
          className={`relative mx-auto w-full max-w-[17.5rem] transition-all duration-700 ease-out delay-100 lg:mx-0 lg:justify-self-end ${
            inView || reducedMotion
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          }`}
        >
          <div className="relative overflow-hidden bg-ink/[0.04] ring-1 ring-oak/45 aspect-[9/16]">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              poster={poster || undefined}
              src={activeSrc}
              muted={muted}
              playsInline
              loop
              preload="none"
              controls={reducedMotion}
              onClick={() => {
                const el = videoRef.current;
                if (!el) return;
                if (el.paused) void el.play().catch(() => {});
              }}
              aria-label={productName}
            />

            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/75 via-ink/25 to-transparent px-4 pb-4 pt-16"
              aria-hidden
            >
              {brandName ? (
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
                  {brandName}
                </p>
              ) : null}
              <p className="mt-1 line-clamp-2 font-serif text-lg leading-snug text-white">
                {productName}
              </p>
            </div>

            {!reducedMotion ? (
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center bg-bg/90 text-ink ring-1 ring-oak/40 backdrop-blur-sm transition-opacity hover:bg-bg"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? (
                  <VolumeX className="h-4 w-4" aria-hidden />
                ) : (
                  <Volume2 className="h-4 w-4" aria-hidden />
                )}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
