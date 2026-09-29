"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  goalMenuLinks,
  highlightsLinks,
  ingredientLinks,
  makeupGroups,
  menuText,
  navBar,
  skinTypeMenuLinks,
  skincareGroups,
  type MenuLink,
} from "@/lib/storefront-menu";
import type { NavigationData } from "@/types";
import type { Locale } from "@/lib/i18n/types";

type PanelId = "highlights" | "skincare" | "makeup" | "brands" | "care";

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

  const goals = goalMenuLinks(navigation.concerns);
  const skinTypes = skinTypeMenuLinks(navigation.skinTypes);
  const panelTitle: Record<PanelId, string> = {
    highlights: menuText(locale, navBar.highlights),
    skincare: menuText(locale, navBar.face),
    makeup: menuText(locale, navBar.makeup),
    brands: menuText(locale, navBar.brands),
    care: menuText(locale, navBar.care),
  };

  const rootItems: Array<
    | { id: string; label: string; panel: PanelId }
    | { id: string; label: string; href: string }
  > = [
    { id: "home", label: menuText(locale, navBar.home), href: navBar.home.href },
    {
      id: "highlights",
      label: menuText(locale, navBar.highlights),
      panel: "highlights",
    },
    { id: "sets", label: menuText(locale, navBar.sets), href: navBar.sets.href },
    { id: "skincare", label: menuText(locale, navBar.face), panel: "skincare" },
    { id: "makeup", label: menuText(locale, navBar.makeup), panel: "makeup" },
    { id: "brands", label: menuText(locale, navBar.brands), panel: "brands" },
    { id: "quiz", label: menuText(locale, navBar.quiz), href: navBar.quiz.href },
    { id: "care", label: menuText(locale, navBar.care), panel: "care" },
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

          <nav
            className={cn(
              "absolute inset-0 overflow-y-auto bg-bg transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              panel ? "translate-x-0" : "translate-x-full"
            )}
            aria-hidden={!panel}
          >
            {panel === "highlights" ? (
              <LinkGroup links={highlightsLinks} locale={locale} onClose={onClose} />
            ) : null}
            {panel === "skincare" ? (
              <LinkGroup links={skincareGroups} locale={locale} onClose={onClose} />
            ) : null}
            {panel === "makeup" ? (
              <LinkGroup links={makeupGroups} locale={locale} onClose={onClose} />
            ) : null}
            {panel === "brands" ? (
              <ul className="px-3 pb-10 pt-2">
                <GroupLabel>{dict.nav.menuFeaturedBrands}</GroupLabel>
                {navigation.featuredBrands.map((b) => (
                  <SubLink key={b.slug} href={`/brands/${b.slug}`} onClose={onClose}>
                    {b.name}
                  </SubLink>
                ))}
                <GroupLabel className="mt-2">{dict.nav.menuAllBrands}</GroupLabel>
                {navigation.brands.map((b) => (
                  <SubLink key={`all-${b.slug}`} href={`/brands/${b.slug}`} onClose={onClose}>
                    {b.name}
                  </SubLink>
                ))}
              </ul>
            ) : null}
            {panel === "care" ? (
              <ul className="px-3 pb-10 pt-2">
                <GroupLabel>{locale === "el" ? "Στόχοι επιδερμίδας" : "Skin goals"}</GroupLabel>
                {goals.map((link) => (
                  <MenuSubLink key={link.en} link={link} locale={locale} onClose={onClose} />
                ))}
                <GroupLabel>{locale === "el" ? "Τύπος δέρματος" : "Skin type"}</GroupLabel>
                {skinTypes.map((link) => (
                  <MenuSubLink key={link.en} link={link} locale={locale} onClose={onClose} />
                ))}
                <GroupLabel>{locale === "el" ? "Ενεργά συστατικά" : "Key ingredients"}</GroupLabel>
                {ingredientLinks.map((link) => (
                  <MenuSubLink key={link.en} link={link} locale={locale} onClose={onClose} />
                ))}
              </ul>
            ) : null}
          </nav>
        </div>
      </div>
    </div>
  );
}

function LinkGroup({
  links,
  locale,
  onClose,
}: {
  links: MenuLink[];
  locale: Locale;
  onClose: () => void;
}) {
  return (
    <ul className="px-3 pb-10 pt-2">
      {links.map((link) => (
        <MenuSubLink key={`${link.href}-${link.en}`} link={link} locale={locale} onClose={onClose} />
      ))}
    </ul>
  );
}

function MenuSubLink({
  link,
  locale,
  onClose,
}: {
  link: MenuLink;
  locale: Locale;
  onClose: () => void;
}) {
  return (
    <SubLink href={link.href} onClose={onClose}>
      {menuText(locale, link)}
    </SubLink>
  );
}

function GroupLabel({
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
  onClose,
}: {
  href: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClose}
        className="block rounded-sm px-3 py-2.5 text-[15px] leading-snug text-ink/80 transition-colors duration-300 hover:bg-oak-soft/50 hover:text-ink"
      >
        {children}
      </Link>
    </li>
  );
}
