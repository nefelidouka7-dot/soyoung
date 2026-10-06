"use client";

import { ArrowRight, Monitor, Smartphone } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";

export type HeroPreviewDraft = {
  type: "CAMPAIGN" | "PRODUCT";
  imageSrc: string;
  locale: "en" | "el";
  eyebrow: string;
  headline: string;
  headlineAccent: string;
  subhead: string;
  ctaPrimary: string;
  ctaSecondary: string;
  product: {
    price: number;
    compareAtPrice: number | null;
  } | null;
};

type Props = {
  draft: HeroPreviewDraft;
  device: "mobile" | "desktop";
  onDeviceChange: (device: "mobile" | "desktop") => void;
  locale: "en" | "el";
  onLocaleChange: (locale: "en" | "el") => void;
};

export function HeroSlideLivePreview({
  draft,
  device,
  onDeviceChange,
  locale,
  onLocaleChange,
}: Props) {
  const showSale =
    draft.type === "PRODUCT" &&
    draft.product &&
    draft.product.compareAtPrice != null &&
    draft.product.compareAtPrice > draft.product.price;

  const discountPercent =
    showSale && draft.product?.compareAtPrice
      ? Math.round(
          ((draft.product.compareAtPrice - draft.product.price) /
            draft.product.compareAtPrice) *
            100
        )
      : null;

  const isMobile = device === "mobile";

  return (
    <div className="rounded-xl border border-ink/[0.08] bg-white p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Live preview</p>
          <p className="mt-0.5 text-xs text-ink-muted">
            Ανανεώνεται καθώς γράφεις — αποθηκεύεται μόνο με Αποθήκευση / Προσθήκη.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Segmented
            value={locale}
            onChange={onLocaleChange}
            options={[
              { value: "en", label: "EN" },
              { value: "el", label: "EL" },
            ]}
          />
          <Segmented
            value={device}
            onChange={onDeviceChange}
            options={[
              {
                value: "mobile",
                label: (
                  <span className="inline-flex items-center gap-1">
                    <Smartphone className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Κινητό
                  </span>
                ),
              },
              {
                value: "desktop",
                label: (
                  <span className="inline-flex items-center gap-1">
                    <Monitor className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Desktop
                  </span>
                ),
              },
            ]}
          />
        </div>
      </div>

      <div
        className={cn(
          "mt-4 mx-auto overflow-hidden rounded-lg border border-oak/40 bg-bg-muted",
          isMobile ? "max-w-[22rem]" : "w-full"
        )}
      >
        <div
          className={cn(
            "relative isolate overflow-hidden",
            isMobile ? "aspect-[9/16]" : "aspect-[16/9]"
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={draft.imageSrc || "/images/hero.jpg"}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[70%_45%]"
          />
          <div className="hero-veil pointer-events-none absolute inset-0" aria-hidden />
          <div className="hero-grain pointer-events-none absolute inset-0" aria-hidden />

          <div
            className={cn(
              "relative flex h-full flex-col px-5",
              isMobile
                ? "items-center justify-center pb-10 pt-12 text-center"
                : "items-start justify-center pb-10 pt-12 text-left sm:px-8"
            )}
          >
            <div
              className={cn(
                "w-full",
                isMobile ? "max-w-[17rem]" : "max-w-[20rem]"
              )}
            >
              {draft.eyebrow.trim() ? (
                <div
                  className={cn(
                    "flex items-center gap-2.5",
                    isMobile ? "justify-center" : "justify-start"
                  )}
                >
                  <span className="h-px w-6 bg-oak" aria-hidden />
                  <p className="text-[9px] uppercase tracking-[0.22em] text-ink-muted">
                    {draft.eyebrow}
                  </p>
                </div>
              ) : null}

              <h1
                className={cn(
                  "mt-3 font-serif leading-[1.05] tracking-[-0.025em] text-ink",
                  isMobile ? "text-[1.65rem]" : "text-[2rem]"
                )}
              >
                <span className="block">
                  {draft.headline.trim() || "Ο τίτλος σου"}
                </span>
                {draft.headlineAccent.trim() ? (
                  <span className="mt-0.5 block italic text-coral">
                    {draft.headlineAccent}
                  </span>
                ) : null}
              </h1>

              {draft.subhead.trim() ? (
                <p
                  className={cn(
                    "mt-3 text-[12px] leading-[1.65] text-ink-muted",
                    isMobile ? "mx-auto max-w-[26ch]" : "max-w-[32ch]"
                  )}
                >
                  {draft.subhead}
                </p>
              ) : null}

              {draft.type === "PRODUCT" && draft.product ? (
                <div
                  className={cn(
                    "mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1",
                    isMobile ? "justify-center" : "justify-start"
                  )}
                >
                  <span className="font-serif text-[1.25rem] leading-none text-ink">
                    {formatPrice(draft.product.price)}
                  </span>
                  {showSale && draft.product.compareAtPrice != null ? (
                    <>
                      <span className="text-[12px] text-ink-muted line-through">
                        {formatPrice(draft.product.compareAtPrice)}
                      </span>
                      <span className="bg-coral px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-white">
                        {discountPercent != null
                          ? `−${discountPercent}% · Sale`
                          : "Sale"}
                      </span>
                    </>
                  ) : null}
                </div>
              ) : null}

              <div
                className={cn(
                  "mt-5 flex gap-2",
                  isMobile
                    ? "mx-auto w-full max-w-[14rem] flex-col"
                    : "flex-row flex-wrap items-center"
                )}
              >
                {draft.ctaPrimary.trim() ? (
                  <span className="inline-flex h-9 items-center justify-center gap-1.5 bg-coral px-4 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                    {draft.ctaPrimary}
                    <ArrowRight className="h-3 w-3" strokeWidth={1.75} />
                  </span>
                ) : null}
                {draft.ctaSecondary.trim() ? (
                  <span className="inline-flex h-9 items-center justify-center border border-ink/20 bg-bg/70 px-4 text-[10px] uppercase tracking-[0.14em] text-ink backdrop-blur-[2px]">
                    {draft.ctaSecondary}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: React.ReactNode }[];
}) {
  return (
    <div className="inline-flex rounded-lg border border-oak/40 bg-bg p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
            value === opt.value
              ? "bg-white text-ink shadow-sm"
              : "text-ink-muted hover:text-ink"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
