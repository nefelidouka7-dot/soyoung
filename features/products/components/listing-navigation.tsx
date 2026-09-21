"use client";

import { createContext, useContext } from "react";

export type ListingNavigation = {
  pending: boolean;
  push: (url: string) => void;
};

export const ListingNavigationContext =
  createContext<ListingNavigation | null>(null);

export function useListingNavigation() {
  return useContext(ListingNavigationContext);
}
