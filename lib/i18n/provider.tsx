"use client";

import { useEffect } from "react";
import { setLocaleCookie } from "@/lib/i18n/cookie";
import { useLocaleStore } from "@/lib/i18n/store";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocaleStore((s) => s.locale);
  const setHydrated = useLocaleStore((s) => s.setHydrated);

  useEffect(() => {
    const result = useLocaleStore.persist.rehydrate();
    Promise.resolve(result).then(() => {
      setHydrated(true);
      setLocaleCookie(useLocaleStore.getState().locale);
    });
  }, [setHydrated]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <>{children}</>;
}
