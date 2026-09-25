"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { brand } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";
import { navLabel, productTypeLabel } from "@/lib/i18n/nav";
import type { NavigationData } from "@/types";

const PROMO_HREFS = new Set(["/new-in", "/offers"]);
const CATEGORY_ORDER = ["makeup", "skincare", "haircare", "body"] as const;

type Props = {
  navigation: NavigationData;
  open: boolean;
  onClose: () => void;
  onMouseEnter: () => void;
};

export function DesktopMegaMenu({
  navigation,
  open,
  onClose,
  onMouseEnter,
}: Props) {
  const { dict, locale } = useTranslation();
  const promoNav = brand.nav.filter((item) => PROMO_HREFS.has(item.href));

  const categories = CATEGORY_ORDER.map((slug) => {
    const panel = navigation.categories.find((c) => c.slug === slug);
    const navItem = brand.nav.find((n) => n.href === `/${slug}`);
    return {
      slug,
      href: `/${slug}`,
      label: navLabel(dict, `/${slug}`, navItem?.label ?? slug),
      productTypes: panel?.productTypes ?? [],
      brands: panel?.brands ?? [],
      image: panel?.image ?? null,
    };
  });

  const featuredImage =
    categories.find((c) => c.slug === "skincare")?.image ??
    categories.find((c) => c.image)?.image;

  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-full z-40 hidden lg:block",
          open && "pointer-events-auto"
        )}
        onMouseEnter={onMouseEnter}
      >
        {/* Soft veil over the page */}
        <button
          type="button"
          aria-label={dict.nav.closeMenu}
          onClick={onClose}
          className={cn(
            "absolute inset-x-0 top-0 h-[100vh] bg-ink/[0.08] transition-opacity duration-[400ms] ease-out",
            open ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        />

        <div
          className={cn(
            "relative origin-top border-b border-oak/30 bg-bg/98 shadow-[0_28px_60px_-36px_rgba(28,27,26,0.35)] backdrop-blur-md transition-[opacity,transform] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            open
              ? "translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2.5 opacity-0"
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_80%_at_0%_0%,color-mix(in_srgb,var(--oak-soft)_45%,transparent),transparent_55%)]"
            aria-hidden
          />

          <div className="container-page relative grid gap-10 py-10 xl:grid-cols-[minmax(0,1fr)_16rem] xl:gap-14 xl:py-12">
            <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4 md:gap-x-10">
              {categories.map((cat, index) => (
                <div
                  key={cat.slug}
                  className={cn(open && "animate-soft-enter")}
                  style={
                    open
                      ? { animationDelay: `${80 + index * 55}ms` }
                      : undefined
                  }
                >
                  <Link
                    href={cat.href}
                    onClick={onClose}
                    className="group inline-flex items-baseline gap-2"
                  >
                    <span className="font-serif text-[1.55rem] leading-none tracking-tight text-ink transition-opacity group-hover:opacity-70 xl:text-[1.7rem]">
                      {cat.label}
                    </span>
                    <ArrowRight
                      className="h-3.5 w-3.5 text-coral opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </Link>

                  {cat.productTypes.length > 0 ? (
                    <ul className="mt-5 space-y-2.5">
                      {cat.productTypes.slice(0, 6).map((type) => (
                        <li key={type}>
                          <Link
                            href={`/${cat.slug}?type=${encodeURIComponent(type)}`}
                            onClick={onClose}
                            className="text-[13px] leading-snug text-ink-muted transition-colors hover:text-ink"
                          >
                            {productTypeLabel(dict, type)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-5 text-[13px] text-ink-muted/70">
                      {dict.nav.menuShopAll}
                    </p>
                  )}

                  {cat.brands.length > 0 ? (
                    <div className="mt-6 border-t border-oak/25 pt-5">
                      <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-sage">
                        {dict.nav.menuByBrand}
                      </p>
                      <ul className="space-y-2">
                        {cat.brands.slice(0, 4).map((b) => (
                          <li key={b.slug}>
                            <Link
                              href={`/${cat.slug}?brand=${b.slug}`}
                              onClick={onClose}
                              className="text-[13px] text-ink-muted transition-colors hover:text-ink"
                            >
                              {b.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <aside
              className={cn(
                "hidden flex-col xl:flex",
                open && "animate-soft-enter"
              )}
              style={open ? { animationDelay: "260ms" } : undefined}
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-bg-muted">
                {featuredImage ? (
                  <Image
                    src={featuredImage}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="256px"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-ink/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="font-serif text-xl leading-none text-bg">
                    {dict.nav.skincare}
                  </p>
                  <Link
                    href="/skincare"
                    onClick={onClose}
                    className="mt-3 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-bg/90 transition-opacity hover:opacity-80"
                  >
                    {dict.nav.menuShopAll}
                    <ArrowRight className="h-3 w-3" strokeWidth={1.75} />
                  </Link>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-sage">
                  {dict.nav.menuFeaturedBrands}
                </p>
                <ul className="space-y-2">
                  {navigation.featuredBrands.slice(0, 5).map((b) => (
                    <li key={b.slug}>
                      <Link
                        href={`/brands/${b.slug}`}
                        onClick={onClose}
                        className="text-[13px] text-ink-muted transition-colors hover:text-ink"
                      >
                        {b.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/brands"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 pt-1 text-[11px] uppercase tracking-[0.14em] text-ink transition-opacity hover:opacity-65"
                >
                  {dict.nav.brands}
                  <ArrowRight className="h-3 w-3 text-coral" strokeWidth={1.75} />
                </Link>
              </div>
            </aside>
          </div>

          <div className="relative border-t border-oak/25 bg-bg-muted/40">
            <div className="container-page flex flex-wrap items-center gap-x-8 gap-y-3 py-4">
              {promoNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="text-[12px] uppercase tracking-[0.16em] text-sage-dark transition-colors hover:text-ink"
                >
                  {navLabel(dict, item.href, item.label)}
                </Link>
              ))}
              <Link
                href="/skin-type"
                onClick={onClose}
                className="text-[12px] uppercase tracking-[0.16em] text-ink-muted transition-colors hover:text-ink"
              >
                {locale === "el"
                  ? dict.nav.findForMySkinShort
                  : dict.nav.findForMySkin}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
