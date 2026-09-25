"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  User,
  X,
} from "lucide-react";
import { brand } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";
import { navLabel, productTypeLabel } from "@/lib/i18n/nav";
import type { NavigationData } from "@/types";

const PROMO_HREFS = new Set(["/new-in", "/offers"]);
const CATEGORY_HREFS = new Set([
  "/makeup",
  "/skincare",
  "/haircare",
  "/body",
]);

type Panel =
  | { kind: "category"; href: string; slug: string; label: string }
  | { kind: "brands"; label: string };

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
  const [panel, setPanel] = useState<Panel | null>(null);

  const categoryNav = brand.nav.filter((item) => !PROMO_HREFS.has(item.href));
  const promoNav = brand.nav.filter((item) => PROMO_HREFS.has(item.href));

  useEffect(() => {
    if (!visible) setPanel(null);
  }, [visible]);

  const skinTypeName = (skinType: NavigationData["skinTypes"][number]) =>
    locale === "el" ? skinType.nameEl : skinType.name;

  const categoryPanel =
    panel?.kind === "category"
      ? navigation.categories.find((c) => c.slug === panel.slug)
      : undefined;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal>
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-ink/30 backdrop-blur-[2px] transition-opacity duration-300 ease-out",
          visible ? "opacity-100" : "opacity-0"
        )}
        aria-label={dict.nav.closeMenu}
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute inset-y-0 left-0 flex w-[min(100%,22rem)] flex-col overflow-hidden bg-bg shadow-[20px_0_50px_rgba(28,27,26,0.14)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform sm:w-[26rem]",
          visible ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(90%_80%_at_0%_0%,color-mix(in_srgb,var(--oak-soft)_55%,transparent),transparent_70%)]"
          aria-hidden
        />

        <div className="relative flex shrink-0 items-center justify-between px-3 pt-4">
          {panel ? (
            <button
              type="button"
              onClick={() => setPanel(null)}
              className="inline-flex h-11 items-center gap-1 px-2 text-ink-muted transition-colors hover:text-ink"
              aria-label={dict.nav.back}
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
              <span className="text-[12px] uppercase tracking-[0.12em]">
                {dict.nav.back}
              </span>
            </button>
          ) : (
            <span className="w-11" aria-hidden />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={dict.nav.closeMenu}
            className="inline-flex h-11 w-11 items-center justify-center text-ink-muted transition-colors hover:text-ink"
          >
            <X className="h-5 w-5" strokeWidth={1.25} />
          </button>
        </div>

        <div className="relative min-h-0 flex-1">
          {/* Root menu */}
          <nav
            className={cn(
              "absolute inset-0 flex flex-col overflow-y-auto px-5 pb-8 pt-2 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              panel ? "-translate-x-[18%] opacity-0 pointer-events-none" : "translate-x-0 opacity-100"
            )}
            aria-hidden={Boolean(panel)}
          >
            <ul className="flex flex-col">
              {categoryNav.map((item, index) => {
                const active = isActive(item.href);
                const slug = item.href.slice(1);
                const hasPanel =
                  (CATEGORY_HREFS.has(item.href) &&
                    navigation.categories.some((c) => c.slug === slug)) ||
                  item.href === "/brands";
                const label = navLabel(dict, item.href, item.label);

                return (
                  <li
                    key={item.href}
                    className={cn(
                      "border-b border-oak/20",
                      visible && !panel && "animate-menu-item"
                    )}
                    style={
                      visible && !panel
                        ? { animationDelay: `${60 + index * 35}ms` }
                        : undefined
                    }
                  >
                    {hasPanel ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (item.href === "/brands") {
                            setPanel({ kind: "brands", label });
                          } else {
                            setPanel({
                              kind: "category",
                              href: item.href,
                              slug,
                              label,
                            });
                          }
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 py-3.5 text-left transition-colors",
                          active ? "text-ink" : "text-ink/80 hover:text-ink"
                        )}
                      >
                        <span className="font-serif text-[1.85rem] leading-[1.05] tracking-tight sm:text-[2rem]">
                          {label}
                        </span>
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-sage"
                          strokeWidth={1.5}
                          aria-hidden
                        />
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "block py-3.5 font-serif text-[1.85rem] leading-[1.05] tracking-tight transition-colors sm:text-[2rem]",
                          active ? "text-ink" : "text-ink/80 hover:text-ink"
                        )}
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 space-y-3.5 border-t border-oak/25 pt-7">
              {promoNav.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block font-serif text-[1.35rem] leading-none tracking-tight text-sage-dark transition-colors hover:text-ink",
                      active && "text-ink"
                    )}
                  >
                    {navLabel(dict, item.href, item.label)}
                  </Link>
                );
              })}
            </div>

            <div className="mt-auto grid grid-cols-2 gap-4 border-t border-oak/25 pt-5">
              <Link
                href="/login"
                onClick={onClose}
                className="flex items-center gap-2.5 text-[13px] text-ink-muted transition-colors hover:text-ink"
              >
                <User className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
                {dict.nav.account}
              </Link>
              <Link
                href="/wishlist"
                onClick={onClose}
                className="flex items-center justify-end gap-2.5 text-[13px] text-ink-muted transition-colors hover:text-ink"
              >
                <Heart className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
                {dict.nav.wishlist}
              </Link>
            </div>
          </nav>

          {/* Subcategory panel */}
          <nav
            className={cn(
              "absolute inset-0 flex flex-col overflow-y-auto px-5 pb-8 pt-1 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              panel ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
            )}
            aria-hidden={!panel}
          >
            {panel ? (
              <>
                <Link
                  href={panel.kind === "brands" ? "/brands" : panel.href}
                  onClick={onClose}
                  className="group mb-6 flex items-baseline justify-between gap-3 border-b border-oak/25 pb-4"
                >
                  <h2 className="font-serif text-[2rem] leading-[1.05] tracking-tight text-ink sm:text-[2.15rem]">
                    {panel.label}
                  </h2>
                  <ArrowRight
                    className="mb-1 h-4 w-4 shrink-0 text-coral transition-transform duration-300 ease-out group-hover:translate-x-0.5"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </Link>

                {panel.kind === "category" && categoryPanel ? (
                  <div className="space-y-7">
                    {categoryPanel.productTypes.length > 0 ? (
                      <PanelSection title={dict.nav.menuByType}>
                        {categoryPanel.productTypes.map((type) => (
                          <PanelLink
                            key={type}
                            href={`/${panel.slug}?type=${encodeURIComponent(type)}`}
                            onNavigate={onClose}
                          >
                            {productTypeLabel(dict, type)}
                          </PanelLink>
                        ))}
                      </PanelSection>
                    ) : null}

                    {categoryPanel.brands.length > 0 ? (
                      <PanelSection title={dict.nav.menuByBrand}>
                        {categoryPanel.brands.map((b) => (
                          <PanelLink
                            key={b.slug}
                            href={`/${panel.slug}?brand=${b.slug}`}
                            onNavigate={onClose}
                          >
                            {b.name}
                          </PanelLink>
                        ))}
                      </PanelSection>
                    ) : null}

                    {panel.slug === "skincare" || panel.slug === "makeup" ? (
                      <PanelSection title={dict.nav.menuBySkin}>
                        {navigation.skinTypes.map((skinType) => (
                          <PanelLink
                            key={skinType.slug}
                            href={`/${panel.slug}?skinType=${skinType.slug}`}
                            onNavigate={onClose}
                          >
                            {skinTypeName(skinType)}
                          </PanelLink>
                        ))}
                      </PanelSection>
                    ) : null}
                  </div>
                ) : null}

                {panel.kind === "brands" ? (
                  <div className="space-y-7">
                    {navigation.featuredBrands.length > 0 ? (
                      <PanelSection title={dict.nav.menuFeaturedBrands}>
                        {navigation.featuredBrands.map((b) => (
                          <PanelLink
                            key={b.slug}
                            href={`/brands/${b.slug}`}
                            onNavigate={onClose}
                          >
                            {b.name}
                          </PanelLink>
                        ))}
                      </PanelSection>
                    ) : null}
                    <PanelSection title={dict.nav.menuAllBrands}>
                      {navigation.brands.map((b) => (
                        <PanelLink
                          key={b.slug}
                          href={`/brands/${b.slug}`}
                          onNavigate={onClose}
                        >
                          {b.name}
                        </PanelLink>
                      ))}
                    </PanelSection>
                  </div>
                ) : null}
              </>
            ) : null}
          </nav>
        </div>
      </div>
    </div>
  );
}

function PanelSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-sage">
        {title}
      </p>
      <ul className="flex flex-col gap-0.5">{children}</ul>
    </div>
  );
}

function PanelLink({
  href,
  children,
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  onNavigate: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        className="block py-2.5 text-[15px] leading-snug text-ink/80 transition-colors hover:text-ink"
      >
        {children}
      </Link>
    </li>
  );
}
