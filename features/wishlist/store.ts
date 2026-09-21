"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type WishlistState = {
  productIds: string[];
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
  setIds: (ids: string[]) => void;
  clear: () => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
      toggle: (productId) => {
        const ids = get().productIds;
        set({
          productIds: ids.includes(productId)
            ? ids.filter((id) => id !== productId)
            : [...ids, productId],
        });
      },
      has: (productId) => get().productIds.includes(productId),
      setIds: (ids) => set({ productIds: ids }),
      clear: () => set({ productIds: [] }),
    }),
    {
      name: "soyoung-wishlist",
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
