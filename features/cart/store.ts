"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  productId: string;
  variantId?: string | null;
  slug: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  compareAtPrice?: number | null;
  variantName?: string | null;
  quantity: number;
  maxStock: number;
};

type CartState = {
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  addItem: (item: Omit<CartLine, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    variantId?: string | null
  ) => void;
  clear: () => void;
  setFromServer: (items: CartLine[]) => void;
};

function recompute(items: CartLine[]) {
  const safe = items.filter((i) => i.quantity > 0);
  return {
    items: safe,
    itemCount: safe.reduce((n, i) => n + i.quantity, 0),
    subtotal: safe.reduce((n, i) => n + i.price * i.quantity, 0),
  };
}

function lineKey(productId: string, variantId?: string | null) {
  return `${productId}:${variantId ?? "default"}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      itemCount: 0,
      subtotal: 0,
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
      addItem: (item) => {
        const qty = Math.max(1, item.quantity ?? 1);
        const maxStock = Math.max(1, item.maxStock || 99);
        const items = [...get().items];
        const key = lineKey(item.productId, item.variantId);
        const idx = items.findIndex(
          (i) => lineKey(i.productId, i.variantId) === key
        );
        if (idx >= 0) {
          const nextQty = Math.min(maxStock, items[idx].quantity + qty);
          items[idx] = { ...items[idx], quantity: nextQty, maxStock };
        } else {
          items.push({
            ...item,
            maxStock,
            quantity: Math.min(maxStock, qty),
          });
        }
        set(recompute(items));
      },
      removeItem: (productId, variantId) => {
        const items = get().items.filter(
          (i) =>
            lineKey(i.productId, i.variantId) !== lineKey(productId, variantId)
        );
        set(recompute(items));
      },
      updateQuantity: (productId, quantity, variantId) => {
        const items = get().items.map((i) =>
          lineKey(i.productId, i.variantId) === lineKey(productId, variantId)
            ? {
                ...i,
                quantity: Math.max(1, Math.min(i.maxStock || 99, quantity)),
              }
            : i
        );
        set(recompute(items));
      },
      clear: () => set({ ...recompute([]), hydrated: get().hydrated }),
      setFromServer: (items) => set(recompute(items)),
    }),
    {
      name: "soyoung-cart",
      skipHydration: true,
      partialize: (s) => ({ items: s.items }),
      merge: (persisted, current) => {
        const stored = persisted as { items?: CartLine[] } | undefined;
        const items = stored?.items ?? [];
        return {
          ...current,
          ...recompute(items),
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const next = recompute(state.items ?? []);
        useCartStore.setState({ ...next, hydrated: true });
      },
    }
  )
);
