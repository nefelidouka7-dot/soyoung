"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { cn, FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/utils";
import { interpolate } from "@/lib/i18n";
import { useCartStore } from "@/features/cart/store";
import { useUIStore } from "@/lib/ui-store";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { NavigationData } from "@/types";
import { SiteLogo } from "@/components/layout/site-logo";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { DesktopMegaMenu } from "@/components/layout/desktop-mega-menu";

const MENU_ANIM_MS = 320;

function isDesktopNav() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1024px)").matches
  );
}

export function SiteHeader({ navigation }: { navigation: NavigationData }) {
  const { dict } = useTranslation();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const cartHydrated = useCartStore((s) => s.hydrated);
  const cartCount = useCartStore((s) =>
    s.items.reduce((n, i) => n + i.quantity, 0)
  );
  const displayCount = cartHydrated ? cartCount : 0;
  const [cartBump, setCartBump] = useState(false);
  const prevCartCount = useRef<number | null>(null);

  const closeMega = useCallback(() => {
    setMegaOpen(false);
  }, []);

  useEffect(() => {
    closeMega();
  }, [pathname, closeMega]);

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

  function openMobileMenu() {
    closeMega();
    setMenuMounted(true);
    setMobileOpen(true);
  }

  function onMenuButtonClick() {
    if (isDesktopNav()) {
      setMegaOpen((open) => !open);
      return;
    }
    openMobileMenu();
  }

  useEffect(() => {
    if (!mobileOpen && !megaOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenu();
        closeMega();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, megaOpen, closeMenu, closeMega]);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const freeShippingFrom = formatPrice(FREE_SHIPPING_THRESHOLD).replace(
    /[.,]00$/,
    ""
  );
  const announcement = interpolate(dict.home.announcement, {
    amount: freeShippingFrom,
  });

  return (
    <>
      <div className="sticky top-0 z-50">
        <div className="bg-ink text-white">
          <p className="container-page py-2 text-center text-[10px] uppercase tracking-[0.16em] sm:text-[11px] sm:tracking-[0.18em]">
            {announcement}
          </p>
        </div>
        <header
          className={cn(
            "relative border-b border-transparent transition-all duration-300",
            scrolled
              ? "h-16 border-oak/40 bg-bg/95 backdrop-blur-sm"
              : "h-16 bg-bg/95 backdrop-blur-sm md:h-[4.5rem]",
            megaOpen && "border-oak/30"
          )}
        >
          <div className="container-page grid h-full grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="flex items-center justify-start gap-0.5 sm:gap-1">
              <button
                type="button"
                className={cn(
                  "inline-flex h-10 w-10 shrink-0 items-center justify-center text-sage transition-opacity hover:opacity-70",
                  megaOpen && "opacity-100"
                )}
                onClick={onMenuButtonClick}
                aria-label={dict.nav.openMenu}
                aria-expanded={mobileOpen || megaOpen}
                aria-haspopup="true"
              >
                {megaOpen ? (
                  <X
                    className="pointer-events-none hidden h-5 w-5 lg:block"
                    strokeWidth={1.5}
                  />
                ) : null}
                <Menu
                  className={cn(
                    "pointer-events-none h-5 w-5",
                    megaOpen && "lg:hidden"
                  )}
                  strokeWidth={1.5}
                />
              </button>
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
            </div>

            <SiteLogo priority className="translate-y-0.5 justify-self-center" />

            <div className="flex items-center justify-end gap-0.5 sm:gap-1">
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
                      "pointer-events-none absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center bg-coral px-1 text-[10px] font-bold text-white",
                      cartBump && "animate-cart-badge"
                    )}
                  >
                    {displayCount > 99 ? "99+" : displayCount}
                  </span>
                ) : null}
              </button>
              <Link
                href="/login"
                className="inline-flex h-10 w-10 items-center justify-center text-ink transition-opacity hover:opacity-70"
                aria-label={dict.nav.account}
              >
                <User className="pointer-events-none h-5 w-5" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </header>

        <DesktopMegaMenu
          navigation={navigation}
          open={megaOpen}
          onClose={closeMega}
        />
      </div>

      {menuMounted ? (
        <MobileNavDrawer
          navigation={navigation}
          visible={menuVisible}
          onClose={closeMenu}
          isActive={isActive}
        />
      ) : null}
    </>
  );
}
