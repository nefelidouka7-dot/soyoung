import Image from "next/image";
import Link from "next/link";

const INSTAGRAM_URL = "https://www.instagram.com/soyoung/";
const HANDLE = "@soyoung";

type Props = {
  headline: string;
  cta: string;
};

export function FollowUs({ headline, cta }: Props) {
  return (
    <section className="border-t border-oak/20 bg-bg py-12 sm:py-14 lg:py-16">
      <div className="container-page">
        <div className="flex flex-col gap-8 sm:gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <h2 className="text-[1.35rem] font-bold uppercase tracking-[0.06em] text-ink sm:text-[1.5rem]">
            {headline}
          </h2>

          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-10 lg:gap-[4.5rem]">
            <div className="flex items-center gap-3.5">
              <Link
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-oak/30"
                aria-label={HANDLE}
              >
                <Image
                  src="/images/soyoung_logo.png"
                  alt=""
                  fill
                  className="object-contain p-2.5"
                  sizes="60px"
                />
              </Link>
              <div className="text-left">
                <Link
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[15px] font-bold text-ink transition-opacity hover:opacity-70"
                >
                  {HANDLE}
                </Link>
                <p className="mt-0.5 text-[13px] text-ink-muted">Instagram</p>
              </div>
            </div>

            <Link
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center bg-ink px-5 text-[12px] font-bold uppercase tracking-[0.06em] text-bg transition-opacity hover:opacity-85 sm:px-6"
            >
              {cta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
