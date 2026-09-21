"use client";

import { useEffect } from "react";
import { useCartStore } from "@/features/cart/store";

export function CartHydration() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  return null;
}
