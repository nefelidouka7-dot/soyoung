"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";

export type ProductSearchOption = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  imageUrl: string | null;
  price: number;
  compareAtPrice: number | null;
};

type Props = {
  name?: string;
  products: ProductSearchOption[];
  value: string;
  onChange: (productId: string) => void;
  placeholder?: string;
  required?: boolean;
};

export function ProductSearchPicker({
  name = "productId",
  products,
  value,
  onChange,
  placeholder = "Αναζήτηση με όνομα ή κωδικό…",
  required,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => προϊόντα.find((p) => p.id === value) ?? null,
    [products, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return προϊόντα.slice(0, 80);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.sku?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 80);
  }, [products, query]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  function selectProduct(id: string) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  function clear() {
    onChange("");
    setQuery("");
    setOpen(true);
  }

  return (
    <div ref={rootRef} className="relative mt-1.5">
      <input type="hidden" name={name} value={value} />
      {required && !value ? (
        <input
          tabIndex={-1}
          className="sr-only"
          required
          value=""
          onChange={() => {}}
          aria-hidden
        />
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={listId}
        className={cn(
          "flex min-h-12 w-full items-center gap-2.5 border border-oak/50 bg-white px-2.5 py-1.5 text-left text-sm transition-colors",
          open && "ring-2 ring-coral"
        )}
      >
        {selected ? (
          <ProductThumb src={selected.imageUrl} alt="" />
        ) : (
          <Search className="ml-1 h-4 w-4 shrink-0 text-ink-muted" strokeWidth={1.75} />
        )}
        <span className="min-w-0 flex-1">
          {selected ? (
            <>
              <span className="block truncate font-medium text-ink">
                {selected.name}
              </span>
              <span className="mt-0.5 block truncate text-xs text-ink-muted">
                {selected.sku ? `Κωδ. ${selected.sku} · ` : ""}
                {selected.compareAtPrice != null &&
                selected.compareAtPrice > selected.price
                  ? `sale ${formatPrice(selected.price)}`
                  : formatPrice(selected.price)}
              </span>
            </>
          ) : (
            <span className="text-ink-muted">Διάλεξε προϊόν…</span>
          )}
        </span>
        {selected ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              clear();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                clear();
              }
            }}
            className="inline-flex h-6 w-6 items-center justify-center rounded text-ink-muted hover:bg-ink/[0.05] hover:text-ink"
            aria-label="Καθαρισμός προϊόντος"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.75} />
          </span>
        ) : (
          <ChevronsUpDown
            className="mr-0.5 h-4 w-4 shrink-0 text-ink-muted"
            strokeWidth={1.75}
          />
        )}
      </button>

      {open ? (
        <div
          id={listId}
          className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-lg border border-ink/10 bg-white shadow-[0_12px_40px_-16px_rgba(28,25,23,0.35)]"
        >
          <div className="border-b border-oak/30 p-2">
            <div className="flex items-center gap-2 rounded-md border border-oak/40 bg-bg px-2.5">
              <Search
                className="h-3.5 w-3.5 shrink-0 text-ink-muted"
                strokeWidth={1.75}
              />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="h-9 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted/70"
                autoComplete="off"
              />
            </div>
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-ink-muted">
                Κανένα προϊόν δεν ταιριάζει με “{query.trim()}”
              </li>
            ) : (
              filtered.map((p) => {
                const active = p.id === value;
                const onSale =
                  p.compareAtPrice != null && p.compareAtPrice > p.price;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => selectProduct(p.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition-colors",
                        active ? "bg-oak-soft/70" : "hover:bg-bg-muted"
                      )}
                    >
                      <ProductThumb src={p.imageUrl} alt="" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium text-ink">
                            {p.name}
                          </span>
                          {active ? (
                            <Check
                              className="h-3.5 w-3.5 shrink-0 text-ink"
                              strokeWidth={2}
                            />
                          ) : null}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-ink-muted">
                          {p.sku ? (
                            <span className="font-medium text-ink/70">
                              {p.sku}
                            </span>
                          ) : (
                            <span className="text-ink-muted/70">Χωρίς κωδικό</span>
                          )}
                          <span className="text-ink-muted/70">
                            {" · "}
                            {onSale
                              ? `${formatPrice(p.price)} (was ${formatPrice(p.compareAtPrice!)})`
                              : formatPrice(p.price)}
                          </span>
                        </span>
                      </span>
                      {onSale ? (
                        <span className="shrink-0 rounded bg-coral/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-coral">
                          Sale
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          {query.trim() === "" && προϊόντα.length > 80 ? (
            <p className="border-t border-oak/25 px-3 py-2 text-[11px] text-ink-muted">
              Εμφάνιση πρώτων 80 — πληκτρολόγησε όνομα ή κωδικό για όλα τα{" "}
              {products.length} προϊόντα.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ProductThumb({ src, alt }: { src: string | null; alt: string }) {
  return (
    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-oak/30 bg-bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src || "/images/placeholder-product.svg"}
        alt={alt}
        className="h-full w-full object-cover"
      />
    </span>
  );
}
