"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/types";

type LocaleState = {
  locale: Locale;
  hydrated: boolean;
  setLocale: (locale: Locale) => void;
  setHydrated: (value: boolean) => void;
};

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      hydrated: false,
      setLocale: (locale) => set({ locale }),
      setHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: "soyoung-locale",
      skipHydration: true,
      partialize: (s) => ({ locale: s.locale }),
    }
  )
);
