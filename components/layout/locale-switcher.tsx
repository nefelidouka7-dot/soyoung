"use client";

import { useRouter } from "next/navigation";
import { LOCALES, type Locale } from "@/lib/i18n";
import { setLocaleCookie } from "@/lib/i18n/cookie";
import { useLocaleStore } from "@/lib/i18n/store";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "onDark";
}) {
  const router = useRouter();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const { dict } = useTranslation();
  const onDark = variant === "onDark";

  return (
    <div
      className={cn(
        "inline-flex items-center text-[11px] uppercase tracking-wider",
        onDark ? "border border-white/25" : "border border-oak/50",
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
            "h-7 min-w-8 px-2 transition-colors",
            locale === code
              ? onDark
                ? "bg-white text-ink"
                : "bg-ink text-bg"
              : onDark
                ? "bg-transparent text-white/65 hover:text-white"
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
