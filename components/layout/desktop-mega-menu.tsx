"use client";

import Link from "next/link";
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

export type MegaPanel = "highlights" | "skincare" | "makeup" | "brands" | "care";

type Props = {
  navigation: NavigationData;
  panel: MegaPanel | null;
  onClose: () => void;
};

export function DesktopMegaMenu({ navigation, panel, onClose }: Props) {
  const { dict, locale } = useTranslation();
  const open = panel !== null;
  const goals = goalMenuLinks(navigation.concerns);
  const skinTypes = skinTypeMenuLinks(navigation.skinTypes);

  return (
    <div
      className={cn(
        "absolute inset-x-0 top-full z-40 hidden xl:block",
        !open && "pointer-events-none"
      )}
    >
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
              {panel === "highlights" ? (
                <LinkList links={highlightsLinks} locale={locale} onClose={onClose} open={open} />
              ) : null}

              {panel === "skincare" ? (
                <div className={cn(open && "animate-mega-col")}>
                  <PanelTitle href="/skincare" onClose={onClose}>
                    {menuText(locale, navBar.face)}
                  </PanelTitle>
                  <LinkList
                    links={skincareGroups}
                    locale={locale}
                    onClose={onClose}
                    columns
                  />
                </div>
              ) : null}

              {panel === "makeup" ? (
                <div className={cn(open && "animate-mega-col")}>
                  <PanelTitle href="/makeup" onClose={onClose}>
                    {menuText(locale, navBar.makeup)}
                  </PanelTitle>
                  <LinkList
                    links={makeupGroups}
                    locale={locale}
                    onClose={onClose}
                    columns
                  />
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
                          <MenuAnchor href={`/brands/${b.slug}`} onClose={onClose}>
                            {b.name}
                          </MenuAnchor>
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
                  </div>
                </div>
              ) : null}

              {panel === "care" ? (
                <div
                  className={cn(
                    "grid gap-12 md:grid-cols-3",
                    open && "animate-mega-col"
                  )}
                >
                  <Column
                    title={locale === "el" ? "Στόχοι επιδερμίδας" : "Skin goals"}
                    links={goals}
                    locale={locale}
                    onClose={onClose}
                  />
                  <Column
                    title={locale === "el" ? "Τύπος δέρματος" : "Skin type"}
                    links={skinTypes}
                    locale={locale}
                    onClose={onClose}
                  />
                  <Column
                    title={locale === "el" ? "Ενεργά συστατικά" : "Key ingredients"}
                    links={ingredientLinks}
                    locale={locale}
                    onClose={onClose}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelTitle({
  href,
  onClose,
  children,
}: {
  href: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="mb-8 inline-block font-serif text-[1.75rem] leading-none tracking-tight text-ink transition-opacity hover:opacity-60"
    >
      {children}
    </Link>
  );
}

function LinkList({
  links,
  locale,
  onClose,
  open,
  columns,
}: {
  links: MenuLink[];
  locale: "el" | "en";
  onClose: () => void;
  open?: boolean;
  columns?: boolean;
}) {
  return (
    <ul
      className={cn(
        columns
          ? "grid gap-x-10 gap-y-3 sm:grid-cols-2 lg:grid-cols-3"
          : "grid max-w-xl gap-3",
        open && "animate-mega-col"
      )}
    >
      {links.map((link) => (
        <li key={`${link.href}-${link.en}`}>
          <MenuAnchor href={link.href} onClose={onClose}>
            {menuText(locale, link)}
          </MenuAnchor>
        </li>
      ))}
    </ul>
  );
}

function Column({
  title,
  links,
  locale,
  onClose,
}: {
  title: string;
  links: MenuLink[];
  locale: "el" | "en";
  onClose: () => void;
}) {
  return (
    <div>
      <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">
        {title}
      </p>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={`${link.href}-${link.en}`}>
            <Link
              href={link.href}
              onClick={onClose}
              className="text-[14px] text-ink/80 transition-opacity hover:opacity-55"
            >
              {menuText(locale, link)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MenuAnchor({
  href,
  onClose,
  children,
}: {
  href: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="text-[15px] font-medium text-ink transition-opacity hover:opacity-55"
    >
      {children}
    </Link>
  );
}
