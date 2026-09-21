import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  findBrandBySlug,
  findProducts,
} from "@/server/repositories/product.repository";
import { ProductCard } from "@/features/products/components/product-card";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = await findBrandBySlug(slug);
  if (!brand) return { title: "Brand" };
  return {
    title: brand.seoTitle ?? brand.name,
    description: brand.seoDescription ?? brand.description ?? undefined,
  };
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params;
  const brand = await findBrandBySlug(slug);
  if (!brand) notFound();

  const products = await findProducts({
    brandSlugs: [brand.slug],
    pageSize: 48,
  });
  const featured = products.products.filter((_, i) => i < 4);

  return (
    <div>
      <div className="relative h-48 overflow-hidden bg-bg-muted sm:h-64 lg:h-72">
        <Image
          src={brand.banner ?? "/images/placeholder-hero.svg"}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-ink/20" />
      </div>
      <div className="container-page py-10 lg:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden bg-bg-muted">
              <Image
                src={brand.logo ?? "/images/placeholder-brand.svg"}
                alt=""
                fill
                className="object-contain p-2"
                sizes="64px"
              />
            </div>
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl">{brand.name}</h1>
              <p className="mt-1 text-sm text-ink-muted">
                {brand._count.products} products
              </p>
            </div>
          </div>
          {brand.website ? (
            <a
              href={brand.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs uppercase tracking-wider text-ink-muted underline-offset-4 hover:underline"
            >
              Visit website
            </a>
          ) : null}
        </div>
        {brand.description ? (
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink-muted">
            {brand.description}
          </p>
        ) : null}

        {featured.length > 0 ? (
          <section className="mt-12">
            <h2 className="font-serif text-2xl">Featured from {brand.name}</h2>
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:gap-x-6">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-16">
          <h2 className="font-serif text-2xl">All {brand.name} products</h2>
          {products.products.length === 0 ? (
            <p className="mt-6 text-sm text-ink-muted">No products yet.</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
              {products.products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        <Link
          href="/brands"
          className="mt-12 inline-block text-xs uppercase tracking-wider text-ink-muted underline-offset-4 hover:underline"
        >
          ← All brands
        </Link>
      </div>
    </div>
  );
}
