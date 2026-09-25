"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { brand } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";
import { navLabel, productTypeLabel } from "@/lib/i18n/nav";
import type { NavigationData } from "@/types";

const PROMO_HREFS = new Set(["/best-sellers", "/new-in", "/offers"]);
const CATEGORY_ORDER = ["makeup", "skincare", "haircare", "body"] as const;

type Props = {
  navigation: NavigationData;
  open: boolean;
  onClose: () => void;
};

export function DesktopMegaMenu({ navigation, open, onClose }: Props) {
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

  const quickLinks = [
    ...promoNav.map((item) => ({
      href: item.href,
      label: navLabel(dict, item.href, item.label),
      accent: false as const,
    })),
    {
      href: "/skin-type",
      label:
        locale === "el" ? dict.home.heroQuizCta : dict.nav.findForMySkin,
      accent: true as const,
    },
  ];

  return (
    <div
      className={cn(
        "absolute inset-x-0 top-full z-40 hidden lg:block",
        !open && "pointer-events-none"
      )}
    >
      <button
        type="button"
        aria-label={dict.nav.closeMenu}
        onClick={onClose}
        className={cn(
          "mega-veil absolute inset-x-0 top-0 h-[100vh] bg-ink/[0.06] backdrop-blur-[3px]",
          !open && "pointer-events-none"
        )}
        data-open={open}
      />

      <div className="mega-shell relative" data-open={open}>
        <div className="mega-shell-inner">
          <div className="mega-panel border-b border-oak/20 bg-[color-mix(in_srgb,var(--bg)_94%,white)] shadow-[0_40px_80px_-48px_rgba(28,27,26,0.45)] backdrop-blur-xl">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_100%_at_8%_-10%,color-mix(in_srgb,var(--oak-soft)_55%,transparent),transparent_58%),radial-gradient(45%_80%_at_100%_0%,color-mix(in_srgb,var(--sage)_10%,transparent),transparent_50%)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-coral/40 to-transparent"
              aria-hidden
            />

            <div className="container-page relative grid gap-14 py-14 xl:grid-cols-[minmax(0,1fr)_18rem] xl:gap-20 xl:py-16">
              <div className="grid grid-cols-2 gap-x-12 gap-y-14 md:grid-cols-4 md:gap-x-14">
                {categories.map((cat, index) => (
                  <div
                    key={cat.slug}
                    className={cn(open && "animate-mega-col")}
                    style={
                      open
                        ? { animationDelay: `${100 + index * 75}ms` }
                        : undefined
                    }
                  >
                    <Link
                      href={cat.href}
                      onClick={onClose}
                      className="group relative inline-block"
                    >
                      <span className="font-serif text-[1.7rem] leading-[1.05] tracking-tight text-ink transition-opacity duration-300 group-hover:opacity-65 xl:text-[1.85rem]">
                        {cat.label}
                      </span>
                      <span
                        className="mt-3 block h-px w-8 bg-sage/60 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-14 group-hover:bg-coral"
                        aria-hidden
                      />
                    </Link>

                    {cat.productTypes.length > 0 ? (
                      <ul className="mt-7 space-y-3.5">
                        {cat.productTypes.slice(0, 5).map((type) => (
                          <li key={type}>
                            <Link
                              href={`/${cat.slug}?type=${encodeURIComponent(type)}`}
                              onClick={onClose}
                              className="text-[13.5px] leading-snug text-ink-muted transition-colors duration-200 hover:text-ink"
                            >
                              {productTypeLabel(dict, type)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {cat.brands.length > 0 ? (
                      <div className="mt-8 border-t border-oak/20 pt-6">
                        <p className="mb-3.5 text-[10px] uppercase tracking-[0.22em] text-sage">
                          {dict.nav.menuByBrand}
                        </p>
                        <ul className="space-y-3">
                          {cat.brands.slice(0, 3).map((b) => (
                            <li key={b.slug}>
                              <Link
                                href={`/${cat.slug}?brand=${b.slug}`}
                                onClick={onClose}
                                className="text-[13px] text-ink-muted transition-colors duration-200 hover:text-ink"
                              >
                                {b.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <Link
                      href={cat.href}
                      onClick={onClose}
                      className="group/link mt-8 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-ink/55 transition-colors hover:text-ink"
                    >
                      <span className="underline decoration-oak/40 underline-offset-[5px] transition-colors group-hover/link:decoration-ink/30">
                        {dict.nav.menuShopAll}
                      </span>
                      <ArrowRight
                        className="h-3 w-3 text-coral transition-transform duration-300 ease-out group-hover/link:translate-x-1"
                        strokeWidth={1.75}
                      />
                    </Link>
                  </div>
                ))}
              </div>

              <aside
                className={cn(
                  "hidden xl:block",
                  open && "animate-mega-media"
                )}
              >
                <Link
                  href="/skincare"
                  onClick={onClose}
                  className="group relative block aspect-[3/4] overflow-hidden bg-bg-muted"
                >
                  {featuredImage ? (
                    <Image
                      src={featuredImage}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
                      sizes="288px"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="absolute inset-x-0 bottom-0 p-7">
                    <p className="font-serif text-[1.65rem] leading-none text-bg">
                      {dict.nav.skincare}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-bg/85">
                      {dict.nav.menuShopAll}
                      <ArrowRight
                        className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1"
                        strokeWidth={1.75}
                      />
                    </span>
                  </div>
                </Link>

                {navigation.featuredBrands.length > 0 ? (
                  <div className="mt-8">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-sage">
                      {dict.nav.menuFeaturedBrands}
                    </p>
                    <ul className="mt-4 space-y-3">
                      {navigation.featuredBrands.slice(0, 4).map((b) => (
                        <li key={b.slug}>
                          <Link
                            href={`/brands/${b.slug}`}
                            onClick={onClose}
                            className="text-[13.5px] text-ink-muted transition-colors hover:text-ink"
                          >
                            {b.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/brands"
                      onClick={onClose}
                      className="group mt-5 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-ink/60 transition-colors hover:text-ink"
                    >
                      {dict.nav.brands}
                      <ArrowRight
                        className="h-3 w-3 text-coral transition-transform duration-300 group-hover:translate-x-1"
                        strokeWidth={1.75}
                      />
                    </Link>
                  </div>
                ) : null}
              </aside>
            </div>

            <div
              className={cn(
                "relative border-t border-oak/15",
                open && "animate-mega-footer"
              )}
            >
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg-muted/50 to-transparent"
                aria-hidden
              />
              <div className="container-page relative grid grid-cols-2 md:grid-cols-4">
                {quickLinks.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group relative flex items-center justify-between gap-4 px-2 py-7 transition-colors duration-300 sm:px-5 md:py-8",
                      index > 0 && "md:pl-8",
                      index % 2 === 1 && "border-l border-oak/20",
                      index >= 2 && "border-t border-oak/20 md:border-t-0",
                      index > 0 &&
                        "md:border-l md:border-oak/20 md:border-t-0"
                    )}
                  >
                    <span
                      className={cn(
                        "font-serif text-[1.2rem] leading-tight tracking-tight transition-opacity duration-300 sm:text-[1.3rem]",
                        item.accent
                          ? "text-coral"
                          : "text-ink group-hover:opacity-60"
                      )}
                    >
                      {item.label}
                    </span>
                    <ArrowRight
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-all duration-300 ease-out",
                        item.accent
                          ? "text-coral group-hover:translate-x-1"
                          : "text-ink/30 group-hover:translate-x-1 group-hover:text-ink/70"
                      )}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
