"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { useUIStore } from "@/lib/ui-store";
import { cn, formatPrice } from "@/lib/utils";
import { searchCatalog } from "@/features/search/actions";
import { useTranslation } from "@/lib/i18n/use-translation";

type SearchResult = {
  products: Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    brand: string;
    image: string;
  }>;
  brands: Array<{ id: string; name: string; slug: string }>;
  categories: Array<{ id: string; name: string; slug: string }>;
};

const POPULAR = ["serum", "cleanser", "spf", "moisturizer", "lip oil"];

export function SearchOverlay() {
  const { dict, t } = useTranslation();
  const open = useUIStore((s) => s.searchOpen);
  const close = useUIStore((s) => s.closeSearch);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const stored = localStorage.getItem("soyoung-recent-searches");
    if (stored) setRecent(JSON.parse(stored) as string[]);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
      return;
    }
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    const t = setTimeout(() => {
      startTransition(async () => {
        const data = await searchCatalog(query.trim());
        setResults(data);
      });
    }, 200);
    return () => clearTimeout(t);
  }, [query, open]);

  function remember(q: string) {
    const next = [q, ...recent.filter((r) => r !== q)].slice(0, 6);
    setRecent(next);
    localStorage.setItem("soyoung-recent-searches", JSON.stringify(next));
  }

  const hasResults = useMemo(
    () =>
      results &&
      (results.products.length > 0 ||
        results.brands.length > 0 ||
        results.categories.length > 0),
    [results]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal>
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        aria-label={dict.search.close}
        onClick={close}
      />
      <div className="relative mx-auto mt-0 max-h-[90vh] w-full max-w-3xl overflow-hidden bg-bg animate-rise sm:mt-16 sm:rounded-sm">
        <div className="flex items-center gap-3 border-b border-oak/40 px-4 py-4 sm:px-6">
          <Search className="h-5 w-5 shrink-0 text-ink-muted" strokeWidth={1.5} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.search.placeholder}
            className="w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-muted"
            aria-label={dict.search.placeholder}
          />
          <button
            type="button"
            onClick={close}
            aria-label={dict.search.close}
            className="inline-flex h-9 w-9 items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-4 py-5 sm:px-6">
          {query.trim().length < 2 ? (
            <div className="space-y-6">
              {recent.length > 0 ? (
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-muted">
                    {dict.search.recent}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {recent.map((r) => (
                      <li key={r}>
                        <button
                          type="button"
                          className="border border-oak/50 bg-bg-muted px-3 py-1.5 text-sm"
                          onClick={() => setQuery(r)}
                        >
                          {r}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-muted">
                  {dict.search.popular}
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {POPULAR.map((r) => (
                    <li key={r}>
                      <button
                        type="button"
                        className="border border-oak/50 bg-bg-muted px-3 py-1.5 text-sm"
                        onClick={() => setQuery(r)}
                      >
                        {r}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : pending && !results ? (
            <p className="py-8 text-sm text-ink-muted">{dict.search.searching}</p>
          ) : !hasResults ? (
            <p className="py-8 text-sm text-ink-muted">
              {t((d) => d.search.noResults, { query })}
            </p>
          ) : (
            <div className="space-y-8">
              {results!.categories.length > 0 ? (
                <section>
                  <p className="text-xs uppercase tracking-wider text-ink-muted">
                    {dict.search.categories}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {results!.categories.map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/${c.slug}`}
                          onClick={() => {
                            remember(query);
                            close();
                          }}
                          className="block py-2 text-sm hover:text-sage-dark"
                        >
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {results!.brands.length > 0 ? (
                <section>
                  <p className="text-xs uppercase tracking-wider text-ink-muted">
                    {dict.search.brands}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {results!.brands.map((b) => (
                      <li key={b.id}>
                        <Link
                          href={`/brands/${b.slug}`}
                          onClick={() => {
                            remember(query);
                            close();
                          }}
                          className="block py-2 text-sm hover:text-sage-dark"
                        >
                          {b.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {results!.products.length > 0 ? (
                <section>
                  <p className="text-xs uppercase tracking-wider text-ink-muted">
                    {dict.search.products}
                  </p>
                  <ul className="mt-3 space-y-3">
                    {results!.products.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/product/${p.slug}`}
                          onClick={() => {
                            remember(query);
                            close();
                          }}
                          className="flex items-center gap-3 py-1"
                        >
                          <div className="relative h-14 w-12 overflow-hidden bg-bg-muted">
                            <Image
                              src={p.image}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] uppercase tracking-wider text-ink-muted">
                              {p.brand}
                            </p>
                            <p className="truncate text-sm">{p.name}</p>
                            <p className="text-sm">{formatPrice(p.price)}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
