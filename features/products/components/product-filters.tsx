"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";
import { productTypeLabel } from "@/lib/i18n/nav";
import { ListingNavigationContext } from "@/features/products/components/listing-navigation";
import type { Dictionary } from "@/lib/i18n/types";

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

type FilterDraft = {
  brand: string[];
  skinType: string[];
  type: string[];
  available: boolean;
  offers: boolean;
};

function splitParam(value: string | null) {
  return (value ?? "").split(",").filter(Boolean);
}

function toggleValue(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function draftFromSearchParams(searchParams: URLSearchParams): FilterDraft {
  return {
    brand: splitParam(searchParams.get("brand")),
    skinType: splitParam(searchParams.get("skinType")),
    type: splitParam(searchParams.get("type")),
    available: searchParams.get("available") === "1",
    offers: searchParams.get("offers") === "1",
  };
}

function draftCount(draft: FilterDraft, includeOffers: boolean) {
  return (
    draft.brand.length +
    draft.skinType.length +
    draft.type.length +
    (draft.available ? 1 : 0) +
    (includeOffers && draft.offers ? 1 : 0)
  );
}

function urlFromDraft(
  pathname: string,
  searchParams: URLSearchParams,
  draft: FilterDraft
) {
  const params = new URLSearchParams(searchParams.toString());
  for (const key of ["brand", "skinType", "type", "available", "offers", "page"]) {
    params.delete(key);
  }
  if (draft.brand.length) params.set("brand", draft.brand.join(","));
  if (draft.skinType.length) params.set("skinType", draft.skinType.join(","));
  if (draft.type.length) params.set("type", draft.type.join(","));
  if (draft.available) params.set("available", "1");
  if (draft.offers) params.set("offers", "1");
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

function useFilterParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const pendingScrollRef = useRef<number | null>(null);
  const [pending, setPending] = useState(false);

  const push = useCallback(
    (url: string) => {
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (url === currentUrl) return;

      pendingScrollRef.current = window.scrollY;
      const active = document.activeElement;
      if (active instanceof HTMLElement) active.blur();
      setPending(true);
      startTransition(() => {
        router.push(url, { scroll: false });
      });
    },
    [router]
  );

  useLayoutEffect(() => {
    if (pendingScrollRef.current == null) return;
    window.scrollTo({
      top: pendingScrollRef.current,
      left: 0,
      behavior: "instant",
    });
    pendingScrollRef.current = null;
  }, [searchParams]);

  useEffect(() => {
    setPending(false);
  }, [searchParams]);

  useEffect(() => {
    if (!pending) return;
    const timeout = window.setTimeout(() => setPending(false), 10000);
    return () => window.clearTimeout(timeout);
  }, [pending]);

  function toggle(key: "brand" | "skinType" | "type", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const current = splitParam(params.get(key));
    const next = toggleValue(current, value);
    if (next.length) params.set(key, next.join(","));
    else params.delete(key);
    params.delete("page");
    const qs = params.toString();
    push(qs ? `${pathname}?${qs}` : pathname);
  }

  function setFlag(key: "available" | "offers", on: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    if (on) params.set(key, "1");
    else params.delete(key);
    params.delete("page");
    const qs = params.toString();
    push(qs ? `${pathname}?${qs}` : pathname);
  }

  function selected(key: "brand" | "skinType" | "type") {
    return splitParam(searchParams.get(key));
  }

  function clear() {
    push(pathname);
  }

  return {
    toggle,
    setFlag,
    selected,
    clear,
    searchParams,
    pathname,
    pending,
    push,
  };
}

export function ProductFilters({
  facets,
  productCountLabel,
  sort,
  children,
}: {
  facets: Facets;
  productCountLabel: string;
  sort: React.ReactNode;
  children: React.ReactNode;
}) {
  const { dict, locale } = useTranslation();
  const {
    toggle,
    setFlag,
    selected,
    clear,
    searchParams,
    pathname,
    pending,
    push,
  } = useFilterParams();
  const navigation = useMemo(
    () => ({ pending, push }),
    [pending, push]
  );
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [draft, setDraft] = useState<FilterDraft>(() =>
    draftFromSearchParams(new URLSearchParams())
  );
  const filterListRef = useRef<HTMLDivElement>(null);
  const filterListScrollRef = useRef(0);
  const showOffersFilter = pathname !== "/offers";

  const brandSelected = selected("brand");
  const skinSelected = selected("skinType");
  const typeSelected = selected("type");
  const inStock = searchParams.get("available") === "1";
  const onSale = searchParams.get("offers") === "1";

  const liveDraft: FilterDraft = useMemo(
    () => ({
      brand: brandSelected,
      skinType: skinSelected,
      type: typeSelected,
      available: inStock,
      offers: onSale,
    }),
    [brandSelected, skinSelected, typeSelected, inStock, onSale]
  );

  const activeCount = draftCount(liveDraft, showOffersFilter);
  const sheetCount = draftCount(draft, showOffersFilter);

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; value: string; label: string }> = [];

    for (const slug of brandSelected) {
      const brand = facets.brands.find((b) => b.slug === slug);
      if (brand) chips.push({ key: "brand", value: slug, label: brand.name });
    }
    for (const slug of skinSelected) {
      const skin = facets.skinTypes.find((s) => s.slug === slug);
      if (skin) {
        chips.push({
          key: "skinType",
          value: slug,
          label: locale === "el" ? skin.nameEl : skin.name,
        });
      }
    }
    for (const type of typeSelected) {
      chips.push({
        key: "type",
        value: type,
        label: productTypeLabel(dict, type),
      });
    }
    if (inStock) {
      chips.push({
        key: "available",
        value: "1",
        label: dict.filters.inStock,
      });
    }
    if (showOffersFilter && onSale) {
      chips.push({
        key: "offers",
        value: "1",
        label: dict.filters.onSale,
      });
    }
    return chips;
  }, [
    brandSelected,
    skinSelected,
    typeSelected,
    inStock,
    onSale,
    showOffersFilter,
    facets.brands,
    facets.skinTypes,
    dict,
    locale,
  ]);

  useLayoutEffect(() => {
    if (filterListRef.current) {
      filterListRef.current.scrollTop = filterListScrollRef.current;
    }
  }, [searchParams]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previous;
    };
  }, [open]);

  function openSheet() {
    setDraft(draftFromSearchParams(new URLSearchParams(searchParams.toString())));
    setOpen(true);
  }

  function rememberFilterScroll() {
    filterListScrollRef.current = filterListRef.current?.scrollTop ?? 0;
  }

  function closeSheet() {
    setEntered(false);
  }

  function applyDraftAndClose() {
    push(urlFromDraft(pathname, searchParams, draft));
    closeSheet();
  }

  function handleSheetTransitionEnd(
    event: React.TransitionEvent<HTMLDivElement>
  ) {
    if (event.target !== event.currentTarget) return;
    if (event.propertyName !== "transform") return;
    if (!entered) setOpen(false);
  }

  function removeChip(key: string, value: string) {
    if (key === "available" || key === "offers") {
      setFlag(key, false);
      return;
    }
    toggle(key as "brand" | "skinType" | "type", value);
  }

  const desktopContent = (
    <FilterFields
      facets={facets}
      dict={dict}
      locale={locale}
      showOffersFilter={showOffersFilter}
      draft={liveDraft}
      onToggle={(key, value) => toggle(key, value)}
      onFlag={(key, on) => setFlag(key, on)}
    />
  );

  const sheetContent = (
    <FilterFields
      facets={facets}
      dict={dict}
      locale={locale}
      showOffersFilter={showOffersFilter}
      draft={draft}
      onToggle={(key, value) =>
        setDraft((prev) => ({
          ...prev,
          [key]: toggleValue(prev[key], value),
        }))
      }
      onFlag={(key, on) =>
        setDraft((prev) => ({
          ...prev,
          [key]: on,
        }))
      }
    />
  );

  return (
    <ListingNavigationContext.Provider value={navigation}>
      <div className="border-b border-oak/30 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={openSheet}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2.5 bg-ink px-5 text-[11px] uppercase tracking-[0.16em] text-bg shadow-[0_10px_24px_-16px_rgba(43,41,39,0.55)] transition-colors hover:bg-ink/90 lg:hidden"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} />
              {dict.filters.title}
              {activeCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center bg-bg/15 px-1.5 text-[10px] tabular-nums tracking-normal text-bg">
                  {activeCount}
                </span>
              ) : null}
            </button>

            <p className="min-w-0 text-[11px] uppercase tracking-[0.16em] text-ink-muted">
              {productCountLabel}
            </p>
          </div>

          <div className="w-full sm:w-auto sm:shrink-0">{sort}</div>
        </div>

        {activeChips.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {activeChips.map((chip) => (
              <button
                key={`${chip.key}-${chip.value}`}
                type="button"
                onClick={() => removeChip(chip.key, chip.value)}
                className="inline-flex h-8 items-center gap-1.5 border border-oak/40 bg-bg-muted/70 pl-2.5 pr-2 text-xs text-ink transition-colors hover:border-ink/35"
              >
                {chip.label}
                <X className="h-3 w-3 text-ink-muted" strokeWidth={1.75} />
              </button>
            ))}
            <button
              type="button"
              onClick={clear}
              className="h-8 px-1 text-[10px] uppercase tracking-[0.14em] text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              {dict.filters.clearAll}
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-8 sm:mt-8 lg:grid-cols-[15rem_1fr] lg:gap-12">
        <aside className="hidden lg:block">
          <div className="sticky top-28 flex max-h-[calc(100dvh-8.5rem)] flex-col">
            <div className="flex shrink-0 items-baseline justify-between gap-3 border-b border-oak/30 pb-4">
              <h2 className="font-serif text-xl leading-none text-ink">
                {dict.filters.title}
              </h2>
              {activeCount > 0 ? (
                <button
                  type="button"
                  onClick={clear}
                  className="text-[10px] uppercase tracking-[0.14em] text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                  {dict.filters.clearAll}
                </button>
              ) : null}
            </div>
            <div
              ref={filterListRef}
              className="mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain pe-2 [-ms-overflow-style:none] [scrollbar-width:thin]"
              onScroll={(e) => {
                filterListScrollRef.current = e.currentTarget.scrollTop;
              }}
            >
              <div onClickCapture={rememberFilterScroll}>{desktopContent}</div>
            </div>
          </div>
        </aside>

        <div className="relative min-h-[12rem]">
          <div
            className={cn(
              "transition-opacity duration-200",
              pending && "pointer-events-none opacity-40"
            )}
            aria-busy={pending}
          >
            {children}
          </div>
          {pending ? (
            <div
              className="absolute inset-0 z-10 flex items-start justify-center bg-bg/35 pt-16 backdrop-blur-[1px] sm:pt-20"
              aria-live="polite"
            >
              <span className="sr-only">{dict.common.loading}</span>
              <span
                className="h-5 w-5 rounded-full border border-oak/30 border-t-sage/80 animate-loader-spin"
                aria-hidden
              />
            </div>
          ) : null}
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="sheet-backdrop absolute inset-0 bg-ink/35 backdrop-blur-[1px]"
            data-open={entered ? "true" : "false"}
            aria-label={dict.filters.close}
            onClick={closeSheet}
          />
          <div
            className="sheet-panel absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col bg-bg shadow-[0_-18px_40px_-28px_rgba(43,41,39,0.45)]"
            data-open={entered ? "true" : "false"}
            onTransitionEnd={handleSheetTransitionEnd}
          >
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-oak/50" aria-hidden />
            <div className="flex shrink-0 items-center justify-between border-b border-oak/30 px-5 py-4">
              <div className="flex items-center gap-3">
                <h2 className="font-serif text-2xl text-ink">
                  {dict.filters.title}
                </h2>
                {sheetCount > 0 ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center bg-oak-soft px-1.5 text-[10px] tabular-nums text-ink">
                    {sheetCount}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center text-ink-muted transition-colors hover:text-ink"
                aria-label={dict.filters.close}
                onClick={closeSheet}
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-5">{sheetContent}</div>
            <div className="shrink-0 border-t border-oak/30 bg-bg px-5 py-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      brand: [],
                      skinType: [],
                      type: [],
                      available: false,
                      offers: false,
                    })
                  }
                  className="border border-oak/40 py-3 text-[11px] uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink/40 hover:bg-bg-muted"
                >
                  {dict.filters.clearAll}
                </button>
                <button
                  type="button"
                  onClick={applyDraftAndClose}
                  className="bg-sage py-3 text-[11px] uppercase tracking-[0.14em] font-bold text-white transition-colors hover:bg-sage-dark"
                >
                  {dict.filters.done}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </ListingNavigationContext.Provider>
  );
}

function FilterFields({
  facets,
  dict,
  locale,
  showOffersFilter,
  draft,
  onToggle,
  onFlag,
}: {
  facets: Facets;
  dict: Dictionary;
  locale: string;
  showOffersFilter: boolean;
  draft: FilterDraft;
  onToggle: (key: "brand" | "skinType" | "type", value: string) => void;
  onFlag: (key: "available" | "offers", on: boolean) => void;
}) {
  return (
    <div className="space-y-7">
      <FilterGroup title={dict.filters.brand}>
        {facets.brands.map((b) => (
          <CheckRow
            key={b.id}
            label={b.name}
            checked={draft.brand.includes(b.slug)}
            onChange={() => onToggle("brand", b.slug)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title={dict.filters.skinType}>
        {facets.skinTypes.map((s) => (
          <CheckRow
            key={s.id}
            label={locale === "el" ? s.nameEl : s.name}
            checked={draft.skinType.includes(s.slug)}
            onChange={() => onToggle("skinType", s.slug)}
          />
        ))}
      </FilterGroup>

      {facets.productTypes.length > 0 ? (
        <FilterGroup title={dict.filters.productType}>
          {facets.productTypes.map((t) => (
            <CheckRow
              key={t}
              label={productTypeLabel(dict, t)}
              checked={draft.type.includes(t)}
              onChange={() => onToggle("type", t)}
            />
          ))}
        </FilterGroup>
      ) : null}

      <FilterGroup title={dict.filters.availability}>
        <CheckRow
          label={dict.filters.inStock}
          checked={draft.available}
          onChange={() => onFlag("available", !draft.available)}
        />
      </FilterGroup>

      {showOffersFilter ? (
        <FilterGroup title={dict.filters.offers}>
          <CheckRow
            label={dict.filters.onSale}
            checked={draft.offers}
            onChange={() => onFlag("offers", !draft.offers)}
          />
        </FilterGroup>
      ) : null}
    </div>
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
    <div className="border-b border-oak/25 pb-7 last:border-b-0 last:pb-0">
      <p className="text-[10px] uppercase tracking-[0.18em] text-ink-muted">
        {title}
      </p>
      <div className="mt-3.5 space-y-1">{children}</div>
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
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 px-1 py-2 text-sm transition-colors",
        checked ? "text-ink" : "text-ink-muted hover:text-ink"
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center border transition-colors",
          checked
            ? "border-sage bg-sage font-bold text-white"
            : "border-oak/55 bg-bg"
        )}
        aria-hidden
      >
        {checked ? <Check className="h-2.5 w-2.5" strokeWidth={2.5} /> : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span className="leading-snug">{label}</span>
    </label>
  );
}
