"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/use-translation";

const STORAGE_KEY = "soyoung-cookie-consent";

type Consent = "accepted" | "rejected";

export function CookieBanner() {
  const { dict } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== "accepted" && stored !== "rejected") {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  function choose(value: Consent) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
      window.dispatchEvent(
        new CustomEvent("soyoung:cookie-consent", { detail: value })
      );
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-oak/40 bg-bg/95 p-4 shadow-[0_-8px_30px_rgba(43,41,39,0.08)] backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-label={dict.cookies.title}
    >
      <div className="container-page flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="font-serif text-lg text-ink">{dict.cookies.title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            {dict.cookies.body}{" "}
            <Link href="/cookies" className="underline underline-offset-2">
              {dict.cookies.learnMore}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => choose("rejected")}
            className="inline-flex h-11 items-center border border-ink/20 px-5 text-[11px] uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink/40"
          >
            {dict.cookies.reject}
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="inline-flex h-11 items-center bg-coral px-5 text-[11px] uppercase tracking-[0.12em] font-bold text-white transition-colors hover:bg-coral-dark"
          >
            {dict.cookies.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
