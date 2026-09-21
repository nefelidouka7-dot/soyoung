import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { findAllBrands } from "@/server/repositories/product.repository";
import { BrandDirectory } from "@/features/products/components/brand-directory";

export const metadata: Metadata = {
  title: "Brands",
  description: "Browse all beauty brands at SoYoung.",
};

export default async function BrandsPage() {
  const brands = await findAllBrands();
  return (
    <div className="container-page py-10 lg:py-14">
      <h1 className="font-serif text-3xl sm:text-4xl">Shop by Brand</h1>
      <p className="mt-2 text-sm text-ink-muted">
        An alphabetical directory of our curated houses.
      </p>
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
