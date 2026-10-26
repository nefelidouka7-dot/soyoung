"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { SiteLogo } from "@/components/layout/site-logo";
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

const EASE = "ease-[cubic-bezier(0.16,1,0.3,1)]";

const panelHref: Partial<Record<PanelId, string>> = {
  highlights: "/best-sellers",
  skincare: "/skincare",
  makeup: "/makeup",
  brands: "/brands",
};

type Props = {
  navigation: NavigationData;
  visible: boolean;
  onClose: () => void;
  isActive: (href: string) => boolean;
};

/**
 * Site-wide menu drawer.
 * - Mobile: full-screen sheet; categories slide over the root list.
 * - Tablet (md): full-screen overlay that fades in; categories cross-fade over the root list.
 * - Desktop (lg+): full-screen overlay — categories on the left, their links on the right.
 */
export function NavDrawer({ navigation, visible, onClose, isActive }: Props) {
  const { dict, locale } = useTranslation();
  const [panel, setPanel] = useState<PanelId | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // The drawer unmounts after closing, so `panel` resets on its own.
    if (visible) closeRef.current?.focus({ preventScroll: true });
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
      className={cn("fixed inset-0 z-[60]", !visible && "pointer-events-none")}
      role="dialog"
      aria-modal
      aria-hidden={!visible}
      aria-label={dict.nav.shopAll}
    >
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-ink/30 backdrop-blur-[3px] transition-opacity duration-500",
          EASE,
          visible ? "opacity-100" : "opacity-0"
        )}
        aria-label={dict.nav.closeMenu}
        onClick={onClose}
      />

      <div
        className={cn(
          "absolute inset-0 flex flex-col overflow-hidden bg-bg transition-[translate,opacity,scale] duration-500 md:translate-x-0 md:duration-700",
          EASE,
          visible
            ? "translate-x-0 md:scale-100 md:opacity-100"
            : "-translate-x-full md:scale-[1.02] md:opacity-0"
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(90%_80%_at_0%_0%,color-mix(in_srgb,var(--oak-soft)_80%,transparent),transparent_72%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-48 -right-48 hidden h-[560px] w-[560px] rounded-full bg-coral/10 blur-3xl md:block"
          aria-hidden
        />

        <div className="relative shrink-0 border-b border-oak/25">
          <div className="flex h-16 items-center justify-between px-4 md:mx-auto md:grid md:max-w-7xl md:grid-cols-[1fr_auto_1fr] md:px-6 lg:px-8">
            <div className="flex min-w-0 items-center">
              {panel ? (
                <button
                  type="button"
                  onClick={() => setPanel(null)}
                  className="inline-flex h-10 min-w-0 items-center gap-1.5 text-ink lg:hidden"
                  aria-label={dict.nav.back}
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  <span className="truncate font-serif text-[1.35rem] leading-none tracking-tight">
                    {panelTitle[panel]}
                  </span>
                </button>
              ) : null}
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-[0.24em] text-sage",
                  panel && "hidden lg:inline"
                )}
              >
                {locale === "el" ? "Μενού" : "Menu"}
              </span>
            </div>
            <span onClick={onClose} className="hidden md:flex">
              <SiteLogo />
            </span>
            <div className="flex justify-end">
              <CloseButton ref={closeRef} visible={visible} onClose={onClose} label={dict.nav.closeMenu} />
            </div>
          </div>
        </div>

        <div className="relative flex min-h-0 w-full flex-1 md:mx-auto md:max-w-7xl">
          {/* Root list — slides away on mobile, fades on tablet, left column on desktop */}
          <nav
            className={cn(
              "absolute inset-0 flex flex-col overflow-y-auto transition-[translate,opacity] duration-500 md:translate-x-0 lg:static lg:w-[42%] lg:shrink-0 lg:border-r lg:border-oak/25 lg:opacity-100",
              EASE,
              panel
                ? "-translate-x-full md:pointer-events-none md:opacity-0 lg:pointer-events-auto"
                : "translate-x-0"
            )}
          >
            <ul className="px-3 pt-3 md:px-4 md:pt-8 lg:pt-10">
              {rootItems.map((item, index) => {
                const selected = "panel" in item && panel === item.panel;
                const active = "href" in item && isActive(item.href);
                const row = cn(
                  "group relative flex w-full items-center justify-between gap-3 rounded-sm px-3 py-3.5 text-left md:py-3 transition-colors duration-300",
                  selected || active ? "bg-oak-soft/70" : "hover:bg-oak-soft/40",
                  visible && "animate-menu-item"
                );
                const label = (
                  <>
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 w-[2px] -translate-y-1/2 bg-coral transition-[height] duration-500",
                        EASE,
                        selected || active ? "h-7" : "h-0 group-hover:h-5"
                      )}
                      aria-hidden
                    />
                    <span className="flex min-w-0 items-baseline">
                      <span
                        className={cn(
                          "truncate font-serif text-[1.45rem] leading-none tracking-tight text-ink transition-transform duration-500 group-hover:translate-x-1 md:text-[2.4rem] md:group-hover:translate-x-2 lg:text-[2.6rem]",
                          EASE
                        )}
                      >
                        {item.label}
                      </span>
                    </span>
                  </>
                );
                return (
                  <li
                    key={item.id}
                    style={
                      visible ? { animationDelay: `${120 + index * 40}ms` } : undefined
                    }
                  >
                    {"panel" in item ? (
                      <button
                        type="button"
                        onClick={() => setPanel(item.panel)}
                        aria-expanded={selected}
                        className={row}
                      >
                        {label}
                        <ChevronRight
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 text-coral/80 transition-transform duration-500 group-hover:translate-x-0.5",
                            EASE
                          )}
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
                        {label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>

            <div
              className={cn(
                "mt-auto space-y-4 border-t border-oak/25 px-6 py-5 md:mt-10 md:border-t-0",
                visible && "animate-menu-item"
              )}
              style={visible ? { animationDelay: "480ms" } : undefined}
            >
              <div className="flex items-center justify-between gap-3 sm:hidden">
                <span className="text-[12px] uppercase tracking-[0.14em] text-ink-muted">
                  {dict.locale.label}
                </span>
                <LocaleSwitcher />
              </div>
              <div className="flex items-center justify-between">
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
            </div>
          </nav>

          {/* Category content — slides over on mobile, fades on tablet, right column on desktop */}
          <nav
            className={cn(
              "absolute inset-0 overflow-y-auto bg-bg transition-[translate,opacity] duration-500 md:translate-x-0 md:bg-transparent lg:static lg:min-w-0 lg:flex-1 lg:opacity-100",
              EASE,
              panel
                ? "translate-x-0"
                : "translate-x-full md:pointer-events-none md:opacity-0 lg:pointer-events-auto"
            )}
          >
            <div
              key={panel ?? "intro"}
              className="animate-mega-col md:pt-4 lg:flex lg:min-h-full lg:flex-col lg:px-14 lg:py-10"
            >
              {panel ? (
                <div className="mb-2 hidden items-end justify-between gap-6 border-b border-oak/30 pb-5 lg:flex">
                  <h2 className="font-serif text-[2.4rem] leading-none tracking-tight text-ink">
                    {panelTitle[panel]}
                  </h2>
                  {panelHref[panel] ? (
                    <Link
                      href={panelHref[panel]}
                      onClick={onClose}
                      className="group inline-flex shrink-0 items-center gap-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-ink"
                    >
                      {locale === "el" ? "Δες όλα" : "View all"}
                      <ArrowRight
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1",
                          EASE
                        )}
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    </Link>
                  ) : null}
                </div>
              ) : (
                <MenuIntro locale={locale} onClose={onClose} />
              )}

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
                <ul className={listClass}>
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
                <ul className={listClass}>
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
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}

const listClass = "px-3 pb-10 pt-2 md:columns-2 md:gap-10 md:px-6 lg:px-0";

/** Hamburger lines that fold into an X as the drawer opens. */
function CloseButton({
  ref,
  visible,
  onClose,
  label,
}: {
  ref: React.Ref<HTMLButtonElement>;
  visible: boolean;
  onClose: () => void;
  label: string;
}) {
  const line = cn(
    "absolute left-0 top-1/2 h-[1.5px] w-full bg-current transition-[translate,rotate] duration-500",
    EASE
  );
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClose}
      aria-label={label}
      className="group relative inline-flex h-10 w-10 shrink-0 items-center justify-center text-ink/75 transition-colors hover:text-ink"
    >
      <span
        className={cn(
          "relative block h-5 w-5 transition-transform duration-500 group-hover:rotate-90",
          EASE
        )}
        aria-hidden
      >
        <span
          className={cn(
            line,
            "delay-150",
            visible ? "-translate-y-1/2 rotate-45" : "-translate-y-[5px] rotate-0"
          )}
        />
        <span
          className={cn(
            line,
            "delay-150",
            visible ? "-translate-y-1/2 -rotate-45" : "translate-y-[4px] rotate-0"
          )}
        />
      </span>
    </button>
  );
}

/** Desktop right column before a category is chosen. */
function MenuIntro({
  locale,
  onClose,
}: {
  locale: Locale;
  onClose: () => void;
}) {
  const el = locale === "el";
  return (
    <div className="hidden flex-1 flex-col justify-between gap-10 lg:flex">
      <div className="max-w-md pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sage">
          {el ? "Ανακάλυψε" : "Discover"}
        </p>
        <p className="mt-4 font-serif text-[2.75rem] leading-[1.02] tracking-tight text-ink">
          {el ? (
            <>
              Η K-beauty ρουτίνα σου, <em className="text-coral">απλά.</em>
            </>
          ) : (
            <>
              Your K-beauty routine, <em className="text-coral">simplified.</em>
            </>
          )}
        </p>
        <p className="mt-5 text-[14px] leading-relaxed text-ink-muted">
          {el
            ? "Διάλεξε μια κατηγορία για να δεις τι περιέχει."
            : "Choose a category to see what's inside."}
        </p>
      </div>

      <Link
        href={navBar.quiz.href}
        onClick={onClose}
        className="group relative overflow-hidden bg-ink p-7 text-bg"
      >
        <span
          className={cn(
            "pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-coral/40 blur-3xl transition-transform duration-700 group-hover:scale-125",
            EASE
          )}
          aria-hidden
        />
        <span className="relative block text-[10px] font-semibold uppercase tracking-[0.24em] text-bg/60">
          {menuText(locale, navBar.quiz)}
        </span>
        <span className="relative mt-3 flex items-end justify-between gap-6">
          <span className="font-serif text-[1.9rem] leading-[1.05] tracking-tight">
            {el ? "Βρες τι ταιριάζει στην επιδερμίδα σου" : "Find what suits your skin"}
          </span>
          <span
            className={cn(
              "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-bg/30 transition-[transform,background-color,border-color] duration-500 group-hover:translate-x-1 group-hover:border-coral group-hover:bg-coral",
              EASE
            )}
          >
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </span>
        </span>
      </Link>
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
    <ul className={listClass}>
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
        "break-inside-avoid px-3 pb-1 pt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-sage",
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
    <li className="break-inside-avoid">
      <Link
        href={href}
        onClick={onClose}
        className={cn(
          "block rounded-sm px-3 py-2.5 text-[15px] leading-snug text-ink/80 transition-[background-color,color,translate] duration-300 hover:translate-x-1 hover:bg-oak-soft/50 hover:text-ink",
          EASE
        )}
      >
        {children}
      </Link>
    </li>
  );
}
