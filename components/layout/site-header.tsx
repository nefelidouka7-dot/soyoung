"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { brand } from "@/lib/constants";
import { STORE_NAME, cn } from "@/lib/utils";
import { useCartStore } from "@/features/cart/store";
import { useUIStore } from "@/lib/ui-store";
import { useTranslation } from "@/lib/i18n/use-translation";
import { navLabel, productTypeLabel } from "@/lib/i18n/nav";
import type { NavigationData } from "@/types";

const MENU_ANIM_MS = 320;
/** Long enough to cross an item without flashing, short enough to feel instant. */
const PANEL_OPEN_DELAY_MS = 120;
const PANEL_CLOSE_DELAY_MS = 280;

/** Which top-level links open a panel, and what that panel shows. */
const PANEL_KIND: Record<string, "category" | "brands"> = {
  "/makeup": "category",
  "/skincare": "category",
  "/haircare": "category",
  "/body": "category",
  "/brands": "brands",
};

const PROMO_HREFS = new Set(["/new-in", "/offers"]);

export function SiteHeader({ navigation }: { navigation: NavigationData }) {
  const { dict, locale } = useTranslation();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const cartHydrated = useCartStore((s) => s.hydrated);
  const cartCount = useCartStore((s) =>
    s.items.reduce((n, i) => n + i.quantity, 0)
  );
  const displayCount = cartHydrated ? cartCount : 0;
  const categoryNav = brand.nav.filter((item) => !PROMO_HREFS.has(item.href));
  const promoNav = brand.nav.filter((item) => PROMO_HREFS.has(item.href));
  const [cartBump, setCartBump] = useState(false);
  const prevCartCount = useRef<number | null>(null);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (openTimer.current) window.clearTimeout(openTimer.current);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  }, []);

  const openNow = useCallback(
    (href: string) => {
      clearTimers();
      setOpenPanel(href);
    },
    [clearTimers]
  );

  const closeNow = useCallback(() => {
    clearTimers();
    setOpenPanel(null);
  }, [clearTimers]);

  const scheduleOpen = useCallback(
    (href: string) => {
      clearTimers();
      openTimer.current = window.setTimeout(
        () => setOpenPanel(href),
        PANEL_OPEN_DELAY_MS
      );
    },
    [clearTimers]
  );

  const scheduleClose = useCallback(() => {
    clearTimers();
    closeTimer.current = window.setTimeout(
      () => setOpenPanel(null),
      PANEL_CLOSE_DELAY_MS
    );
  }, [clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    if (!openPanel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNow();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPanel, closeNow]);

  useEffect(() => {
    if (!cartHydrated) return;
    if (prevCartCount.current === null) {
      prevCartCount.current = cartCount;
      return;
    }
    if (cartCount > prevCartCount.current) {
      setCartBump(false);
      const frame = requestAnimationFrame(() => setCartBump(true));
      const t = window.setTimeout(() => setCartBump(false), 480);
      prevCartCount.current = cartCount;
      return () => {
        cancelAnimationFrame(frame);
        window.clearTimeout(t);
      };
    }
    prevCartCount.current = cartCount;
  }, [cartCount, cartHydrated]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The drawer mounts off-screen first, then animates in on the next frame.
  useEffect(() => {
    if (mobileOpen) {
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setMenuVisible(true));
      });
      return () => cancelAnimationFrame(id);
    }

    const t = window.setTimeout(() => setMenuMounted(false), MENU_ANIM_MS);
    return () => window.clearTimeout(t);
  }, [mobileOpen]);

  useEffect(() => {
    if (!menuMounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuMounted]);

  const closeMenu = useCallback(() => {
    setMenuVisible(false);
    setMobileOpen(false);
  }, []);

  function openMenu() {
    setMenuMounted(true);
    setMobileOpen(true);
  }

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, closeMenu]);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const panelCategory = openPanel
    ? navigation.categories.find((c) => `/${c.slug}` === openPanel)
    : undefined;
  const skinTypeName = (skinType: NavigationData["skinTypes"][number]) =>
    locale === "el" ? skinType.nameEl : skinType.name;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b border-transparent transition-all duration-300",
          scrolled
            ? "h-16 border-oak/40 bg-bg/95 backdrop-blur-sm"
            : "h-16 bg-bg/90 backdrop-blur-sm md:h-[4.5rem]"
        )}
      >
        <div className="container-page flex h-full items-center gap-3 lg:gap-5">
          <Link
            href="/"
            className="shrink-0 font-serif text-2xl tracking-tight text-ink md:text-[1.75rem]"
            aria-label={`${STORE_NAME} home`}
          >
            {STORE_NAME}
          </Link>

          <nav
            className="hidden min-w-0 flex-1 items-center justify-center gap-5 lg:flex xl:gap-7"
            aria-label="Primary"
            onMouseLeave={scheduleClose}
          >
            <div className="flex items-center gap-2.5 xl:gap-3.5">
              {categoryNav.map((item) => {
                const kind = PANEL_KIND[item.href];
                const active = isActive(item.href);
                const expanded = openPanel === item.href;
                return (
                  <div
                    key={item.href}
                    onMouseEnter={() =>
                      kind ? scheduleOpen(item.href) : scheduleClose()
                    }
                    onFocus={() => (kind ? openNow(item.href) : closeNow())}
                  >
                    <Link
                      href={item.href}
                      onClick={closeNow}
                      aria-current={active ? "page" : undefined}
                      aria-expanded={kind ? expanded : undefined}
                      className={cn(
                        "flex items-center gap-1 whitespace-nowrap border-b-2 border-transparent py-1 text-[13px] font-medium text-ink transition-colors xl:text-[14px]",
                        active && "border-ink/70"
                      )}
                    >
                      {navLabel(dict, item.href, item.label)}
                      {kind ? (
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                            expanded && "rotate-180"
                          )}
                          strokeWidth={1.5}
                          aria-hidden
                        />
                      ) : null}
                    </Link>
                  </div>
                );
              })}
            </div>

            <div className="ml-1 flex items-center gap-2.5 xl:ml-2 xl:gap-3">
              {promoNav.map((item, index) => {
                const active = isActive(item.href);
                return (
                  <div key={item.href} className="flex items-center gap-2.5 xl:gap-3">
                    {index > 0 ? (
                      <span className="text-oak/70" aria-hidden>
                        ·
                      </span>
                    ) : null}
                    <Link
                      href={item.href}
                      onClick={closeNow}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "whitespace-nowrap border-b-2 border-transparent py-1 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink xl:text-[14px]",
                        active && "border-ink/50 text-ink"
                      )}
                    >
                      {navLabel(dict, item.href, item.label)}
                    </Link>
                  </div>
                );
              })}
            </div>

            <Link
              href="/skin-type"
              className="hidden h-9 min-h-9 shrink-0 items-center whitespace-nowrap bg-sage px-3 text-[11px] font-medium uppercase tracking-[0.04em] text-bg transition-colors hover:bg-sage-dark 2xl:inline-flex 2xl:h-10 2xl:min-h-10 2xl:px-5 2xl:text-[13px]"
            >
              {dict.nav.findForMySkin}
            </Link>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1 lg:ml-0">
            <button
              type="button"
              onClick={() => {
                useUIStore.getState().openSearch();
              }}
              className="inline-flex h-10 w-10 items-center justify-center text-ink transition-opacity hover:opacity-70"
              aria-label={dict.nav.search}
            >
              <Search className="pointer-events-none h-5 w-5" strokeWidth={1.5} />
            </button>
            <Link
              href="/login"
              className="hidden h-10 w-10 items-center justify-center text-ink transition-opacity hover:opacity-70 lg:inline-flex"
              aria-label={dict.nav.account}
            >
              <User className="pointer-events-none h-5 w-5" strokeWidth={1.5} />
            </Link>
            <Link
              href="/wishlist"
              className="hidden h-10 w-10 items-center justify-center text-ink transition-opacity hover:opacity-70 lg:inline-flex"
              aria-label={dict.nav.wishlist}
            >
              <Heart className="pointer-events-none h-5 w-5" strokeWidth={1.5} />
            </Link>
            <button
              type="button"
              onClick={() => {
                useUIStore.getState().openCart();
              }}
              className={cn(
                "relative inline-flex h-10 w-10 items-center justify-center text-ink transition-opacity hover:opacity-70",
                cartBump && "animate-cart-bump"
              )}
              aria-label={
                displayCount
                  ? `${dict.nav.cart}, ${displayCount}`
                  : dict.nav.cart
              }
            >
              <ShoppingBag
                className="pointer-events-none h-5 w-5"
                strokeWidth={1.5}
              />
              {displayCount > 0 ? (
                <span
                  className={cn(
                    "pointer-events-none absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center bg-sage px-1 text-[10px] text-bg",
                    cartBump && "animate-cart-badge"
                  )}
                >
                  {displayCount > 99 ? "99+" : displayCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center text-ink lg:hidden"
              onClick={openMenu}
              aria-label={dict.nav.openMenu}
              aria-expanded={mobileOpen}
            >
              <Menu className="pointer-events-none h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {openPanel ? (
          <div
            className="animate-soft-enter absolute inset-x-0 top-full hidden border-b border-oak/40 bg-bg shadow-[0_22px_44px_-28px_rgba(43,41,39,0.4)] lg:block"
            onMouseEnter={() => openNow(openPanel)}
            onMouseLeave={scheduleClose}
            onBlur={scheduleClose}
            // Any link inside the panel bubbles up here, so one handler closes it.
            onClick={closeNow}
          >
            {panelCategory ? (
              <div className="container-page grid grid-cols-[repeat(3,minmax(0,1fr))_17rem] gap-10 py-10">
                <MenuColumn title={dict.nav.menuByType}>
                  {panelCategory.productTypes.map((type) => (
                    <MenuLink
                      key={type}
                      href={`/${panelCategory.slug}?type=${encodeURIComponent(type)}`}
                    >
                      {productTypeLabel(dict, type)}
                    </MenuLink>
                  ))}
                  <MenuLink href={`/${panelCategory.slug}`} emphasis>
                    {dict.nav.menuShopAll}
                  </MenuLink>
                </MenuColumn>

                <MenuColumn title={dict.nav.menuByBrand}>
                  {panelCategory.brands.map((b) => (
                    <MenuLink
                      key={b.slug}
                      href={`/${panelCategory.slug}?brand=${b.slug}`}
                    >
                      {b.name}
                    </MenuLink>
                  ))}
                  <MenuLink href="/brands" emphasis>
                    {dict.nav.menuAllBrands}
                  </MenuLink>
                </MenuColumn>

                <MenuColumn title={dict.nav.menuBySkin}>
                  {navigation.skinTypes.map((skinType) => (
                    <MenuLink
                      key={skinType.slug}
                      href={`/${panelCategory.slug}?skinType=${skinType.slug}`}
                    >
                      {skinTypeName(skinType)}
                    </MenuLink>
                  ))}
                  <MenuLink href="/skin-type" emphasis>
                    {dict.home.takeSkinQuiz}
                  </MenuLink>
                </MenuColumn>

                <Link
                  href={`/${panelCategory.slug}?sort=newest`}
                  className="group relative block aspect-[4/3] overflow-hidden bg-bg-muted"
                >
                  {panelCategory.image ? (
                    <Image
                      src={panelCategory.image}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      sizes="272px"
                    />
                  ) : null}
                  <span className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-4 font-serif text-[1.35rem] leading-none text-bg">
                    {dict.nav.menuNewArrivals}
                  </span>
                </Link>
              </div>
            ) : (
              <div className="container-page grid grid-cols-[14rem_1fr] gap-12 py-10">
                <MenuColumn title={dict.nav.menuFeaturedBrands}>
                  {navigation.featuredBrands.map((b) => (
                    <MenuLink key={b.slug} href={`/brands/${b.slug}`}>
                      {b.name}
                    </MenuLink>
                  ))}
                </MenuColumn>
                <MenuColumn title={dict.nav.menuAllBrands}>
                  <div className="grid grid-cols-3 gap-x-8 gap-y-2.5">
                    {navigation.brands.map((b) => (
                      <MenuLink key={b.slug} href={`/brands/${b.slug}`}>
                        {b.name}
                      </MenuLink>
                    ))}
                  </div>
                </MenuColumn>
              </div>
            )}
          </div>
        ) : null}
      </header>

      {menuMounted ? (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal>
          <button
            type="button"
            className={cn(
              "absolute inset-0 bg-ink/20 backdrop-blur-[2px] transition-opacity duration-300 ease-out",
              menuVisible ? "opacity-100" : "opacity-0"
            )}
            aria-label={dict.nav.closeMenu}
            onClick={closeMenu}
          />
          <div
            className={cn(
              "absolute inset-y-0 right-0 flex w-full max-w-[20rem] flex-col bg-bg-muted shadow-[-12px_0_40px_rgba(43,41,39,0.08)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform sm:max-w-sm",
              menuVisible ? "translate-x-0" : "translate-x-full"
            )}
          >
            <div className="flex shrink-0 items-center justify-end px-5 pt-5">
              <button
                type="button"
                onClick={closeMenu}
                aria-label={dict.nav.closeMenu}
                className="inline-flex h-10 w-10 items-center justify-center text-ink-muted transition-colors hover:text-ink"
              >
                <X className="h-5 w-5" strokeWidth={1.25} />
              </button>
            </div>

            <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-6 pt-2">
              <ul className="flex flex-col gap-1">
                {categoryNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeMenu}
                      className="block py-3 font-serif text-[1.65rem] leading-none tracking-tight text-ink transition-opacity hover:opacity-60"
                    >
                      {navLabel(dict, item.href, item.label)}
                    </Link>
                  </li>
                ))}
              </ul>

              <ul className="mt-6 flex flex-col gap-1 border-t border-oak/25 pt-5">
                {promoNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeMenu}
                      className="block py-3 font-serif text-[1.65rem] leading-none tracking-tight text-ink-muted transition-colors hover:text-ink"
                    >
                      {navLabel(dict, item.href, item.label)}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex flex-col gap-3 border-t border-oak/25 pt-6">
                <Link
                  href="/skin-type"
                  onClick={closeMenu}
                  className="inline-flex min-h-14 w-full shrink-0 items-center justify-center bg-sage px-4 py-4 text-center text-[12px] font-medium uppercase leading-snug tracking-[0.04em] text-bg transition-colors hover:bg-sage-dark"
                >
                  {dict.nav.findForMySkin}
                </Link>

                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="py-1 text-sm tracking-wide text-ink-muted transition-colors hover:text-ink"
                >
                  {dict.nav.account}
                </Link>
                <Link
                  href="/wishlist"
                  onClick={closeMenu}
                  className="py-1 text-sm tracking-wide text-ink-muted transition-colors hover:text-ink"
                >
                  {dict.nav.wishlist}
                </Link>
              </div>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}

function MenuColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">
        {title}
      </p>
      <div className="mt-4 flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function MenuLink({
  href,
  children,
  emphasis = false,
}: {
  href: string;
  children: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "w-fit text-[14px] leading-tight text-ink transition-colors hover:text-sage-dark",
        emphasis &&
          "mt-1.5 text-[11px] uppercase tracking-[0.14em] text-ink-muted underline decoration-oak/50 underline-offset-4 hover:text-ink"
      )}
    >
      {children}
    </Link>
  );
}
