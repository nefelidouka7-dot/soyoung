import Image from "next/image";
import Link from "next/link";

const INSTAGRAM_URL = "https://www.instagram.com/soyoung/";
const HANDLE = "@soyoung";

type Props = {
  headline: string;
  cta: string;
};

function Profile() {
  return (
    <div className="flex items-center gap-3.5 text-left">
      <Link
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-oak/40 sm:h-[60px] sm:w-[60px]"
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
      <div>
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
  );
}

function FollowButton({ cta, className }: { cta: string; className?: string }) {
  return (
    <Link
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        "inline-flex h-11 items-center justify-center bg-ink px-6 text-[12px] font-bold uppercase tracking-[0.08em] text-bg transition-opacity hover:opacity-85"
      }
    >
      {cta}
    </Link>
  );
}

export function FollowUs({ headline, cta }: Props) {
  return (
    <section className="border-t border-oak/20 bg-bg">
      <div className="relative overflow-hidden xl:hidden">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 70% at 50% 0%, color-mix(in srgb, var(--color-oak) 45%, transparent), transparent 70%)",
          }}
        />
        <div className="container-page relative flex flex-col items-center px-6 py-14 text-center sm:py-16">
          <h2 className="font-serif text-[2rem] leading-none tracking-tight text-ink sm:text-[2.35rem]">
            {headline}
          </h2>
          <div className="mt-7">
            <Profile />
          </div>
          <FollowButton
            cta={cta}
            className="mt-7 inline-flex h-12 w-full max-w-xs items-center justify-center bg-ink px-6 text-[12px] font-bold uppercase tracking-[0.08em] text-bg transition-opacity hover:opacity-85 sm:w-auto sm:px-8"
          />
        </div>
      </div>

      <div className="container-page hidden py-14 xl:block lg:py-16">
        <div className="flex items-center justify-between gap-12">
          <h2 className="text-[1.5rem] font-bold uppercase tracking-[0.06em] text-ink">
            {headline}
          </h2>
          <div className="flex items-center gap-[4.5rem]">
            <Profile />
            <FollowButton cta={cta} />
          </div>
        </div>
      </div>
    </section>
  );
}
