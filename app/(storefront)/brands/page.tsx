import type { Metadata } from "next";
import { findAllBrands } from "@/server/repositories/product.repository";
import { BrandDirectory } from "@/features/products/components/brand-directory";
import { getServerDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getServerDictionary();
  return {
    title: dict.nav.brands,
    description: dict.brands.directoryHint,
  };
}

export default async function BrandsPage() {
  const [brands, dict] = await Promise.all([
    findAllBrands(),
    getServerDictionary(),
  ]);

  return (
    <div className="container-page py-10 lg:py-14">
      <h1 className="font-serif text-3xl sm:text-4xl">{dict.brands.title}</h1>
      <p className="mt-2 text-sm text-ink-muted">{dict.brands.directoryHint}</p>
      <BrandDirectory
        brands={brands.map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          logo: b.logo,
          count: b._count.products,
        }))}
      />
    </div>
  );
}
