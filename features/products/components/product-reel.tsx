"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Volume2, VolumeX } from "lucide-react";

const INSTAGRAM_URL = "https://www.instagram.com/soyoung/";

type Props = {
  src: string;
  poster?: string | null;
  productName: string;
  title: string;
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
  title,
  followCta,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeSrc, setActiveSrc] = useState<string | undefined>(undefined);
  const [muted, setMuted] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

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
      { rootMargin: "120px 0px", threshold: 0.35 }
    );

    io.observe(root);
    return () => io.disconnect();
  }, [src, reducedMotion]);

  return (
    <section
      ref={rootRef}
      className="border-b border-oak/30 bg-bg"
      aria-label={title}
    >
      <div className="container-page py-10 lg:py-14">
        <h2 className="font-serif text-2xl tracking-tight text-ink sm:text-[1.75rem]">
          {title}
        </h2>

        <div className="mt-6 flex flex-col items-start gap-5 sm:flex-row sm:items-end sm:gap-8">
          <div className="relative w-full max-w-[17.5rem] overflow-hidden bg-ink/5 aspect-[9/16] sm:max-w-[19rem]">
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
            {!reducedMotion ? (
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center bg-ink/70 text-bg backdrop-blur-sm transition-opacity hover:bg-ink/85"
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

          <div className="max-w-sm pb-1">
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
      </div>
    </section>
  );
}
