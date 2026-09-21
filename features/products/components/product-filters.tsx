"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/use-translation";
import { productTypeLabel } from "@/lib/i18n/nav";

type Facets = {
  brands: Array<{ id: string; name: string; slug: string }>;
  skinTypes: Array<{
    id: string;
    name: string;
    nameEl: string;
    slug: string;
  }>;
  productTypes: string[];
  minPrice: number;
  maxPrice: number;
};

function useFilterParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function toggle(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const current = (params.get(key) ?? "").split(",").filter(Boolean);
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    if (next.length) params.set(key, next.join(","));
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function setFlag(key: string, on: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    if (on) params.set(key, "1");
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function selected(key: string) {
    return (searchParams.get(key) ?? "").split(",").filter(Boolean);
  }

  function clear() {
    router.push(pathname, { scroll: false });
  }

  return { toggle, setFlag, selected, clear, searchParams };
}

export function ProductFilters({ facets }: { facets: Facets }) {
  const { dict, locale } = useTranslation();
  const { toggle, setFlag, selected, clear, searchParams } = useFilterParams();
  const [open, setOpen] = useState(false);

  const content = (
    <div className="space-y-8">
      <FilterGroup title={dict.filters.brand}>
        {facets.brands.map((b) => (
          <CheckRow
            key={b.id}
            label={b.name}
            checked={selected("brand").includes(b.slug)}
            onChange={() => toggle("brand", b.slug)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title={dict.filters.skinType}>
        {facets.skinTypes.map((s) => (
          <CheckRow
            key={s.id}
            label={locale === "el" ? s.nameEl : s.name}
            checked={selected("skinType").includes(s.slug)}
            onChange={() => toggle("skinType", s.slug)}
          />
        ))}
      </FilterGroup>

      {facets.productTypes.length > 0 ? (
        <FilterGroup title={dict.filters.productType}>
          {facets.productTypes.map((t) => (
            <CheckRow
              key={t}
              label={productTypeLabel(dict, t)}
              checked={selected("type").includes(t)}
              onChange={() => toggle("type", t)}
            />
          ))}
        </FilterGroup>
      ) : null}

      <FilterGroup title={dict.filters.availability}>
        <CheckRow
          label={dict.filters.inStock}
          checked={searchParams.get("available") === "1"}
          onChange={() =>
            setFlag("available", searchParams.get("available") !== "1")
          }
        />
      </FilterGroup>

      <FilterGroup title={dict.filters.offers}>
        <CheckRow
          label={dict.filters.onSale}
          checked={searchParams.get("offers") === "1"}
          onChange={() => setFlag("offers", searchParams.get("offers") !== "1")}
        />
      </FilterGroup>

      <button
        type="button"
        onClick={clear}
        className="text-xs uppercase tracking-wider text-ink-muted underline-offset-4 hover:underline"
      >
        {dict.filters.clearAll}
      </button>
    </div>
  );

  return (
    <>
      <div className="lg:hidden">
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => setOpen(true)}
        >
          {dict.filters.title}
        </Button>
      </div>

      <aside className="hidden lg:block">{content}</aside>

      {open ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/30"
            aria-label={dict.filters.close}
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto bg-bg p-5 animate-rise">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl">{dict.filters.title}</h2>
              <button
                type="button"
                className="text-sm text-ink-muted"
                onClick={() => setOpen(false)}
              >
                {dict.filters.done}
              </button>
            </div>
            {content}
          </div>
        </div>
      ) : null}
    </>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-ink">{title}</p>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className={cn(
          "h-4 w-4 appearance-none border border-oak bg-bg-muted checked:border-sage checked:bg-sage"
        )}
      />
      {label}
    </label>
  );
}
