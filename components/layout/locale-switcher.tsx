"use client";

import { useRouter } from "next/navigation";
import { LOCALES, type Locale } from "@/lib/i18n";
import { setLocaleCookie } from "@/lib/i18n/cookie";
import { useLocaleStore } from "@/lib/i18n/store";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const { dict } = useTranslation();

  return (
    <div
      className={cn(
        "inline-flex items-center border border-oak/50 text-[11px] uppercase tracking-wider",
        className
      )}
      role="group"
      aria-label={dict.locale.label}
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => {
            setLocale(code as Locale);
            setLocaleCookie(code);
            router.refresh();
          }}
          className={cn(
            "h-8 min-w-9 px-2 transition-colors",
            locale === code
              ? "bg-ink text-bg"
              : "bg-transparent text-ink-muted hover:text-ink"
          )}
          aria-pressed={locale === code}
        >
          {dict.locale[code]}
        </button>
      ))}
    </div>
  );
}
