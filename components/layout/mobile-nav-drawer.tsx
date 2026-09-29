"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, User, X } from "lucide-react";
import { CATALOG_PRODUCT_TYPES } from "@/lib/catalog-taxonomy";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  concernLabel,
  navLabel,
  productTypeLabel,
} from "@/lib/i18n/nav";
import type { NavigationData } from "@/types";

const LIFESTYLE_SLUGS = ["haircare", "makeup", "body"] as const;

type PanelId = "shop-all" | "discover" | "skincare" | "lifestyle" | "brands";

type Props = {
  navigation: NavigationData;
  visible: boolean;
  onClose: () => void;
  isActive: (href: string) => boolean;
};

export function MobileNavDrawer({
  navigation,
  visible,
  onClose,
  isActive,
}: Props) {
  const { dict, locale } = useTranslation();
  const [panel, setPanel] = useState<PanelId | null>(null);

  useEffect(() => {
    if (!visible) setPanel(null);
  }, [visible]);

  const skinTypeName = (skinType: NavigationData["skinTypes"][number]) =>
    locale === "el" ? skinType.nameEl : skinType.name;

  const skincare = navigation.categories.find((c) => c.slug === "skincare");
  const skincareTypes =
    skincare?.productTypes ?? [...CATALOG_PRODUCT_TYPES.skincare];

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

  const panelTitle: Record<PanelId, string> = {
    "shop-all": dict.nav.shopAll,
    discover: dict.nav.discover,
    skincare: dict.nav.skincare,
    lifestyle: dict.nav.hairBodyMakeup,
    brands: dict.nav.brands,
  };

  const rootItems: Array<
    | { id: string; label: string; panel: PanelId }
    | { id: string; label: string; href: string }
  > = [
    { id: "shop-all", label: dict.nav.shopAll, panel: "shop-all" },
    { id: "discover", label: dict.nav.discover, panel: "discover" },
    { id: "new", label: dict.nav.new, href: "/new-in" },
    { id: "skincare", label: dict.nav.skincare, panel: "skincare" },
    {
      id: "lifestyle",
      label: dict.nav.hairBodyMakeup,
      panel: "lifestyle",
    },
    {
      id: "best-sellers",
      label: dict.nav.bestSellers,
      href: "/best-sellers",
    },
    { id: "brands", label: dict.nav.brands, panel: "brands" },
  ];

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] xl:hidden",
        !visible && "pointer-events-none"
      )}
      role="dialog"
      aria-modal
      aria-hidden={!visible}
    >
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-ink/25 transition-opacity duration-300 ease-out",
          visible ? "opacity-100" : "opacity-0"
        )}
        aria-label={dict.nav.closeMenu}
        onClick={onClose}
      />

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 top-0 flex flex-col bg-bg transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          visible ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(90%_80%_at_0%_0%,color-mix(in_srgb,var(--oak-soft)_70%,transparent),transparent_72%)]"
          aria-hidden
        />
        <div className="relative flex h-16 shrink-0 items-center justify-between px-4">
          {panel ? (
            <button
              type="button"
              onClick={() => setPanel(null)}
              className="inline-flex h-10 min-w-0 items-center gap-1.5 text-ink"
              aria-label={dict.nav.back}
            >
              <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span className="truncate font-serif text-[1.35rem] leading-none tracking-tight">
                {panelTitle[panel]}
              </span>
            </button>
          ) : (
            <span aria-hidden className="w-10" />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={dict.nav.closeMenu}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-ink/70 transition-colors hover:text-ink"
          >
            <X className="h-5 w-5" strokeWidth={1.25} />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          {/* Root — same order as desktop */}
          <nav
            className={cn(
              "absolute inset-0 overflow-y-auto transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              panel ? "-translate-x-full" : "translate-x-0"
            )}
            aria-hidden={Boolean(panel)}
          >
            <ul className="px-3">
              {rootItems.map((item, index) => {
                const active = "href" in item && isActive(item.href);
                const row = cn(
                  "flex w-full items-center justify-between gap-3 rounded-sm px-3 py-3.5 text-left transition-colors duration-300",
                  active ? "bg-oak-soft/70 text-ink" : "text-ink hover:bg-oak-soft/40",
                  visible && !panel && "animate-menu-item"
                );
                return (
                  <li
                    key={item.id}
                    style={
                      visible && !panel
                        ? { animationDelay: `${40 + index * 28}ms` }
                        : undefined
                    }
                  >
                    {"panel" in item ? (
                      <button
                        type="button"
                        onClick={() => setPanel(item.panel)}
                        className={row}
                      >
                        <span className="font-serif text-[1.45rem] leading-none tracking-tight">
                          {item.label}
                        </span>
                        <ChevronRight
                          className="h-3.5 w-3.5 shrink-0 text-coral/80"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className={row}
                      >
                        <span className="font-serif text-[1.45rem] leading-none tracking-tight">
                          {item.label}
                        </span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 flex items-center justify-between border-t border-oak/25 px-6 py-5">
              <Link
                href="/login"
                onClick={onClose}
                className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-ink-muted transition-colors hover:text-ink"
              >
                <User className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                {dict.nav.account}
              </Link>
              <Link
                href="/wishlist"
                onClick={onClose}
                className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-ink-muted transition-colors hover:text-ink"
              >
                <Heart className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                {dict.nav.wishlist}
              </Link>
            </div>
          </nav>

          {/* Submenu panel */}
          <nav
            className={cn(
              "absolute inset-0 overflow-y-auto bg-bg transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              panel ? "translate-x-0" : "translate-x-full"
            )}
            aria-hidden={!panel}
          >
            {panel === "shop-all" ? (
              <SubList>
                <SubHeading>{dict.nav.menuStartHere}</SubHeading>
                {shopAllLinks.map((item) => (
                  <SubLink
                    key={item.href}
                    href={item.href}
                    onNavigate={onClose}
                  >
                    {item.label}
                  </SubLink>
                ))}
              </SubList>
            ) : null}

            {panel === "discover" ? (
              <SubList>
                {discoverLinks.map((item) => (
                  <SubLink
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    onNavigate={onClose}
                  >
                    {item.label}
                  </SubLink>
                ))}
              </SubList>
            ) : null}

            {panel === "skincare" ? (
              <SubList>
                <SubHeading>{dict.nav.menuByType}</SubHeading>
                {skincareTypes.map((type) => (
                  <SubLink
                    key={type}
                    href={`/skincare?type=${encodeURIComponent(type)}`}
                    onNavigate={onClose}
                  >
                    {productTypeLabel(dict, type)}
                  </SubLink>
                ))}
                <SubHeading className="mt-4">{dict.nav.menuByConcern}</SubHeading>
                {navigation.concerns.map((concern) => (
                  <SubLink
                    key={concern.slug}
                    href={`/skincare?concern=${concern.slug}`}
                    onNavigate={onClose}
                  >
                    {concernLabel(dict, concern.slug, concern.name)}
                  </SubLink>
                ))}
                {navigation.skinTypes.map((skinType) => (
                  <SubLink
                    key={skinType.slug}
                    href={`/skincare?skinType=${skinType.slug}`}
                    onNavigate={onClose}
                  >
                    {skinTypeName(skinType)}
                  </SubLink>
                ))}
                <SubLink href="/skincare" onNavigate={onClose} emphasize>
                  {dict.nav.menuShopAll}
                </SubLink>
              </SubList>
            ) : null}

            {panel === "lifestyle" ? (
              <SubList>
                {LIFESTYLE_SLUGS.map((slug) => {
                  const panelCat = navigation.categories.find(
                    (c) => c.slug === slug
                  );
                  const types =
                    panelCat?.productTypes ?? [...CATALOG_PRODUCT_TYPES[slug]];
                  return (
                    <div key={slug} className="pb-2">
                      <SubHeading>
                        {navLabel(dict, `/${slug}`, slug)}
                      </SubHeading>
                      <SubLink href={`/${slug}`} onNavigate={onClose}>
                        {dict.nav.menuShopAll}
                      </SubLink>
                      {types.map((type) => (
                        <SubLink
                          key={type}
                          href={`/${slug}?type=${encodeURIComponent(type)}`}
                          onNavigate={onClose}
                        >
                          {productTypeLabel(dict, type)}
                        </SubLink>
                      ))}
                    </div>
                  );
                })}
              </SubList>
            ) : null}

            {panel === "brands" ? (
              <SubList>
                {navigation.featuredBrands.length > 0 ? (
                  <>
                    <SubHeading>{dict.nav.menuFeaturedBrands}</SubHeading>
                    {navigation.featuredBrands.map((b) => (
                      <SubLink
                        key={b.slug}
                        href={`/brands/${b.slug}`}
                        onNavigate={onClose}
                      >
                        {b.name}
                      </SubLink>
                    ))}
                  </>
                ) : null}
                <SubHeading className="mt-2">{dict.nav.menuAllBrands}</SubHeading>
                {navigation.brands.map((b) => (
                  <SubLink
                    key={b.slug}
                    href={`/brands/${b.slug}`}
                    onNavigate={onClose}
                  >
                    {b.name}
                  </SubLink>
                ))}
              </SubList>
            ) : null}
          </nav>
        </div>
      </div>
    </div>
  );
}

function SubList({ children }: { children: React.ReactNode }) {
  return <ul className="px-3 pb-10 pt-2">{children}</ul>;
}

function SubHeading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <li
      className={cn(
        "px-3 pb-1 pt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-sage",
        className
      )}
    >
      {children}
    </li>
  );
}

function SubLink({
  href,
  children,
  onNavigate,
  emphasize,
}: {
  href: string;
  children: React.ReactNode;
  onNavigate: () => void;
  emphasize?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        className={cn(
          "block rounded-sm px-3 py-2.5 text-[15px] leading-snug text-ink/80 transition-colors duration-300 hover:bg-oak-soft/50 hover:text-ink",
          emphasize && "mt-2 font-medium text-coral"
        )}
      >
        {children}
      </Link>
    </li>
  );
}
