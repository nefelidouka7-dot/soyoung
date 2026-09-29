import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export type HomeReview = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  brand: string;
  productName: string;
  productSlug: string;
  productImage: string;
};

type Props = {
  headline: string;
  shopLabel: string;
  reviews: HomeReview[];
};

export function RealReviews({ headline, shopLabel, reviews }: Props) {
  if (reviews.length === 0) return null;

  return (
    <section className="border-y border-oak/20 bg-bg py-20 lg:py-28">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-[1.85rem] leading-tight tracking-tight text-ink sm:text-[2.35rem]">
            {headline}
          </h2>
        </div>

        <ul className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8 lg:gap-10">
          {reviews.map((review) => (
            <li key={review.id} className="flex flex-col">
              <div className="flex gap-1" aria-label={`${review.rating}/5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={i < review.rating ? "text-coral" : "text-oak/40"}
                    aria-hidden
                  >
                    ★
                  </span>
                ))}
              </div>

              {review.title ? (
                <h3 className="mt-4 font-serif text-[1.35rem] leading-snug tracking-tight text-ink sm:text-[1.5rem]">
                  {review.title}
                </h3>
              ) : null}

              {review.comment ? (
                <p className="mt-3 flex-1 text-[14px] leading-[1.75] text-ink-muted">
                  {review.comment}
                </p>
              ) : null}

              <p className="mt-5 text-[12px] font-medium uppercase tracking-[0.08em] text-ink">
                — {review.brand}
              </p>

              <Link
                href={`/product/${review.productSlug}`}
                className="group mt-4 flex items-center gap-3 bg-bg-muted/80 px-3 py-3 transition-colors duration-500 ease-out hover:bg-bg-muted"
              >
                <span className="relative h-14 w-14 shrink-0 overflow-hidden bg-white">
                  <Image
                    src={review.productImage}
                    alt={review.productName}
                    fill
                    className="object-contain p-1.5"
                    sizes="56px"
                  />
                </span>
                <span className="min-w-0 flex-1 text-[13px] leading-snug text-ink">
                  {review.productName}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-coral">
                  {shopLabel}
                  <ArrowRight
                    className="h-3 w-3 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
