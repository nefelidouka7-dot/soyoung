"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductCard, type ProductCardData } from "@/features/products/components/product-card";
import { ProductGrid } from "@/features/products/components/product-grid";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";

type TabId = "best-sellers" | "new" | "choice";

type Props = {
  bestSellers: ProductCardData[];
  newIn: ProductCardData[];
  choice: ProductCardData[];
};

export function KBeautyJourney({ bestSellers, newIn, choice }: Props) {
  const { dict } = useTranslation();
  const [tab, setTab] = useState<TabId>("best-sellers");

  const tabs: { id: TabId; label: string; href: string; products: ProductCardData[] }[] =
    [
      {
        id: "best-sellers",
        label: dict.home.journeyBestSellers,
        href: "/best-sellers",
        products: bestSellers,
      },
      {
        id: "new",
        label: dict.home.journeyNew,
        href: "/new-in",
        products: newIn,
      },
      {
        id: "choice",
        label: dict.home.journeyChoice,
        href: "/skincare?sort=recommended",
        products: choice.length > 0 ? choice : bestSellers,
      },
    ];

  const active = tabs.find((t) => t.id === tab) ?? tabs[0];

  return (
    <section className="container-page py-16 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-serif text-[1.85rem] leading-[1.15] tracking-tight text-ink sm:text-[2.35rem] lg:text-[2.65rem]">
          {dict.home.journeyHeadline}
        </h2>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:mt-10 sm:gap-x-10">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "relative pb-2 text-[12px] font-semibold tracking-[0.04em] transition-colors sm:text-[13px]",
              tab === item.id
                ? "text-ink"
                : "text-ink/40 hover:text-ink/70"
            )}
          >
            {item.label}
            <span
              className={cn(
                "absolute inset-x-0 bottom-0 h-px origin-center bg-ink transition-transform duration-300",
                tab === item.id ? "scale-x-100" : "scale-x-0"
              )}
              aria-hidden
            />
          </button>
        ))}
      </div>

      {active.products.length > 0 ? (
        <div className="mt-10 sm:mt-12">
          <ProductGrid>
            {active.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ProductGrid>
        </div>
      ) : null}

      <div className="mt-10 flex justify-center sm:mt-12">
        <Link
          href={active.href}
          className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink underline decoration-oak/50 underline-offset-[5px] transition-colors hover:decoration-ink/40"
        >
          {dict.home.viewAll}
        </Link>
      </div>
    </section>
  );
}
