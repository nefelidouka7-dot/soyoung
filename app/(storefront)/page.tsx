import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/features/products/components/product-card";
import { ProductGrid } from "@/features/products/components/product-grid";
import {
  findProducts,
  findFeaturedBrands,
  findSkinTypes,
} from "@/server/repositories/product.repository";
import { brand } from "@/lib/constants";
import { interpolate } from "@/lib/i18n";
import { getLocale, getServerDictionary } from "@/lib/i18n/server";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/utils";

export default async function HomePage() {
  const dict = await getServerDictionary();
  const locale = await getLocale();

  let bestSellers: Awaited<ReturnType<typeof findProducts>> = {
    total: 0,
    page: 1,
    pageSize: 8,
    totalPages: 0,
    products: [],
  };
  let newIn = bestSellers;
  let featuredBrands: Awaited<ReturnType<typeof findFeaturedBrands>> = [];
  let skinTypes: Awaited<ReturnType<typeof findSkinTypes>> = [];

  try {
    [bestSellers, newIn, featuredBrands, skinTypes] = await Promise.all([
      findProducts({ bestSeller: true, pageSize: 8 }),
      findProducts({ sort: "newest", pageSize: 8 }),
      findFeaturedBrands(6),
      findSkinTypes(),
    ]);
  } catch (error) {
    console.error("[home] Catalog query failed — check DATABASE_URL / Neon:", error);
  }

  const categories = [
    {
      name: dict.home.catSkincare,
      href: "/skincare",
      image: "/images/category-skincare.jpg",
    },
    {
      name: dict.home.catMakeup,
      href: "/makeup",
      image: "/images/category-makeup.jpg",
    },
    {
      name: dict.home.catHaircare,
      href: "/haircare",
      image: "/images/category-haircare.jpg",
    },
    {
      name: dict.home.catBody,
      href: "/body",
      image: "/images/category-body.jpg",
    },
  ];

  const freeShippingFrom = formatPrice(FREE_SHIPPING_THRESHOLD).replace(
    /[.,]00$/,
    ""
  );
  const uspPoints = [
    interpolate(dict.home.uspShipping, { amount: freeShippingFrom }),
    dict.home.uspDelivery,
    dict.home.uspReturns,
  ];

  const skinCards =
    skinTypes.length > 0
      ? skinTypes.map((s) => ({
          slug: s.slug,
          name: locale === "el" ? s.nameEl : s.name,
        }))
      : brand.skinTypes.map((s) => ({
          slug: s.slug,
          name: locale === "el" ? s.nameEl : s.name,
        }));

  return (
    <>
      <section className="relative isolate overflow-hidden bg-bg">
        <Image
          src="/images/hero.jpg"
          alt={dict.home.heroAlt}
          fill
          priority
          className="animate-hero-zoom object-cover object-[82%_38%] sm:object-[70%_48%] lg:object-[62%_46%]"
          sizes="100vw"
        />
        <div className="hero-veil pointer-events-none absolute inset-0" aria-hidden />
        <div className="hero-grain pointer-events-none absolute inset-0" aria-hidden />

        <div className="container-page relative flex min-h-[min(86svh,38rem)] flex-col justify-end pb-8 pt-24 sm:min-h-[88svh] sm:justify-center sm:pb-20 sm:pt-28 lg:min-h-[min(90svh,46rem)]">
          <div className="w-full max-w-[22rem] sm:max-w-[34rem]">
            <div className="animate-home-rise flex items-center gap-3">
              <span className="h-px w-8 bg-oak sm:w-14" aria-hidden />
              <p className="text-[10px] uppercase tracking-[0.26em] text-ink-muted sm:tracking-[0.32em]">
                {dict.home.eyebrow}
              </p>
            </div>

            <h1 className="animate-home-rise-d1 mt-4 font-serif text-[clamp(2.35rem,11vw,3.4rem)] leading-[1.02] tracking-[-0.025em] text-ink sm:mt-7 sm:text-[clamp(2.6rem,7vw,4.75rem)] sm:leading-[0.98]">
              <span className="block">{dict.home.headlineLead}</span>
              <span className="mt-1 block italic text-sage-dark">
                {dict.home.headlineTrail}
              </span>
            </h1>

            <p className="animate-home-rise-d2 mt-4 max-w-[30ch] text-[14px] leading-[1.7] text-ink-muted sm:mt-7 sm:max-w-[34ch] sm:text-base sm:leading-[1.8]">
              {dict.home.subhead}
            </p>

            <div className="animate-home-rise-d3 mt-7 flex flex-col gap-2.5 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <Link
                href="/skincare"
                className="group inline-flex h-12 w-full items-center justify-center gap-2.5 bg-sage px-7 text-[11px] uppercase tracking-[0.16em] text-bg shadow-[0_14px_34px_-16px_rgba(43,41,39,0.55)] transition-colors hover:bg-sage-dark sm:w-auto"
              >
                {dict.home.heroCta}
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:translate-x-1"
                  strokeWidth={1.75}
                />
              </Link>
              <Link
                href="/skin-type"
                className="inline-flex h-12 min-h-12 w-full shrink-0 items-center justify-center border border-ink/20 bg-bg/70 px-6 text-[11px] uppercase tracking-[0.16em] text-ink backdrop-blur-[2px] transition-colors hover:border-ink/40 hover:bg-bg/80 sm:w-auto sm:bg-bg/55"
              >
                {dict.nav.findForMySkin}
              </Link>
            </div>

            <ul className="animate-home-rise-d3 mt-8 space-y-2.5 sm:hidden">
              {uspPoints.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-2.5 text-[10px] uppercase tracking-[0.14em] text-ink-muted"
                >
                  <span
                    className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-oak"
                    aria-hidden
                  />
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>

            <span
              className="animate-home-rise-d3 mt-14 hidden h-14 w-px overflow-hidden bg-oak/50 lg:flex"
              aria-hidden
            >
              <span className="animate-hero-cue block h-5 w-px bg-ink/55" />
            </span>
          </div>
        </div>

        <div className="relative hidden border-t border-ink/[0.12] bg-bg/80 backdrop-blur-[3px] sm:block">
          <ul className="container-page flex justify-between gap-x-10 py-5 text-[11px] uppercase tracking-[0.22em] text-ink-muted">
            {uspPoints.map((point) => (
              <li
                key={point}
                className="flex shrink-0 items-center gap-3 whitespace-nowrap"
              >
                <span className="h-1 w-1 rounded-full bg-oak" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page py-20 lg:py-28">
        <div className="flex max-w-xl flex-col gap-3">
          <h2 className="font-serif text-[2rem] leading-tight text-ink sm:text-[2.35rem]">
            {dict.home.shopByCategory}
          </h2>
          <p className="text-[15px] leading-[1.7] text-ink-muted">
            {dict.home.categorySubhead}
          </p>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {categories.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="group relative aspect-[3/4] overflow-hidden bg-bg-muted"
            >
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
                sizes="(max-width:768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-ink/[0.08] to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-4 font-serif text-[1.65rem] leading-none text-bg sm:p-5 sm:text-[1.85rem]">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section id="best-sellers" className="bg-bg-muted/80 py-20 lg:py-28">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-md">
              <h2 className="font-serif text-[2rem] leading-tight text-ink sm:text-[2.35rem]">
                {dict.home.bestSellers}
              </h2>
              <p className="mt-3 text-[15px] leading-[1.7] text-ink-muted">
                {dict.home.bestSellersSubhead}
              </p>
            </div>
            <Link
              href="/skincare?sort=recommended"
              className="text-[11px] uppercase tracking-[0.16em] text-ink-muted underline decoration-oak/50 underline-offset-[5px] transition-colors hover:text-ink hover:decoration-ink/40"
            >
              {dict.home.viewAll}
            </Link>
          </div>
          <div className="mt-10 sm:mt-12">
            <ProductGrid>
              {bestSellers.products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </ProductGrid>
          </div>
        </div>
      </section>

      <section className="container-page py-20 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-md">
            <h2 className="font-serif text-[2rem] leading-tight text-ink sm:text-[2.35rem]">
              {dict.home.newIn}
            </h2>
            <p className="mt-3 text-[15px] leading-[1.7] text-ink-muted">
              {dict.home.newInSubhead}
            </p>
          </div>
          <Link
            href="/new-in"
            className="text-[11px] uppercase tracking-[0.16em] text-ink-muted underline decoration-oak/50 underline-offset-[5px] transition-colors hover:text-ink hover:decoration-ink/40"
          >
            {dict.home.viewAll}
          </Link>
        </div>
        <div className="mt-10 sm:mt-12">
          <ProductGrid>
            {newIn.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ProductGrid>
        </div>
      </section>

      <section className="border-y border-oak/25 bg-bg-muted/50 py-20 lg:py-28">
        <div className="container-page">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-serif text-[2rem] leading-tight text-ink sm:text-[2.35rem]">
              {dict.home.skinHeadline}
            </h2>
            <p className="mt-4 text-[15px] leading-[1.7] text-ink-muted">
              {dict.home.skinSubhead}
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden border border-oak/30 bg-oak/30 sm:grid-cols-3 lg:grid-cols-5">
            {skinCards.map((st) => (
              <Link
                key={st.slug}
                href={`/skin-type?type=${st.slug}`}
                className="group flex min-h-[8rem] flex-col justify-between bg-bg px-5 py-6 transition-colors hover:bg-bg-muted"
              >
                <span className="font-serif text-[1.65rem] leading-none text-ink">
                  {st.name}
                </span>
                <span className="mt-6 text-[10px] uppercase tracking-[0.18em] text-ink-muted transition-colors group-hover:text-ink">
                  {dict.home.explore}
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/skin-type"
              className="inline-flex h-11 items-center border border-ink/15 px-7 text-[11px] uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink/35"
            >
              {dict.home.takeSkinQuiz}
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-20 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-md">
            <h2 className="font-serif text-[2rem] leading-tight text-ink sm:text-[2.35rem]">
              {dict.home.shopByBrand}
            </h2>
            <p className="mt-3 text-[15px] leading-[1.7] text-ink-muted">
              {dict.home.brandSubhead}
            </p>
          </div>
          <Link
            href="/brands"
            className="text-[11px] uppercase tracking-[0.16em] text-ink-muted underline decoration-oak/50 underline-offset-[5px] transition-colors hover:text-ink hover:decoration-ink/40"
          >
            {dict.home.viewAll}
          </Link>
        </div>
        <ul className="mt-12 grid grid-cols-2 divide-x divide-y divide-oak/30 border-y border-oak/30 sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
          {featuredBrands.map((b) => (
            <li key={b.id}>
              <Link
                href={`/brands/${b.slug}`}
                className="flex h-24 items-center justify-center px-3 text-center font-serif text-lg text-ink transition-opacity hover:opacity-55 sm:h-28 sm:text-xl"
              >
                {b.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-oak/20 bg-bg-muted/80">
        <div className="container-page grid items-center gap-12 py-20 lg:grid-cols-2 lg:gap-20 lg:py-28">
          <div>
            <h2 className="max-w-[16ch] font-serif text-[2rem] leading-[1.1] text-ink sm:text-[2.5rem]">
              {dict.home.promoHeadline}
            </h2>
            <p className="mt-5 max-w-[34ch] text-[15px] leading-[1.7] text-ink-muted">
              {dict.home.promoBody}
            </p>
            <Link
              href="/skincare"
              className="mt-10 inline-flex h-11 items-center bg-sage px-7 text-[11px] uppercase tracking-[0.14em] text-bg transition-colors hover:bg-sage-dark"
            >
              {dict.home.exploreSkincare}
            </Link>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden bg-bg sm:aspect-[5/4]">
            <Image
              src="/images/promo.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="(max-width:1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>
    </>
  );
}
