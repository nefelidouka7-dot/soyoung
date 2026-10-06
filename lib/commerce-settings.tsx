"use client";

import { createContext, useContext } from "react";
import {
  DEFAULT_STORE_SETTINGS,
  type StoreSettings,
} from "@/lib/store-settings";

const CommerceSettingsContext =
  createContext<StoreSettings>(DEFAULT_STORE_SETTINGS);

export function CommerceSettingsProvider({
  value,
  children,
}: {
  value: StoreSettings;
  children: React.ReactNode;
}) {
  return (
    <CommerceSettingsContext.Provider value={value}>
      {children}
    </CommerceSettingsContext.Provider>
  );
}

export function useCommerceSettings() {
  return useContext(CommerceSettingsContext);
}
