"use client";

import { useMemo } from "react";
import { getDictionary, interpolate } from "@/lib/i18n";
import { useLocaleStore } from "@/lib/i18n/store";
import type { Dictionary } from "@/lib/i18n/types";

export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);
  const dict = useMemo(() => getDictionary(locale), [locale]);

  function t(
    pick: (d: Dictionary) => string,
    vars?: Record<string, string | number>
  ) {
    const value = pick(dict);
    return vars ? interpolate(value, vars) : value;
  }

  return { locale, dict, t };
}
