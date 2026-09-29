"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { CATALOG_PRODUCT_TYPES } from "@/lib/catalog-taxonomy";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  concernLabel,
  navLabel,
  productTypeLabel,
} from "@/lib/i18n/nav";
import type { NavigationData } from "@/types";

export type MegaPanel =
  | "shop-all"
  | "discover"
  | "skincare"
  | "lifestyle"
  | "brands";

const LIFESTYLE_SLUGS = ["haircare", "makeup", "body"] as const;

type Props = {
  navigation: NavigationData;
  panel: MegaPanel | null;
  onClose: () => void;
};

function panelFor(navigation: NavigationData, slug: string) {
  return navigation.categories.find((c) => c.slug === slug);
}

export function DesktopMegaMenu({ navigation, panel, onClose }: Props) {
  const { dict, locale } = useTranslation();
  const open = panel !== null;

  const skincare = panelFor(navigation, "skincare");
  const skincareTypes =
    skincare?.productTypes ?? [...CATALOG_PRODUCT_TYPES.skincare];
  const lifestyle = LIFESTYLE_SLUGS.map((slug) => {
    const cat = panelFor(navigation, slug);
    return {
      slug,
      href: `/${slug}`,
      label: navLabel(dict, `/${slug}`, slug),
      productTypes: cat?.productTypes ?? [...CATALOG_PRODUCT_TYPES[slug]],
    };
  });

  const featuredImage = skincare?.image ?? null;
  const skinTypeName = (skinType: NavigationData["skinTypes"][number]) =>
    locale === "el" ? skinType.nameEl : skinType.name;

  const shopAllLinks = [
    { href: "/skincare", label: dict.nav.skincare },
    { href: "/makeup", label: dict.nav.makeup },
    { href: "/haircare", label: dict.nav.haircare },
    { href: "/body", label: dict.nav.body },
  ];

  const discoverLinks = [
    { href: "/best-sellers", label: dict.nav.bestSellers },
    { href: "/skin-type", label: dict.nav.discoverSetsRoutines },
    { href: "/best-sellers", label: dict.nav.discoverBestOf },
    { href: "/new-in", label: dict.nav.discoverViral },
    { href: "/skin-type", label: dict.nav.discoverTenStep },
    {
      href: `/skincare?type=${encodeURIComponent("Sunscreen")}`,
      label: dict.nav.discoverSunscreen,
    },
    { href: "/offers", label: dict.nav.discoverExclusives },
    { href: "/offers", label: dict.nav.discoverSaleOffers },
    { href: "/skincare", label: dict.nav.discoverClean },
    { href: "/skincare", label: dict.nav.discoverVegan },
    { href: "/faq", label: dict.nav.discoverAbout },
  ];

  return (
    <div
      className={cn(
        "absolute inset-x-0 top-full z-40 hidden xl:block",
        !open && "pointer-events-none"
      )}
    >
      {/* Overlay is outside the panel hover zone — hovering it closes */}
      <button
        type="button"
        aria-label={dict.nav.closeMenu}
        onClick={onClose}
        onMouseEnter={onClose}
        className={cn(
          "mega-veil absolute inset-x-0 top-0 h-[100vh] bg-ink/[0.06] backdrop-blur-[3px]",
          !open && "pointer-events-none"
        )}
        data-open={open}
      />

      <div className="mega-shell relative" data-open={open}>
        <div className="mega-shell-inner">
          <div className="mega-panel relative z-10 border-b border-oak/20 bg-bg shadow-[0_40px_80px_-48px_rgba(28,27,26,0.45)]">
            <div className="container-page relative py-10 xl:py-12">
              {panel === "shop-all" ? (
                <div
                  className={cn(
                    "grid gap-12 md:grid-cols-2 xl:grid-cols-[1fr_1fr_16rem]",
                    open && "animate-mega-col"
                  )}
                >
                  <div>
                    <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">
                      {dict.nav.menuStartHere}
                    </p>
                    <ul className="space-y-3">
                      {shopAllLinks.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className="text-[14px] font-medium text-ink transition-opacity hover:opacity-55"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">
                      {dict.nav.menuFeaturedBrands}
                    </p>
                    <ul className="space-y-3">
                      {navigation.featuredBrands.slice(0, 8).map((b) => (
                        <li key={b.slug}>
                          <Link
                            href={`/brands/${b.slug}`}
                            onClick={onClose}
                            className="text-[14px] font-medium text-ink transition-opacity hover:opacity-55"
                          >
                            {b.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="hidden xl:block">
                    <Link
                      href="/skincare"
                      onClick={onClose}
                      className="group relative block aspect-[4/5] overflow-hidden bg-bg-muted"
                    >
                      {featuredImage ? (
                        <Image
                          src={featuredImage}
                          alt=""
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                          sizes="256px"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
                      <span className="absolute inset-x-0 bottom-0 p-5 text-[13px] font-semibold uppercase tracking-[0.14em] text-bg">
                        {dict.nav.skincare}
                      </span>
                    </Link>
                  </div>
                </div>
              ) : null}

              {panel === "discover" ? (
                <div
                  className={cn(
                    "grid gap-x-12 gap-y-3 sm:grid-cols-2 lg:grid-cols-3",
                    open && "animate-mega-col"
                  )}
                >
                  {discoverLinks.map((item) => (
                    <Link
                      key={`${item.href}-${item.label}`}
                      href={item.href}
                      onClick={onClose}
                      className="text-[14px] font-medium text-ink transition-opacity hover:opacity-55"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}

              {panel === "skincare" ? (
                <div
                  className={cn(
                    "grid gap-12 xl:grid-cols-[minmax(0,1.35fr)_14rem_16rem] xl:gap-16",
                    open && "animate-mega-col"
                  )}
                >
                  <div>
                    <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">
                      {dict.nav.menuByType}
                    </p>
                    <ul className="grid grid-cols-2 gap-x-10 gap-y-2.5 md:grid-cols-3">
                      {skincareTypes.map((type) => (
                        <li key={type}>
                          <Link
                            href={`/skincare?type=${encodeURIComponent(type)}`}
                            onClick={onClose}
                            className="text-[14px] text-ink/80 transition-opacity hover:opacity-55"
                          >
                            {productTypeLabel(dict, type)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/skincare"
                      onClick={onClose}
                      className="mt-8 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink transition-opacity hover:opacity-55"
                    >
                      {dict.nav.menuShopAll}
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </Link>
                  </div>

                  <div>
                    <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">
                      {dict.nav.menuByConcern}
                    </p>
                    <ul className="space-y-2.5">
                      {navigation.concerns.map((concern) => (
                        <li key={concern.slug}>
                          <Link
                            href={`/skincare?concern=${concern.slug}`}
                            onClick={onClose}
                            className="text-[14px] text-ink/80 transition-opacity hover:opacity-55"
                          >
                            {concernLabel(dict, concern.slug, concern.name)}
                          </Link>
                        </li>
                      ))}
                      {navigation.skinTypes.map((skinType) => (
                        <li key={skinType.slug}>
                          <Link
                            href={`/skincare?skinType=${skinType.slug}`}
                            onClick={onClose}
                            className="text-[14px] text-ink/80 transition-opacity hover:opacity-55"
                          >
                            {skinTypeName(skinType)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={cn(open && "animate-mega-media")}>
                    <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">
                      {dict.nav.menuFeaturedSkincare}
                    </p>
                    <Link
                      href="/skincare"
                      onClick={onClose}
                      className="group relative mb-6 block aspect-[4/5] overflow-hidden bg-bg-muted"
                    >
                      {featuredImage ? (
                        <Image
                          src={featuredImage}
                          alt=""
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                          sizes="256px"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent" />
                      <span className="absolute inset-x-0 bottom-0 p-5 text-[13px] font-semibold text-bg">
                        {dict.nav.skincare}
                      </span>
                    </Link>
                    <ul className="space-y-2.5">
                      {(skincare?.brands ?? navigation.featuredBrands)
                        .slice(0, 5)
                        .map((b) => (
                          <li key={b.slug}>
                            <Link
                              href={`/skincare?brand=${b.slug}`}
                              onClick={onClose}
                              className="text-[14px] text-ink/80 transition-opacity hover:opacity-55"
                            >
                              {b.name}
                            </Link>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              ) : null}

              {panel === "lifestyle" ? (
                <div
                  className={cn(
                    "grid gap-12 md:grid-cols-3 md:gap-14",
                    open && "animate-mega-col"
                  )}
                >
                  {lifestyle.map((cat) => (
                    <div key={cat.slug}>
                      <Link
                        href={cat.href}
                        onClick={onClose}
                        className="text-[15px] font-semibold text-ink transition-opacity hover:opacity-55"
                      >
                        {cat.label}
                      </Link>
                      <ul className="mt-6 space-y-2.5">
                        {cat.productTypes.map((type) => (
                          <li key={type}>
                            <Link
                              href={`/${cat.slug}?type=${encodeURIComponent(type)}`}
                              onClick={onClose}
                              className="text-[14px] text-ink/80 transition-opacity hover:opacity-55"
                            >
                              {productTypeLabel(dict, type)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={cat.href}
                        onClick={onClose}
                        className="mt-6 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink transition-opacity hover:opacity-55"
                      >
                        {dict.nav.menuShopAll}
                        <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : null}

              {panel === "brands" ? (
                <div
                  className={cn(
                    "grid gap-12 md:grid-cols-2",
                    open && "animate-mega-col"
                  )}
                >
                  <div>
                    <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">
                      {dict.nav.menuFeaturedBrands}
                    </p>
                    <ul className="grid grid-cols-2 gap-x-8 gap-y-3">
                      {navigation.featuredBrands.map((b) => (
                        <li key={b.slug}>
                          <Link
                            href={`/brands/${b.slug}`}
                            onClick={onClose}
                            className="text-[15px] font-semibold text-ink transition-opacity hover:opacity-55"
                          >
                            {b.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">
                      {dict.nav.menuAllBrands}
                    </p>
                    <ul className="columns-2 gap-x-10 space-y-2.5">
                      {navigation.brands.map((b) => (
                        <li key={b.slug} className="break-inside-avoid">
                          <Link
                            href={`/brands/${b.slug}`}
                            onClick={onClose}
                            className="text-[14px] text-ink/80 transition-opacity hover:opacity-55"
                          >
                            {b.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/brands"
                      onClick={onClose}
                      className="mt-8 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink"
                    >
                      {dict.nav.menuShopAll}
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
