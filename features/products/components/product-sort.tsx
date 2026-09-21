"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/use-translation";

const OPTIONS = [
  { value: "recommended", key: "recommended" as const },
  { value: "newest", key: "newest" as const },
  { value: "best-rated", key: "bestRated" as const },
  { value: "price-asc", key: "priceAsc" as const },
  { value: "price-desc", key: "priceDesc" as const },
] as const;

export function ProductSort({ current }: { current: string }) {
  const { dict } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <label className="flex items-center gap-2 text-sm text-ink-muted">
      <span className="sr-only">{dict.sort.label}</span>
      <select
        value={current}
        className="h-10 border border-oak/50 bg-bg-muted px-3 text-sm text-ink"
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("sort", e.target.value);
          params.delete("page");
          router.push(`${pathname}?${params.toString()}`, { scroll: false });
        }}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {dict.sort[o.key]}
          </option>
        ))}
      </select>
    </label>
  );
}
