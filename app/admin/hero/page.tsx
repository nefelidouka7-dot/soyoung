import Link from "next/link";
import { prisma } from "@/db/prisma";
import { requireAdmin, decimalToNumber } from "@/lib/admin";
import {
  deleteHeroSlide,
  toggleHeroSlide,
} from "@/features/admin/actions/hero";
import { HeroSlideForm } from "@/features/admin/components/hero-slide-form";
import { HeroCarouselSettingsForm } from "@/features/admin/components/hero-carousel-settings-form";
import {
  AdminEmpty,
  AdminPageHeader,
  AdminPanel,
  StatusBadge,
} from "@/features/admin/components/admin-ui";
import {
  findAllHeroSlides,
  getHeroCarouselSettings,
  type AdminHeroSlide,
} from "@/server/repositories/hero.repository";
import { formatPrice } from "@/lib/utils";

export default async function AdminHeroPage() {
  await requireAdmin();

  const [slides, settings, products] = await Promise.all([
    findAllHeroSlides(),
    getHeroCarouselSettings(),
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

  const productOptions = products.map(
    (p: {
      id: string;
      name: string;
      slug: string;
      sku: string | null;
      price: Parameters<typeof decimalToNumber>[0];
      compareAtPrice: Parameters<typeof decimalToNumber>[0] | null;
      images: { url: string }[];
    }) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      imageUrl: p.images[0]?.url ?? null,
      price: decimalToNumber(p.price),
      compareAtPrice: p.compareAtPrice
        ? decimalToNumber(p.compareAtPrice)
        : null,
    })
  );

  const typedSlides = slides as AdminHeroSlide[];
  const activeCount = typedSlides.filter((s) => s.active).length;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Slides αρχικής"
        description="Διαχείριση του μεγάλου banner carousel στην κορυφή του shop."
      />

      <div className="rounded-xl border border-oak/30 bg-bg-muted/50 px-4 py-4 sm:px-5">
        <p className="text-sm font-medium text-ink">Πώς λειτουργεί</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ink-muted">
          <li>
            Πρόσθεσε slides παρακάτω (καμπάνια ή προϊόν σε προσφορά).
          </li>
          <li>
            Ανέβασε μια φαρδιά εικόνα για κάθε slide — αυτή είναι η φωτογραφία
            του banner.
          </li>
          <li>
            Άνοιξε το autoplay αν θέλεις αυτόματη αλλαγή. Οι επισκέπτες μπορούν
            πάντα να κάνουν swipe ή να πατήσουν τα βελάκια.
          </li>
          <li>
            Με τη{" "}
            <span className="font-medium text-ink">Σειρά</span> (0, 1, 2…)
            ορίζεις ποιο slide εμφανίζεται πρώτο.
          </li>
        </ol>
        <p className="mt-3 text-xs text-ink-muted">
          Tip: κράτα 3–5 ενεργά slides. Πολλά μαζί κουράζουν.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="space-y-4">
          <HeroCarouselSettingsForm settings={settings} />
          <AdminPanel title="Στο shop τώρα">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Ενεργά slides</dt>
                <dd className="font-medium tabular-nums">{activeCount}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Αποθηκευμένα</dt>
                <dd className="font-medium tabular-nums">{typedSlides.length}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Autoplay</dt>
                <dd className="font-medium">
                  {settings.autoplay
                    ? `Κάθε ${settings.intervalSeconds}δ`
                    : "Κλειστό"}
                </dd>
              </div>
            </dl>
            <Link
              href="/"
              target="_blank"
              className="mt-4 inline-flex text-sm font-medium text-sage-dark hover:underline"
            >
              Δες την αρχική →
            </Link>
          </AdminPanel>
        </div>

        <AdminPanel
          title="Τα slides σου"
          description={
            typedSlides.length
              ? "Πάτα Επεξεργασία για κείμενο, εικόνα ή προϊόν."
              : "Δεν υπάρχουν ακόμα — πρόσθεσε ένα στην ενότητα παρακάτω."
          }
        >
          {typedSlides.length === 0 ? (
            <AdminEmpty>
              Χωρίς ενεργά slides, η αρχική δείχνει το προεπιλεγμένο banner.
            </AdminEmpty>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {typedSlides.map((slide) => (
                <SlideCard key={slide.id} slide={slide} />
              ))}
            </ul>
          )}
        </AdminPanel>
      </div>

      <HeroSlideForm products={productOptions} defaultOpen={false} />
    </div>
  );
}

function SlideCard({ slide }: { slide: AdminHeroSlide }) {
  const price =
    slide.product?.price != null
      ? decimalToNumber(slide.product.price)
      : null;
  const compareAt =
    slide.product?.compareAtPrice != null
      ? decimalToNumber(slide.product.compareAtPrice)
      : null;
  const onSale =
    price != null && compareAt != null && compareAt > price;

  return (
    <li className="overflow-hidden rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
      <div className="relative aspect-[16/10] bg-bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slide.imageUrl}
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          <StatusBadge tone={slide.active ? "success" : "neutral"}>
            {slide.active ? "Ενεργό" : "Κρυφό"}
          </StatusBadge>
          <span className="rounded-full bg-bg/90 px-2 py-0.5 text-[11px] font-medium text-ink ring-1 ring-ink/10">
            {slide.type === "PRODUCT" ? "Product" : "Campaign"}
          </span>
          <span className="rounded-full bg-bg/90 px-2 py-0.5 text-[11px] font-medium tabular-nums text-ink ring-1 ring-ink/10">
            #{slide.sortOrder}
          </span>
        </div>
      </div>
      <div className="space-y-3 p-3.5">
        <div>
          <p className="font-medium leading-snug text-ink">{slide.headlineEn}</p>
          {slide.headlineAccentEn ? (
            <p className="mt-0.5 text-sm italic text-coral">
              {slide.headlineAccentEn}
            </p>
          ) : null}
          {slide.product ? (
            <p className="mt-1 text-xs text-ink-muted">
              {slide.product.name}
              {price != null ? ` · ${formatPrice(price)}` : ""}
              {onSale && compareAt != null
                ? ` (πριν ${formatPrice(compareAt)})`
                : ""}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-oak/20 pt-3 text-xs">
          <Link
            href={`/admin/hero/${slide.id}`}
            className="font-medium text-sage-dark hover:underline"
          >
            Επεξεργασία
          </Link>
          <form
            action={toggleHeroSlide.bind(null, slide.id, !slide.active)}
            className="inline"
          >
            <button
              type="submit"
              className="font-medium text-ink-muted hover:text-ink hover:underline"
            >
              {slide.active ? "Απόκρυψη" : "Εμφάνιση"}
            </button>
          </form>
          <form
            action={deleteHeroSlide.bind(null, slide.id)}
            className="inline"
          >
            <button
              type="submit"
              className="font-medium text-coral hover:underline"
            >
              Διαγραφή
            </button>
          </form>
        </div>
      </div>
    </li>
  );
}
