"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, ShoppingBag, User } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { useCommerceSettings } from "@/lib/commerce-settings";
import { interpolate } from "@/lib/i18n";
import { useCartStore } from "@/features/cart/store";
import { useUIStore } from "@/lib/ui-store";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { NavigationData } from "@/types";
import { SiteLogo } from "@/components/layout/site-logo";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { NavDrawer } from "@/components/layout/nav-drawer";

const MENU_ANIM_MS = 520;

export function SiteHeader({ navigation }: { navigation: NavigationData }) {
  const { dict, locale } = useTranslation();
  const { freeShippingThreshold } = useCommerceSettings();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const cartHydrated = useCartStore((s) => s.hydrated);
  const cartCount = useCartStore((s) =>
    s.items.reduce((n, i) => n + i.quantity, 0)
  );
  const displayCount = cartHydrated ? cartCount : 0;
  const [cartBump, setCartBump] = useState(false);
  const prevCartCount = useRef<number | null>(null);

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

  const freeShippingFrom = formatPrice(freeShippingThreshold).replace(
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
          <div className="container-page relative flex items-center justify-center py-2">
            <p className="text-center text-[10px] uppercase tracking-[0.16em] sm:text-[11px] sm:tracking-[0.18em]">
              {announcement}
            </p>
            <div className="absolute inset-y-0 right-0 hidden items-center xl:flex">
              <LocaleSwitcher variant="onDark" />
            </div>
          </div>
        </div>

        <header
          className={cn(
            "relative border-b border-transparent bg-bg transition-all duration-300",
            scrolled && "border-oak/30 bg-bg/95 backdrop-blur-sm"
          )}
        >
          {/* Top bar: icons + logo */}
          <div
            className={cn(
              "container-page grid grid-cols-[1fr_auto_1fr] items-center gap-2 transition-[height] duration-300",
              scrolled ? "h-14" : "h-14 md:h-16"
            )}
          >
            <div className="flex items-center justify-start gap-0.5">
              <button
                type="button"
                className="group inline-flex h-10 min-w-10 shrink-0 items-center justify-center gap-2.5 text-ink lg:px-2"
                onClick={openMobileMenu}
                aria-label={dict.nav.openMenu}
                aria-expanded={mobileOpen}
                aria-haspopup="true"
              >
                <span className="relative block h-3.5 w-5" aria-hidden>
                  <span className="absolute left-0 top-0 h-[1.5px] w-5 bg-current transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-3" />
                  <span className="absolute left-0 top-1/2 h-[1.5px] w-3.5 -translate-y-1/2 bg-current transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-5" />
                  <span className="absolute bottom-0 left-0 h-[1.5px] w-5 bg-current transition-[width] delay-75 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-4" />
                </span>
                <span className="hidden text-[11px] font-semibold uppercase tracking-[0.2em] lg:inline">
                  {locale === "el" ? "Μενού" : "Menu"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  useUIStore.getState().openSearch();
                }}
                className="inline-flex h-10 w-10 items-center justify-center text-ink transition-opacity hover:opacity-70"
                aria-label={dict.nav.search}
              >
                <Search className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            <SiteLogo priority className="justify-self-center" />

            <div className="flex items-center justify-end gap-1.5 sm:gap-2">
              <LocaleSwitcher className="hidden sm:inline-flex xl:hidden" />
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
                <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
                {displayCount > 0 ? (
                  <span
                    className={cn(
                      "absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center bg-coral px-1 text-[10px] font-bold text-white",
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
                <User className="h-5 w-5" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </header>
      </div>

      {menuMounted ? (
        <NavDrawer
          navigation={navigation}
          visible={menuVisible}
          onClose={closeMenu}
          isActive={isActive}
        />
      ) : null}
    </>
  );
}
