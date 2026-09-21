export const brand = {
  colors: {
    bg: "#F5EBE1",
    bgMuted: "#FAF4ED",
    ink: "#2B2927",
    oak: "#D0B89A",
    sage: "#8A9A86",
    coral: "#E08A79",
  },
  nav: [
    { label: "New In", href: "/new-in" },
    { label: "Makeup", href: "/makeup" },
    { label: "Skincare", href: "/skincare" },
    { label: "Haircare", href: "/haircare" },
    { label: "Body", href: "/body" },
    { label: "Brands", href: "/brands" },
    { label: "Offers", href: "/offers" },
  ],
  skinTypes: [
    {
      slug: "oily",
      name: "Oily",
      nameEl: "Λιπαρή",
      description: "Skin that tends to produce excess oil and may appear shiny.",
    },
    {
      slug: "dry",
      name: "Dry",
      nameEl: "Ξηρή",
      description: "Skin that often feels tight, rough or lacking moisture.",
    },
    {
      slug: "combination",
      name: "Combination",
      nameEl: "Μικτή",
      description: "Oilier in some areas and drier in others.",
    },
    {
      slug: "normal",
      name: "Normal",
      nameEl: "Κανονική",
      description: "Generally balanced skin with minimal dryness or oiliness.",
    },
    {
      slug: "sensitive",
      name: "Sensitive",
      nameEl: "Ευαίσθητη",
      description: "Skin that is more prone to redness, irritation or discomfort.",
    },
  ],
} as const;
