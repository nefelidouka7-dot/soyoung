import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { findProductBySlug } from "@/server/repositories/product.repository";
import { ProductPurchasePanel } from "@/features/products/components/product-purchase-panel";
import { ProductAccordion } from "@/features/products/components/product-accordion";
import { absoluteUrl, STORE_NAME } from "@/lib/utils";
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

  const ratings = product.reviews.map((r) => r.rating);
  const avg =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : null;

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
    ...(avg
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avg.toFixed(1),
            reviewCount: ratings.length,
          },
        }
      : {}),
  };

  const sections = [
    { title: dict.product.description, content: product.description },
    { title: dict.product.ingredients, content: product.ingredients },
    { title: dict.product.howToUse, content: product.howToUse },
    {
      title: dict.product.details,
      content: [
        product.volume ? `${dict.product.volume}: ${product.volume}` : null,
        product.weight ? `Weight: ${product.weight}` : null,
        product.sku ? `SKU: ${product.sku}` : null,
        product.productType ? `Type: ${product.productType}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    },
    {
      title: dict.product.shippingReturns,
      content: dict.product.shippingReturnsBody,
    },
  ];

  return (
    <div className="pb-16 lg:pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="border-b border-oak/30 bg-bg-muted/50">
        <div className="container-page py-8 lg:py-12">
          <nav className="mb-6 text-[11px] uppercase tracking-[0.12em] text-ink-muted" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <li>
                <Link href="/" className="transition-colors hover:text-ink">
                  {dict.listing.home}
                </Link>
              </li>
              <li aria-hidden className="text-oak">
                /
              </li>
              <li>
                <Link
                  href={`/${product.category.parent?.slug ?? product.category.slug}`}
                  className="transition-colors hover:text-ink"
                >
                  {product.category.parent?.name ?? product.category.name}
                </Link>
              </li>
              <li aria-hidden className="text-oak">
                /
              </li>
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
              rating: avg,
              reviewCount: ratings.length,
              skinTypes: product.skinTypes.map((s) =>
                locale === "el" ? s.skinType.nameEl : s.skinType.name
              ),
            }}
          />
        </div>
      </div>

      <div className="container-page mt-12 grid gap-10 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-16">
        <div>
          <ProductAccordion
            items={[
              ...sections
                .filter((s) => Boolean(s.content))
                .map((s) => ({
                  id: s.title,
                  title: s.title,
                  defaultOpen: s.title === dict.product.description,
                  content: (
                    <div className="mt-3 max-w-2xl whitespace-pre-line pb-1 text-sm leading-[1.7] text-ink-muted">
                      {s.content}
                    </div>
                  ),
                })),
              {
                id: "reviews",
                title: (
                  <>
                    {dict.product.reviewsTitle}
                    {product.reviews.length > 0 ? (
                      <span className="ml-2 font-sans text-sm text-ink-muted">
                        ({product.reviews.length})
                      </span>
                    ) : null}
                  </>
                ),
                content: (
                  <div className="mt-5 space-y-5 pb-1">
                    {product.reviews.length === 0 ? (
                      <p className="text-sm text-ink-muted">
                        {dict.product.noReviews}
                      </p>
                    ) : (
                      product.reviews.map((r) => (
                        <article
                          key={r.id}
                          className="border-t border-oak/25 pt-5 first:border-t-0 first:pt-0"
                        >
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="tracking-wide text-ink">
                              {"★".repeat(r.rating)}
                              <span className="text-oak">
                                {"★".repeat(5 - r.rating)}
                              </span>
                            </span>
                            {r.verifiedPurchase ? (
                              <span className="text-[11px] uppercase tracking-wider text-sage-dark">
                                {dict.product.verifiedPurchase}
                              </span>
                            ) : null}
                          </div>
                          {r.title ? (
                            <h3 className="mt-2 text-sm font-medium text-ink">
                              {r.title}
                            </h3>
                          ) : null}
                          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                            {r.comment}
                          </p>
                          <p className="mt-2.5 text-xs text-ink-muted/80">
                            {r.user.name ??
                              r.user.firstName ??
                              dict.product.customer}{" "}
                            ·{" "}
                            {r.createdAt.toLocaleDateString(
                              locale === "el" ? "el-GR" : "en-GB"
                            )}
                          </p>
                        </article>
                      ))
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 border border-oak/40 bg-bg-muted/60 p-6">
            <p className="font-serif text-lg text-ink">{product.brand.name}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {product.shortDescription}
            </p>
            {product.volume ? (
              <p className="mt-4 border-t border-oak/30 pt-4 text-xs uppercase tracking-[0.12em] text-ink-muted">
                {dict.product.volume} · {product.volume}
              </p>
            ) : null}
          </div>
        </aside>
      </div>
      <p className="sr-only">{STORE_NAME}</p>
    </div>
  );
}
