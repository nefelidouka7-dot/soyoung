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
import type { Dictionary } from "@/lib/i18n/types";

const AGES = [
  { id: "under-20", key: "under20" },
  { id: "20-29", key: "a20" },
  { id: "30-39", key: "a30" },
  { id: "40-49", key: "a40" },
  { id: "50-plus", key: "a50" },
] as const;

const GOALS = [
  { id: "hydration", key: "hydration", concerns: ["hydration"] },
  { id: "anti-aging", key: "antiAging", concerns: ["anti-aging"] },
  { id: "brightening", key: "brightening", concerns: ["brightening"] },
  {
    id: "blemishes",
    key: "blemishes",
    concerns: ["blemishes", "oil-control"],
  },
  { id: "redness", key: "redness", concerns: ["redness"] },
] as const;

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
  const ageId = typeof sp.age === "string" ? sp.age : null;
  const goalId = typeof sp.goal === "string" ? sp.goal : null;

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
        }));

  function label(st: { name: string; nameEl: string }) {
    return locale === "el" ? st.nameEl : st.name;
  }

  const selected = typeSlug
    ? ((await findSkinTypeBySlug(typeSlug)) ??
      options.find((o) => o.slug === typeSlug))
    : null;
  const age = AGES.find((item) => item.id === ageId);
  const goal = GOALS.find((item) => item.id === goalId);

  if (typeSlug && !selected) {
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

  if (selected && age && goal) {
    const products = await findProducts({
      skinTypeSlugs: [selected.slug],
      concernSlugs: [...goal.concerns],
      pageSize: 24,
    });
    const typeName = label(selected);
    const ageName = dict.skinType.ages[age.key];
    const goalName = dict.skinType.goals[goal.key];

    return (
      <div className="relative">
        <QuizWash />
        <div className="container-page relative py-14 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-serif text-[1.85rem] leading-[1.12] tracking-tight text-ink sm:text-[2.45rem] lg:text-[2.75rem]">
            {typeName}
            <span className="text-ink-muted"> · {ageName}</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-[1.7] text-ink">
            {goalName}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
            {dict.skinType.resultNote}
          </p>
        </div>
        <StepBar
          dict={dict}
          current={3}
          backHref={`/skin-type?type=${selected.slug}&age=${age.id}`}
        />
        <div className="mt-8 sm:mt-10">
          <ProductGrid>
            {products.products.map((p) => (
              <ProductCard key={p.id} product={p} />
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
      </div>
    );
  }

  if (selected && age) {
    return (
      <QuizStep
        dict={dict}
        step={3}
        title={dict.skinType.goalHeadline}
        subhead={dict.skinType.goalSubhead}
        backHref={`/skin-type?type=${selected.slug}`}
      >
        {GOALS.map((item) => (
          <Choice
            key={item.id}
            href={`/skin-type?type=${selected.slug}&age=${age.id}&goal=${item.id}`}
            label={dict.skinType.goals[item.key]}
          />
        ))}
      </QuizStep>
    );
  }

  if (selected) {
    return (
      <QuizStep
        dict={dict}
        step={2}
        title={dict.skinType.ageHeadline}
        subhead={dict.skinType.ageSubhead}
        backHref="/skin-type"
      >
        {AGES.map((item) => (
          <Choice
            key={item.id}
            href={`/skin-type?type=${selected.slug}&age=${item.id}`}
            label={dict.skinType.ages[item.key]}
          />
        ))}
      </QuizStep>
    );
  }

  return (
    <QuizStep
      dict={dict}
      step={1}
      title={dict.skinType.headline}
      subhead={dict.skinType.subhead}
    >
      {options.map((st) => (
        <Choice
          key={st.slug}
          href={`/skin-type?type=${st.slug}`}
          label={label(st)}
          detail={"description" in st ? st.description : undefined}
        />
      ))}
    </QuizStep>
  );
}

function QuizWash() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-[28rem]"
      aria-hidden
      style={{
        background:
          "radial-gradient(ellipse 70% 55% at 50% 0%, color-mix(in srgb, var(--color-coral) 16%, transparent), transparent 70%)",
      }}
    />
  );
}

function BackLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] text-ink-muted transition-colors hover:text-ink ${className ?? ""}`}
    >
      <span aria-hidden>←</span>
      {children}
    </Link>
  );
}

function StepBar({
  dict,
  current,
  backHref,
}: {
  dict: Dictionary;
  current: 1 | 2 | 3;
  backHref?: string;
}) {
  return (
    <div className="relative mx-auto mt-8 w-full max-w-xs sm:mt-10 sm:max-w-sm">
      {backHref ? (
        <BackLink href={backHref} className="absolute right-full top-0 mr-8">
          {dict.skinType.back}
        </BackLink>
      ) : null}
      <Steps dict={dict} current={current} />
    </div>
  );
}

function Steps({ dict, current }: { dict: Dictionary; current: 1 | 2 | 3 }) {
  const steps = [
    dict.skinType.stepType,
    dict.skinType.stepAge,
    dict.skinType.stepGoal,
  ];
  return (
    <div className="w-full">
      <ol className="grid grid-cols-3">
        {steps.map((step, index) => {
          const n = index + 1;
          const active = n === current;
          const done = n < current;
          return (
            <li
              key={step}
              className={
                active
                  ? "text-center font-serif text-[1.05rem] leading-none text-ink"
                  : done
                    ? "text-center font-serif text-[1.05rem] leading-none text-ink/70"
                    : "text-center font-serif text-[1.05rem] leading-none text-ink/30"
              }
            >
              {step}
            </li>
          );
        })}
      </ol>
      <div className="mt-4 h-px w-full bg-oak" aria-hidden>
        <div
          className="h-px bg-coral transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: `${(current / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

function QuizStep({
  dict,
  step,
  title,
  subhead,
  backHref,
  children,
}: {
  dict: Dictionary;
  step: 1 | 2 | 3;
  title: string;
  subhead: string;
  backHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <QuizWash />
      <div className="container-page relative py-14 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-serif text-[1.85rem] leading-[1.12] tracking-tight text-ink sm:text-[2.45rem] lg:text-[2.75rem]">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-[1.7] text-ink-muted">
          {subhead}
        </p>
      </div>
      <StepBar dict={dict} current={step} backHref={backHref} />
      <div className="mx-auto mt-12 grid max-w-3xl gap-3 sm:grid-cols-2">{children}</div>
      </div>
    </div>
  );
}

function Choice({
  href,
  label,
  detail,
}: {
  href: string;
  label: string;
  detail?: string | null;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 border border-oak/40 bg-white/70 px-5 py-5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-coral/40 hover:bg-white hover:shadow-[0_16px_40px_-28px_rgba(217,119,87,0.9)]"
    >
      <span>
        <h2 className="font-serif text-[1.45rem] leading-snug text-ink">{label}</h2>
        {detail ? (
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{detail}</p>
        ) : null}
      </span>
      <span
        className="text-coral opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:opacity-100"
        aria-hidden
      >
        →
      </span>
    </Link>
  );
}
