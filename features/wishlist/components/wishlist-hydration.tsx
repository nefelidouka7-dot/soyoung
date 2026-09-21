"use client";

import { useEffect } from "react";
import { useWishlistStore } from "@/features/wishlist/store";

export function WishlistHydration() {
  useEffect(() => {
    void useWishlistStore.persist.rehydrate();
  }, []);

  return null;
}
