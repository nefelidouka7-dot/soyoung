"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useListingNavigation } from "@/features/products/components/listing-navigation";

const OPTIONS = [
  { value: "recommended", key: "recommended" as const },
  { value: "newest", key: "newest" as const },
  { value: "price-asc", key: "priceAsc" as const },
  { value: "price-desc", key: "priceDesc" as const },
] as const;

export function ProductSort({ current }: { current: string }) {
  const { dict } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navigation = useListingNavigation();
  const [, startTransition] = useTransition();

  return (
    <label className="group flex w-full items-center gap-2.5 sm:w-auto">
      <span className="hidden shrink-0 text-[10px] uppercase tracking-[0.14em] text-ink-muted/80 sm:inline">
        {dict.sort.label}
      </span>
      <span className="sr-only sm:hidden">{dict.sort.label}</span>
      <span className="relative min-w-0 flex-1 sm:min-w-[11.5rem] sm:flex-none">
        <select
          value={current}
          className="h-9 w-full cursor-pointer appearance-none border-0 border-b border-oak/35 bg-transparent py-0 pl-0 pr-7 text-[13px] text-ink-muted outline-none transition-colors hover:border-oak/55 hover:text-ink focus-visible:border-sage focus-visible:text-ink"
          onChange={(e) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("sort", e.target.value);
            params.delete("page");
            const qs = params.toString();
            const url = qs ? `${pathname}?${qs}` : pathname;
            if (navigation) {
              navigation.push(url);
              return;
            }
            startTransition(() => {
              router.push(url, { scroll: false });
            });
          }}
        >
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {dict.sort[o.key]}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted/70 transition-colors group-hover:text-ink-muted"
          strokeWidth={1.75}
          aria-hidden
        />
      </span>
    </label>
  );
}
