"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Top progress bar + light content dim while App Router navigations resolve.
 * Click on internal <a> starts it; pathname/search change finishes it.
 */
function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  // Finish when the new route is ready
  useEffect(() => {
    if (!active) return;
    setProgress(100);
    const done = window.setTimeout(() => {
      setActive(false);
      setVisible(false);
      setProgress(0);
    }, 220);
    return () => window.clearTimeout(done);
    // Intentionally only when the URL settles — not when `active` flips on.
  }, [pathname, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Safety: never leave the bar stuck if navigation is aborted
  useEffect(() => {
    if (!active) return;
    const failsafe = window.setTimeout(() => {
      setActive(false);
      setVisible(false);
      setProgress(0);
    }, 10000);
    return () => window.clearTimeout(failsafe);
  }, [active]);
  // Start on internal link clicks
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      const next = `${url.pathname}${url.search}`;
      const current = `${window.location.pathname}${window.location.search}`;
      if (next === current) return;

      setVisible(true);
      setActive(true);
      setProgress(14);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Creep toward ~90% while waiting
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 92) return p;
        const step = p < 40 ? 10 : p < 70 ? 5 : 2;
        return Math.min(92, p + step);
      });
    }, 280);
    return () => window.clearInterval(id);
  }, [active]);

  return (
    <>
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2.5px] overflow-hidden",
          visible ? "opacity-100" : "opacity-0"
        )}
        aria-hidden
      >
        <div
          className="h-full origin-left bg-sage shadow-[0_0_12px_color-mix(in_srgb,var(--sage)_55%,transparent)] transition-[width] duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        className={cn(
          "pointer-events-none fixed inset-0 z-[90] bg-bg/25 transition-opacity duration-300",
          active ? "opacity-100" : "opacity-0"
        )}
        aria-hidden
      />

      <div
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {active ? "Loading page…" : ""}
      </div>
    </>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
