"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n/use-translation";

type Brand = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  count: number;
};

export function BrandDirectory({ brands }: { brands: Brand[] }) {
  const { dict, t } = useTranslation();
  const [q, setQ] = useState("");
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return brands.filter((b) =>
      query ? b.name.toLowerCase().includes(query) : true
    );
  }, [brands, q]);

  const grouped = useMemo(() => {
    const map = new Map<string, Brand[]>();
    for (const b of filtered) {
      const letter = b.name.charAt(0).toUpperCase();
      const key = /[A-Z]/.test(letter) ? letter : "#";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return map;
  }, [filtered]);

  return (
    <div className="mt-8">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={dict.brands.searchPlaceholder}
        aria-label={dict.brands.searchPlaceholder}
        className="max-w-md"
      />

      <div className="mt-6 flex flex-wrap gap-2">
        {letters.map((l) => (
          <a
            key={l}
            href={`#brand-${l}`}
            className={`text-sm ${
              grouped.has(l) ? "text-ink hover:underline" : "text-oak"
            }`}
          >
            {l}
          </a>
        ))}
      </div>

      <div className="mt-10 space-y-10">
        {[...grouped.entries()].map(([letter, list]) => (
          <section key={letter} id={`brand-${letter}`}>
            <h2 className="font-serif text-2xl text-ink">{letter}</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/brands/${b.slug}`}
                    className="flex items-center gap-4 border border-oak/30 bg-bg-muted px-4 py-3 transition-colors hover:border-oak"
                  >
                    <div className="relative h-10 w-10 overflow-hidden">
                      <Image
                        src={b.logo ?? "/images/placeholder-brand.svg"}
                        alt=""
                        fill
                        className="object-contain"
                        sizes="40px"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-ink">{b.name}</p>
                      <p className="text-xs text-ink-muted">
                        {t((d) => d.brands.productsCount, { count: b.count })}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
