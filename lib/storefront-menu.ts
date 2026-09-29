import type { Locale } from "@/lib/i18n/types";
import { skinIntentCopy } from "@/lib/skin-intent";

export type MenuLink = {
  href: string;
  el: string;
  en: string;
};

export function menuText(locale: Locale, link: Pick<MenuLink, "el" | "en">) {
  return locale === "el" ? link.el : link.en;
}

function typesHref(category: "skincare" | "makeup", types: string[]) {
  return `/${category}?type=${types.map((type) => encodeURIComponent(type)).join(",")}`;
}

export const highlightsLinks: MenuLink[] = [
  { href: "/best-sellers", el: "Best Sellers", en: "Best Sellers" },
  {
    href: "/best-sellers",
    el: "Best of K-Beauty",
    en: "Best of K-Beauty Awards",
  },
  { href: "/new-in", el: "Νέες αφίξεις", en: "New arrivals" },
];

export const setsLink: MenuLink = {
  href: typesHref("skincare", ["Skincare Set"]),
  el: "Ολοκληρωμένα σετ",
  en: "Skincare sets & kits",
};

export const skincareGroups: MenuLink[] = [
  {
    href: typesHref("skincare", [
      "Cleansing Balm",
      "Oil Cleanser",
      "Water Cleanser",
    ]),
    el: "Καθαρισμός",
    en: "Cleanse",
  },
  {
    href: typesHref("skincare", [
      "Toner",
      "Facial Mist",
      "Essence",
      "Toner Pads",
      "Exfoliator",
    ]),
    el: "Τόνωση & essences",
    en: "Tone & essences",
  },
  {
    href: typesHref("skincare", ["Serum"]),
    el: "Serums & ampoules",
    en: "Serums & ampoules",
  },
  {
    href: typesHref("skincare", ["Moisturizer", "Facial Oil"]),
    el: "Ενυδάτωση",
    en: "Moisturize",
  },
  {
    href: typesHref("skincare", ["Eye Cream", "Eye Mask"]),
    el: "Μάτια & χείλη",
    en: "Eyes & lips",
  },
  {
    href: "/makeup?type=Lip",
    el: "Φροντίδα χειλιών",
    en: "Lip care",
  },
  {
    href: typesHref("skincare", [
      "Sheet Mask",
      "Wash-off Mask",
      "Sleeping Mask",
    ]),
    el: "Μάσκες προσώπου",
    en: "Face masks",
  },
  {
    href: typesHref("skincare", ["Sunscreen"]),
    el: "Αντηλιακή προστασία",
    en: "Sun care",
  },
];

export const makeupGroups: MenuLink[] = [
  {
    href: typesHref("makeup", ["Makeup with SPF", "Primer & Face"]),
    el: "Cushion, BB & CC",
    en: "Cushion, BB & CC",
  },
  {
    href: typesHref("makeup", ["Lip"]),
    el: "Χείλη",
    en: "Lips",
  },
  {
    href: typesHref("makeup", ["Eye & Brow"]),
    el: "Μάτια & φρύδια",
    en: "Eyes & brows",
  },
  {
    href: typesHref("makeup", ["Blush"]),
    el: "Πρόσωπο",
    en: "Face color",
  },
];

const GOAL_ORDER = [
  "blemishes",
  "redness",
  "skin-barrier",
  "anti-aging",
  "brightening",
  "hydration",
  "oil-control",
];

export function goalMenuLinks(
  concerns: { name: string; nameEl: string; slug: string; sortOrder: number }[]
): MenuLink[] {
  return [...concerns]
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      const ia = GOAL_ORDER.indexOf(a.slug);
      const ib = GOAL_ORDER.indexOf(b.slug);
      if (ia !== -1 || ib !== -1) {
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      }
      return a.name.localeCompare(b.name);
    })
    .map((concern) => ({
      href: `/skincare?concern=${concern.slug}`,
      el:
        concern.nameEl ||
        skinIntentCopy("el", concern.slug)?.title ||
        concern.name,
      en: concern.name || skinIntentCopy("en", concern.slug)?.title || concern.nameEl,
    }));
}

export function skinTypeMenuLinks(
  skinTypes: { name: string; nameEl: string; slug: string }[]
): MenuLink[] {
  return skinTypes.map((skin) => ({
    href: `/skincare?skinType=${skin.slug}`,
    el: skin.nameEl || skinIntentCopy("el", undefined, skin.slug)?.title || skin.name,
    en: skin.name || skinIntentCopy("en", undefined, skin.slug)?.title || skin.nameEl,
  }));
}

export const ingredientLinks: MenuLink[] = [
  {
    href: "/skincare?q=hyaluronic",
    el: "Υαλουρονικό οξύ",
    en: "Hyaluronic acid",
  },
  {
    href: "/skincare?q=niacinamide",
    el: "Νιασιναμίδη",
    en: "Niacinamide",
  },
  {
    href: "/skincare?q=centella",
    el: "Centella / Cica",
    en: "Centella / Cica",
  },
  { href: "/skincare?q=retinol", el: "Ρετινόλη", en: "Retinol" },
  {
    href: "/skincare?q=snail",
    el: "Snail mucin",
    en: "Snail mucin",
  },
  { href: "/skincare?q=vitamin%20c", el: "Βιταμίνη C", en: "Vitamin C" },
  { href: "/skincare?q=acid", el: "AHA / BHA / PHA", en: "AHA / BHA / PHA" },
  { href: "/skincare?q=ceramide", el: "Κεραμίδια", en: "Ceramides" },
];

export const navBar = {
  home: { href: "/", el: "Αρχική", en: "Home" },
  highlights: { el: "Best Sellers", en: "Best Sellers" },
  sets: { href: setsLink.href, el: "Σετ", en: "Sets" },
  face: { el: "Πρόσωπο", en: "Skincare" },
  makeup: { el: "Μακιγιάζ", en: "Makeup" },
  brands: { el: "Μάρκες", en: "Brands" },
  quiz: { href: "/skin-type", el: "Skin Matcher", en: "Skin Matcher" },
  care: { el: "Στόχοι", en: "Skin goals" },
} as const;
