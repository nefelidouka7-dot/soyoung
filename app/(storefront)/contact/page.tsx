import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import { AtSign, Building2, Clock, Mail, MapPin, Phone } from "lucide-react";
import { STORE_PICKUP } from "@/lib/checkout-options";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/constants";
import { getLocale } from "@/lib/i18n/server";
import { getStoreSettings } from "@/server/repositories/store-settings.repository";

export const metadata: Metadata = {
  title: "Επικοινωνία",
  description: "Στοιχεία επικοινωνίας και ωράριο του καταστήματος SoYoung.",
};

const COPY = {
  el: {
    title: "Επικοινωνία",
    intro: "Επισκεφθείτε μας στο κατάστημα ή επικοινωνήστε μαζί μας τηλεφωνικά ή με email.",
    address: "Διεύθυνση",
    map: "Άνοιγμα στον χάρτη",
    phone: "Τηλέφωνο",
    email: "Email",
    instagram: "Instagram",
    hours: "Ωράριο καταστήματος",
    company: "Στοιχεία επιχείρησης",
    legalName: "Επωνυμία",
    vatNumber: "ΑΦΜ",
    taxOffice: "ΔΟΥ",
    gemi: "Αρ. ΓΕΜΗ",
    greece: "Ελλάδα",
  },
  en: {
    title: "Contact",
    intro: "Visit our store, or reach us by phone or email.",
    address: "Address",
    map: "Open in maps",
    phone: "Phone",
    email: "Email",
    instagram: "Instagram",
    hours: "Store hours",
    company: "Company details",
    legalName: "Company name",
    vatNumber: "VAT number",
    taxOffice: "Tax office",
    gemi: "G.E.MI. number",
    greece: "Greece",
  },
} as const;

export default async function ContactPage() {
  const [locale, settings] = await Promise.all([getLocale(), getStoreSettings()]);
  const t = COPY[locale === "en" ? "en" : "el"];
  const { pickup, business } = settings;

  const country = pickup.country === "GR" ? t.greece : pickup.country;
  const addressLines = [
    pickup.line1,
    pickup.line2,
    `${pickup.postalCode} ${pickup.city}`,
    country,
  ].filter(Boolean) as string[];
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [pickup.line1, pickup.postalCode, pickup.city, country].join(", ")
  )}`;

  const companyRows = [
    { label: t.legalName, value: business.legalName },
    { label: t.vatNumber, value: business.vatNumber },
    { label: t.taxOffice, value: business.taxOffice },
    { label: t.gemi, value: business.gemi },
  ].filter((row) => row.value);

  return (
    <div className="container-page py-14 lg:py-20">
      <h1 className="font-serif text-3xl text-ink sm:text-4xl">{t.title}</h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-muted">
        {t.intro}
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <InfoCard icon={MapPin} title={t.address}>
          <p className="font-medium text-ink">{pickup.name}</p>
          {addressLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-medium text-coral underline-offset-4 hover:underline"
          >
            {t.map} →
          </a>
        </InfoCard>

        <InfoCard icon={Clock} title={t.hours}>
          <dl className="space-y-1.5">
            {STORE_PICKUP.schedule.map((row) => (
              <div key={row.dayEn} className="flex justify-between gap-4">
                <dt>{locale === "en" ? row.dayEn : row.dayEl}</dt>
                <dd className="text-right text-ink">
                  {locale === "en" ? row.hoursEn : row.hoursEl}
                </dd>
              </div>
            ))}
          </dl>
        </InfoCard>

        <InfoCard icon={Phone} title={t.phone}>
          <a
            href={`tel:${pickup.phone.replace(/\s/g, "")}`}
            className="text-base font-medium text-ink underline-offset-4 hover:underline"
          >
            {pickup.phone}
          </a>
        </InfoCard>

        {business.email ? (
          <InfoCard icon={Mail} title={t.email}>
            <a
              href={`mailto:${business.email}`}
              className="text-base font-medium break-all text-ink underline-offset-4 hover:underline"
            >
              {business.email}
            </a>
          </InfoCard>
        ) : null}

        <InfoCard icon={AtSign} title={t.instagram}>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-medium text-ink underline-offset-4 hover:underline"
          >
            {INSTAGRAM_HANDLE}
          </a>
        </InfoCard>

        {companyRows.length > 0 ? (
          <InfoCard icon={Building2} title={t.company} className="md:col-span-2">
            <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {companyRows.map((row) => (
                <div key={row.label}>
                  <dt className="text-xs uppercase tracking-[0.12em]">{row.label}</dt>
                  <dd className="mt-0.5 text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
          </InfoCard>
        ) : null}
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  className,
  children,
}: {
  icon: LucideIcon;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-xl border border-oak/30 bg-surface p-5 sm:p-6 ${className ?? ""}`}
    >
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral/10 text-coral">
          <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </span>
        <h2 className="font-serif text-lg text-ink">{title}</h2>
      </div>
      <div className="mt-4 space-y-0.5 text-sm leading-relaxed text-ink-muted">
        {children}
      </div>
    </section>
  );
}
