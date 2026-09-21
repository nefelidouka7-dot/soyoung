import Link from "next/link";
import type { Metadata } from "next";
import { ProductCard } from "@/features/products/components/product-card";
import { ProductGrid } from "@/features/products/components/product-grid";
import {
  findSkinTypes,
  findSkinTypeBySlug,
  findProducts,
} from "@/server/repositories/product.repository";
import { brand } from "@/lib/constants";
import { getLocale, getServerDictionary } from "@/lib/i18n/server";
import { interpolate } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getServerDictionary();
  return {
    title: dict.nav.findForMySkin,
    description: dict.skinType.subhead,
  };
}

export default async function SkinTypePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [sp, dict, locale] = await Promise.all([
    searchParams,
    getServerDictionary(),
    getLocale(),
  ]);
  const typeSlug = typeof sp.type === "string" ? sp.type : null;
  const skinTypes = await findSkinTypes();
  const options =
    skinTypes.length > 0
      ? skinTypes
      : brand.skinTypes.map((s) => ({
          id: s.slug,
          name: s.name,
          nameEl: s.nameEl,
          slug: s.slug,
          description: s.description,
          image: null,
          active: true,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

  function label(st: { name: string; nameEl: string }) {
    return locale === "el" ? st.nameEl : st.name;
  }

  if (typeSlug) {
    const selected =
      (await findSkinTypeBySlug(typeSlug)) ??
      options.find((o) => o.slug === typeSlug);
    if (!selected) {
      return (
        <div className="container-page py-16 text-center">
          <p>{dict.skinType.notFound}</p>
          <Link
            href="/skin-type"
            className="mt-4 inline-block text-sage-dark underline"
          >
            {dict.skinType.startAgain}
          </Link>
        </div>
      );
    }

    const products = await findProducts({
      skinTypeSlugs: [selected.slug],
      pageSize: 24,
    });
    const typeName = label(selected);

    return (
      <div className="container-page py-10 lg:py-14">
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl">
          {interpolate(dict.skinType.productsFor, { type: typeName })}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
          {selected.description}
        </p>
        <Link
          href="/skin-type"
          className="mt-4 inline-block text-xs uppercase tracking-wider text-ink-muted underline-offset-4 hover:underline"
        >
          {dict.skinType.chooseAnother}
        </Link>
        <div className="mt-8 sm:mt-10">
          <ProductGrid>
            {products.products.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  ...p,
                  suitableFor: typeName,
                }}
              />
            ))}
          </ProductGrid>
        </div>
        {products.products.length === 0 ? (
          <p className="mt-10 text-center text-sm text-ink-muted">
            {dict.listing.noProductsDescription}{" "}
            <Link href="/skincare" className="underline">
              {dict.home.catSkincare}
            </Link>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="container-page py-10 lg:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
          {dict.skinType.consultation}
        </p>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl">
          {dict.skinType.headline}
        </h1>
        <p className="mt-3 text-base text-ink-muted">{dict.skinType.subhead}</p>
      </div>
      <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((st) => (
          <Link
            key={st.slug}
            href={`/skin-type?type=${st.slug}`}
            className="group border border-oak/40 bg-bg-muted p-6 transition-colors hover:border-sage/70"
          >
            <h2 className="font-serif text-2xl text-ink">{label(st)}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              {st.description}
            </p>
            <span className="mt-4 inline-block text-xs uppercase tracking-wider text-sage-dark opacity-0 transition-opacity group-hover:opacity-100">
              {dict.skinType.viewProducts}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
