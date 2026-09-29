import type { Locale } from "@/lib/i18n/types";

export type Ingredient = {
  slug: string;
  /** Terms matched against the product name and ingredient list. */
  terms: string[];
  el: { title: string; body: string };
  en: { title: string; body: string };
};

export const INGREDIENTS: Ingredient[] = [
  {
    slug: "hyaluronic",
    terms: ["hyaluronic", "hyaluronate"],
    el: {
      title: "Υαλουρονικό οξύ",
      body: "Για βαθιά ενυδάτωση. Κρατά νερό στην επιδερμίδα, χωρίς να τη βαραίνει.",
    },
    en: {
      title: "Hyaluronic acid",
      body: "For deep hydration. It holds water in the skin without weighing it down.",
    },
  },
  {
    slug: "niacinamide",
    terms: ["niacinamide"],
    el: {
      title: "Νιασιναμίδη",
      body: "Για λάμψη, πόρους και πιο ομοιόμορφο τόνο.",
    },
    en: {
      title: "Niacinamide",
      body: "For glow, pores, and a more even tone.",
    },
  },
  {
    slug: "centella",
    terms: ["centella", "cica", "madecassoside", "heartleaf"],
    el: {
      title: "Centella / Cica",
      body: "Για καταπράυνση. Ταιριάζει όταν υπάρχει κοκκινίλα ή ευαισθησία.",
    },
    en: {
      title: "Centella / Cica",
      body: "For soothing. A fit when skin is red or easily reactive.",
    },
  },
  {
    slug: "retinol",
    terms: ["retinol", "retinoid"],
    el: {
      title: "Ρετινόλη",
      body: "Για αντιγήρανση και ανανέωση. Δουλεύει αργά, με σταθερή χρήση.",
    },
    en: {
      title: "Retinol",
      body: "For anti-aging and renewal. It works slowly, with steady use.",
    },
  },
  {
    slug: "snail",
    terms: ["snail", "mucin"],
    el: {
      title: "Snail mucin",
      body: "Για ανάπλαση και σημάδια. Απαλή υποστήριξη στην αποκατάσταση του δέρματος.",
    },
    en: {
      title: "Snail mucin",
      body: "For repair and marks. Gentle support while skin recovers.",
    },
  },
  {
    slug: "vitamin-c",
    terms: ["vitamin c", "ascorbyl", "ascorbic"],
    el: {
      title: "Βιταμίνη C",
      body: "Για αντιοξειδωτική προστασία και λάμψη.",
    },
    en: {
      title: "Vitamin C",
      body: "For antioxidant care and brightness.",
    },
  },
  {
    slug: "acids",
    terms: ["glycolic", "salicylic", "lactic", "pha"],
    el: {
      title: "AHA / BHA / PHA",
      body: "Για πόρους, απολέπιση και ακμή. Ξεμπλοκάρουν την επιφάνεια χωρίς να την τρίβουν.",
    },
    en: {
      title: "AHA / BHA / PHA",
      body: "For pores, exfoliation, and breakouts. They clear the surface without scrubbing.",
    },
  },
  {
    slug: "ceramides",
    terms: ["ceramide"],
    el: {
      title: "Κεραμίδια",
      body: "Για προστασία και ενίσχυση του δερματικού φραγμού.",
    },
    en: {
      title: "Ceramides",
      body: "For protection and a stronger skin barrier.",
    },
  },
];

export function ingredientBySlug(slug: string | undefined | null) {
  if (!slug) return undefined;
  return INGREDIENTS.find((item) => item.slug === slug);
}

export function ingredientLabel(locale: Locale, slug: string) {
  const item = ingredientBySlug(slug);
  if (!item) return slug;
  return locale === "el" ? item.el.title : item.en.title;
}
