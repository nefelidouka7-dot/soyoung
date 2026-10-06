import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/db/prisma";
import { requireAdmin, decimalToNumber } from "@/lib/admin";
import { deleteHeroSlide } from "@/features/admin/actions/hero";
import { HeroSlideForm } from "@/features/admin/components/hero-slide-form";
import { AdminPageHeader } from "@/features/admin/components/admin-ui";
import { findHeroSlideById } from "@/server/repositories/hero.repository";

type Props = { params: Promise<{ id: string }> };

export default async function AdminHeroEditPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const [slide, products] = await Promise.all([
    findHeroSlideById(id),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        price: true,
        compareAtPrice: true,
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
          select: { url: true },
        },
      },
    }),
  ]);

  if (!slide) notFound();

  const productOptions = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    imageUrl: p.images[0]?.url ?? null,
    price: decimalToNumber(p.price),
    compareAtPrice: p.compareAtPrice
      ? decimalToNumber(p.compareAtPrice)
      : null,
  }));

  return (
    <div>
      <AdminPageHeader
        title="Επεξεργασία slide"
        description={slide.headlineEn}
      />
      <div className="mb-4">
        <Link
          href="/admin/hero"
          className="text-sm text-ink-muted transition-colors hover:text-ink"
        >
          ← Πίσω στα slides
        </Link>
      </div>
      <div className="mx-auto max-w-4xl space-y-4">
        <HeroSlideForm slide={slide} products={productOptions} />
        <form action={deleteHeroSlide.bind(null, slide.id)}>
          <button
            type="submit"
            className="text-sm font-medium text-coral hover:underline"
          >
            Διαγραφή slide
          </button>
        </form>
      </div>
    </div>
  );
}
