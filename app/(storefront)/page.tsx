import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/features/products/components/product-card";
import { ProductGrid } from "@/features/products/components/product-grid";
import { KBeautyJourney } from "@/components/home/k-beauty-journey";
import { RealReviews } from "@/components/home/real-reviews";
import { FollowUs } from "@/components/home/follow-us";
import { HomeHeroCarousel } from "@/components/home/home-hero-carousel";
import {
  findProducts,
  findFeaturedBrands,
  findFeaturedReviews,
  findSkinTypes,
} from "@/server/repositories/product.repository";
import {
  findActiveHeroSlides,
  getHeroCarouselSettings,
  type HeroSlideView,
} from "@/server/repositories/hero.repository";
import { brand } from "@/lib/constants";
import { getLocale, getServerDictionary } from "@/lib/i18n/server";

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
  let soYoungChoice = bestSellers;
  let featuredBrands: Awaited<ReturnType<typeof findFeaturedBrands>> = [];
  let skinTypes: Awaited<ReturnType<typeof findSkinTypes>> = [];
  let featuredReviews: Awaited<ReturnType<typeof findFeaturedReviews>> = [];
  let heroSlides: HeroSlideView[] = [];
  let heroSettings = { autoplay: true, intervalSeconds: 6 };

  try {
    [
      bestSellers,
      newIn,
      soYoungChoice,
      featuredBrands,
      skinTypes,
      featuredReviews,
      heroSlides,
      heroSettings,
    ] = await Promise.all([
      findProducts({ bestSeller: true, pageSize: 8 }),
      findProducts({ sort: "newest", pageSize: 8 }),
      findProducts({ featured: true, pageSize: 8 }),
      findFeaturedBrands(6),
      findSkinTypes(),
      findFeaturedReviews(3),
      findActiveHeroSlides(locale),
      getHeroCarouselSettings(),
    ]);
  } catch (error) {
    console.error("[home] Catalog query failed — check DATABASE_URL / Neon:", error);
  }

  // Shown when no slides are configured in the admin, so phones and desktop
  // get the same hero layout either way.
  const fallbackHeroSlide: HeroSlideView = {
    id: "fallback",
    type: "CAMPAIGN",
    imageUrl: "/images/hero.jpg",
    imageAlt: dict.home.heroAlt,
    eyebrow: dict.home.eyebrow,
    headline: dict.home.headlineLead,
    headlineAccent: dict.home.headlineTrail,
    subhead: dict.home.subhead,
    ctaPrimaryLabel: dict.home.heroCta,
    ctaPrimaryHref: "/best-sellers",
    ctaSecondaryLabel: dict.home.heroQuizCta,
    ctaSecondaryHref: "/skin-type",
    product: null,
  };

  const categories = [
    {
      name: dict.home.routineCleansers,
      href: `/skincare?type=${encodeURIComponent("Water Cleanser")}`,
      image: "/images/category-skincare.jpg",
    },
    {
      name: dict.home.routineToners,
      href: `/skincare?type=${encodeURIComponent("Toner")}`,
      image: "/images/category-skincare.jpg",
    },
    {
      name: dict.home.routineEssence,
      href: `/skincare?type=${encodeURIComponent("Essence")}`,
      image: "/images/category-skincare.jpg",
    },
    {
      name: dict.home.routineMoisturizers,
      href: `/skincare?type=${encodeURIComponent("Moisturizer")}`,
      image: "/images/category-makeup.jpg",
    },
    {
      name: dict.home.routineSunscreen,
      href: `/skincare?type=${encodeURIComponent("Sunscreen")}`,
      image: "/images/category-body.jpg",
    },
    {
      name: dict.home.routineMasks,
      href: `/skincare?type=${encodeURIComponent("Sheet Mask")}`,
      image: "/images/category-haircare.jpg",
    },
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

  const choiceProducts =
    soYoungChoice.products.length > 0
      ? soYoungChoice.products
      : bestSellers.products;

  const homeReviews = featuredReviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    brand: review.product.brand.name,
    productName: review.product.name,
    productSlug: review.product.slug,
    productImage:
      review.product.images[0]?.url ?? "/images/placeholder-product.svg",
  }));

  return (
    <>
      <HomeHeroCarousel
        slides={heroSlides.length > 0 ? heroSlides : [fallbackHeroSlide]}
        settings={heroSettings}
        labels={{
          previous: dict.home.heroPrevious,
          next: dict.home.heroNext,
          goToSlide: dict.home.heroGoToSlide,
          onSale: dict.home.heroOnSale,
        }}
      />

      <KBeautyJourney
        bestSellers={bestSellers.products}
        newIn={newIn.products}
        choice={choiceProducts}
      />

      <section className="container-page py-20 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-[1.85rem] leading-tight tracking-tight text-ink sm:text-[2.35rem]">
            {dict.home.shopByCategory}
          </h2>
          <p className="mt-3 text-[15px] leading-[1.7] text-ink-muted">
            {dict.home.categorySubhead}
          </p>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6 lg:gap-3">
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
                className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 16vw"
              />
              <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-ink/80 via-ink/35 to-transparent transition-opacity duration-500 ease-out group-hover:opacity-90 sm:h-full sm:from-ink/70 sm:via-ink/20" />
              <div className="absolute inset-x-0 bottom-0 px-3.5 pb-3.5 sm:p-5 lg:p-4">
                <span className="flex items-end justify-between gap-2">
                  <span className="min-w-0 font-(family-name:--font-garamond-greek) text-[1.35rem] font-bold leading-[1.1] tracking-[0.02em] text-bg [text-shadow:0_1px_12px_rgba(28,27,26,0.35)] min-[400px]:text-[1.45rem] sm:text-[1.65rem] lg:text-[1.45rem]">
                    {cat.name}
                  </span>
                  <ArrowRight
                    className="mb-1 hidden h-3.5 w-3.5 shrink-0 text-bg/55 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1 group-hover:text-bg sm:block"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </span>
              </div>
            </Link>
          ))}
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

      <RealReviews
        headline={dict.home.reviewsHeadline}
        shopLabel={dict.home.reviewsShop}
        reviews={homeReviews}
      />

      <FollowUs
        headline={dict.home.followUsHeadline}
        subhead={dict.home.followUsSubhead}
        action={dict.home.followUsAction}
      />
    </>
  );
}
