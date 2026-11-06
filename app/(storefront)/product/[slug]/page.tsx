import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import {
  findProductBySlug,
  findProducts,
} from "@/server/repositories/product.repository";
import { ProductPurchasePanel } from "@/features/products/components/product-purchase-panel";
import { ProductAccordion } from "@/features/products/components/product-accordion";
import { ProductReel } from "@/features/products/components/product-reel";
import { ProductCard } from "@/features/products/components/product-card";
import { ProductGrid } from "@/features/products/components/product-grid";
import { absoluteUrl, STORE_NAME } from "@/lib/utils";
import { serializeJsonLd } from "@/lib/json-ld";
import { getLocale, getServerDictionary } from "@/lib/i18n/server";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await findProductBySlug(slug);
  if (!product) return { title: "Product" };
  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.shortDescription ?? undefined,
    openGraph: {
      title: product.name,
      description: product.shortDescription ?? undefined,
      images: product.images[0] ? [{ url: product.images[0].url }] : [],
    },
    alternates: { canonical: absoluteUrl(`/product/${product.slug}`) },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, dict, locale] = await Promise.all([
    findProductBySlug(slug),
    getServerDictionary(),
    getLocale(),
  ]);
  if (!product) notFound();

  const categorySlug = product.category.parent?.slug ?? product.category.slug;
  const categoryName = product.category.parent?.name ?? product.category.name;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand.name },
    image: product.images.map((i) => absoluteUrl(i.url)),
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: Number(product.price),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: absoluteUrl(`/product/${product.slug}`),
    },
  };

  const sections = [
    { title: dict.product.description, content: product.description },
    { title: dict.product.ingredients, content: product.ingredients },
    { title: dict.product.howToUse, content: product.howToUse },
    {
      title: dict.product.shippingReturns,
      content: dict.product.shippingReturnsBody,
    },
  ];

  const facts = [
    { label: dict.product.brand, value: product.brand.name, href: `/brands/${product.brand.slug}` },
    product.productType ? { label: dict.product.type, value: product.productType } : null,
    product.volume ? { label: dict.product.volume, value: product.volume } : null,
    product.weight ? { label: "Weight", value: product.weight } : null,
    product.sku ? { label: "SKU", value: product.sku } : null,
  ].filter((f): f is { label: string; value: string; href?: string } => f !== null);

  return (
    <div className="pb-16 lg:pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <div className="container-page pt-6 lg:pt-10">
        <nav
          className="mb-6 text-[11px] uppercase tracking-[0.14em] text-ink-muted lg:mb-10"
          aria-label="Breadcrumb"
        >
          <ol className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <li>
              <Link href="/" className="transition-colors hover:text-ink">
                {dict.listing.home}
              </Link>
            </li>
            <li aria-hidden className="h-px w-3 bg-oak" />
            <li>
              <Link href={`/${categorySlug}`} className="transition-colors hover:text-ink">
                {categoryName}
              </Link>
            </li>
            <li aria-hidden className="h-px w-3 bg-oak" />
            <li className="max-w-[14rem] truncate normal-case tracking-normal text-ink sm:max-w-none">
              {product.name}
            </li>
          </ol>
        </nav>

        <ProductPurchasePanel
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            brand: product.brand.name,
            brandSlug: product.brand.slug,
            price: Number(product.price),
            compareAtPrice: product.compareAtPrice
              ? Number(product.compareAtPrice)
              : null,
            shortDescription: product.shortDescription,
            stock: product.stock,
            images: product.images,
            variants: product.variants.map((v) => ({
              id: v.id,
              name: v.name,
              type: v.type,
              price: v.price ? Number(v.price) : null,
              stock: v.stock,
              image: v.image,
            })),
            skinTypes: product.skinTypes.map((s) =>
              locale === "el" ? s.skinType.nameEl : s.skinType.name
            ),
          }}
        />
      </div>

      <section className="mt-16 border-y border-oak/30 bg-bg-muted/50 py-16 lg:mt-24 lg:py-24">
        <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-coral" aria-hidden />
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sage">
                {dict.product.aboutEyebrow}
              </p>
            </div>
            <h2 className="mt-4 font-serif text-[2.2rem] leading-[1.05] tracking-tight text-ink sm:text-[2.6rem]">
              {dict.product.aboutTitle}
            </h2>

            {facts.length > 0 ? (
              <div className="mt-8 rounded-sm bg-bg p-6 ring-1 ring-oak/40">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
                  {dict.product.keyFacts}
                </p>
                <dl className="mt-4 divide-y divide-oak/30">
                  {facts.map((f) => (
                    <div key={f.label} className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <dt className="text-[13px] text-ink-muted">{f.label}</dt>
                      <dd className="text-right text-[14px] text-ink">
                        {f.href ? (
                          <Link href={f.href} className="underline-offset-4 hover:underline">
                            {f.value}
                          </Link>
                        ) : (
                          f.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </div>

          <ProductAccordion
            items={sections
              .filter((s) => Boolean(s.content))
              .map((s) => ({
                id: s.title,
                title: s.title,
                defaultOpen: s.title === dict.product.description,
                content: (
                  <div className="max-w-2xl whitespace-pre-line text-[15px] leading-[1.8] text-ink-muted">
                    {s.content}
                  </div>
                ),
              }))}
          />
        </div>
      </section>

      {product.videoUrl ? (
        <ProductReel
          src={product.videoUrl}
          poster={
            product.videoPosterUrl ?? product.images[0]?.url ?? null
          }
          productName={product.name}
          brandName={product.brand.name}
          eyebrow={dict.product.watchReelEyebrow}
          title={dict.product.watchReel}
          support={dict.product.watchReelSupport}
          followCta={dict.product.followOnInstagram}
        />
      ) : null}

      {/* Streams in after the product itself, so it never delays the page. */}
      <Suspense fallback={null}>
        <RelatedProducts
          productId={product.id}
          categorySlug={categorySlug}
          title={dict.product.youMayAlsoLike}
          moreFrom={dict.product.moreFrom}
        />
      </Suspense>

      <p className="sr-only">{STORE_NAME}</p>
    </div>
  );
}

async function RelatedProducts({
  productId,
  categorySlug,
  title,
  moreFrom,
}: {
  productId: string;
  categorySlug: string;
  title: string;
  moreFrom: string;
}) {
  const related = await findProducts({ categorySlug, pageSize: 5 })
    .then((r) => r.products.filter((p) => p.id !== productId).slice(0, 4))
    .catch(() => []);
  if (related.length === 0) return null;

  return (
    <section className="container-page mt-16 lg:mt-24">
      <div className="mb-8 flex items-end justify-between gap-6 lg:mb-10">
        <h2 className="font-serif text-[2rem] leading-none tracking-tight text-ink sm:text-[2.6rem]">
          {title}
        </h2>
        <Link
          href={`/${categorySlug}`}
          className="group inline-flex shrink-0 items-center gap-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-ink"
        >
          {moreFrom}
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
            strokeWidth={1.5}
            aria-hidden
          />
        </Link>
      </div>
      <ProductGrid variant="featured">
        {related.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </ProductGrid>
    </section>
  );
}
