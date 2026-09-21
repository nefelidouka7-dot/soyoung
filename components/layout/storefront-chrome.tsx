"use client";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { CartDrawer } from "@/features/cart/components/cart-drawer";
import { SearchOverlay } from "@/features/search/components/search-overlay";
import { CartHydration } from "@/features/cart/components/cart-hydration";
import { WishlistHydration } from "@/features/wishlist/components/wishlist-hydration";
import type { NavigationData } from "@/types";

export function StorefrontChrome({
  children,
  navigation,
}: {
  children: React.ReactNode;
  navigation: NavigationData;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <CartHydration />
      <WishlistHydration />
      <SiteHeader navigation={navigation} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <CartDrawer />
      <SearchOverlay />
      <CookieBanner />
    </div>
  );
}
