import type { Locale } from "@/lib/i18n/types";

type IntentCopy = {
  title: string;
  body: string;
};

const goals: Record<string, Record<Locale, IntentCopy>> = {
  blemishes: {
    el: {
      title: "Ακμή & ατέλειες",
      body: "Τα σπυράκια δεν σημαίνουν ότι κάνεις κάτι λάθος. Το δέρμα ζητά ισορροπία: λιγότερη φλεγμονή, πιο ήρεμο σμήγμα, χωρίς να το στεγνώσεις.",
    },
    en: {
      title: "Acne & blemishes",
      body: "Breakouts are not a failed routine. Your skin is asking for balance — calmer inflammation and less oil, without stripping it dry.",
    },
  },
  redness: {
    el: {
      title: "Ροδόχρους & ερυθρότητα",
      body: "Η κοκκινίλα δεν θέλει πιο δυνατά προϊόντα. Θέλει λιγότερη πίεση: καταπράυνση, σταθερό φραγμό και φόρμουλες που δεν τσούζουν.",
    },
    en: {
      title: "Redness & sensitivity",
      body: "Redness does not need a stronger product. It needs less pressure — soothing care, a steadier barrier, and formulas that do not sting.",
    },
  },
  "skin-barrier": {
    el: {
      title: "Ενίσχυση φραγμού",
      body: "Όταν τραβάει, ξεφλουδίζει ή αντιδρά στο παραμικρό, ο φραγμός έχει κουραστεί. Πρώτα τον φτιάχνουμε. Μετά έρχονται όλα τα άλλα.",
    },
    en: {
      title: "Barrier repair",
      body: "When skin feels tight, flaky, or reactive to almost anything, the barrier is tired. Repair that first. Everything else can wait.",
    },
  },
  "anti-aging": {
    el: {
      title: "Αντιγήρανση & σύσφιξη",
      body: "Οι λεπτές γραμμές δεν ζητούν θαύμα σε μία νύχτα. Ζητούν σταθερή υγρασία, στήριξη και μια ρουτίνα που την κρατάς.",
    },
    en: {
      title: "Anti-aging & firmness",
      body: "Fine lines are not asking for an overnight miracle. They want steady moisture, support, and a routine you can actually keep.",
    },
  },
  brightening: {
    el: {
      title: "Λάμψη & δυσχρωμίες",
      body: "Ο ανομοιόμορφος τόνος δεν κρύβεται με περισσότερο μακιγιάζ. Φωτίζεται όταν η επιδερμίδα είναι ήρεμη και ομοιόμορφα ενυδατωμένη.",
    },
    en: {
      title: "Glow & dark spots",
      body: "Uneven tone is not fixed with more makeup. It brightens when skin is calm and evenly hydrated.",
    },
  },
  hydration: {
    el: {
      title: "Εντατική ενυδάτωση",
      body: "Η ξηρότητα δεν είναι απλώς «λίγη κρέμα ακόμα». Είναι δίψα πιο βαθιά — νερό, λιπίδια και φραγμός που κρατά την υγρασία μέσα.",
    },
    en: {
      title: "Deep hydration",
      body: "Dryness is not just “one more cream.” It is a deeper thirst — water, lipids, and a barrier that can hold moisture in.",
    },
  },
  "oil-control": {
    el: {
      title: "Πόροι & σμήγμα",
      body: "Η λιπαρή λάμψη δεν είναι υγεία. Οι πόροι γεμίζουν όταν το σμήγμα δεν βρίσκει ρυθμό. Εδώ ψάχνουμε ματ αποτέλεσμα που δεν τραβάει.",
    },
    en: {
      title: "Pores & oil",
      body: "An oily shine is not healthy skin. Pores fill when oil has no rhythm. Here we look for a matte feel that does not leave skin tight.",
    },
  },
};

const skinTypes: Record<string, Record<Locale, IntentCopy>> = {
  oily: {
    el: {
      title: "Λιπαρό δέρμα",
      body: "Δεν χρειάζεσαι να το «στεγνώσεις». Χρειάζεσαι καθαρισμό που σέβεται τον φραγμό και υφή που δεν πυροδοτεί κι άλλο λάδι.",
    },
    en: {
      title: "Oily skin",
      body: "You do not need to dry it out. You need a cleanse that respects the barrier, and textures that do not trigger more oil.",
    },
  },
  dry: {
    el: {
      title: "Ξηρό δέρμα",
      body: "Αν τραβάει μετά τον καθαρισμό, δεν φταίς εσύ. Το δέρμα σου κρατά λίγη υγρασία — και η ρουτίνα πρέπει να την επιστρέφει.",
    },
    en: {
      title: "Dry skin",
      body: "If skin feels tight after cleansing, that is not your fault. It holds onto little moisture — the routine has to give it back.",
    },
  },
  combination: {
    el: {
      title: "Μικτό δέρμα",
      body: "Λάδι στη ζώνη Τ, ξηρότητα αλλού. Δεν υπάρχει ένα προϊόν για όλα. Υπάρχει ισορροπία ανάμεσα στα δύο.",
    },
    en: {
      title: "Combination skin",
      body: "Oil through the T-zone, dryness everywhere else. There is no single product for both. There is a balance between them.",
    },
  },
  sensitive: {
    el: {
      title: "Ευαίσθητη επιδερμίδα",
      body: "Αν κοκκινίζει ή τσούζει εύκολα, δεν είσαι «δύσκολη». Η επιδερμίδα σου απλώς αντέχει λιγότερα — και αυτό είναι αρκετό για να διαλέξουμε πιο ήσυχα.",
    },
    en: {
      title: "Sensitive skin",
      body: "If it flushes or stings easily, you are not difficult. Your skin simply tolerates less — and that is enough reason to choose quieter formulas.",
    },
  },
  normal: {
    el: {
      title: "Κανονικό δέρμα",
      body: "Όταν το δέρμα είναι σχετικά ήρεμο, ο στόχος δεν είναι να το αλλάξεις. Είναι να το κρατήσεις έτσι, χωρίς περιττά βήματα.",
    },
    en: {
      title: "Normal skin",
      body: "When skin is mostly calm, the goal is not to change it. It is to keep it that way, without extra steps.",
    },
  },
};

type Row = {
  name: string;
  nameEl: string;
  slug: string;
  story: string | null;
  storyEn: string | null;
};

export function resolveSkinIntent(
  locale: Locale,
  concern?: Row | null,
  skin?: Row | null
): (IntentCopy & { kind: "goal" | "skin" }) | null {
  if (concern) {
    const fallback = goals[concern.slug]?.[locale];
    const title =
      (locale === "el" ? concern.nameEl : concern.name) ||
      fallback?.title ||
      concern.name ||
      concern.nameEl;
    const body =
      (locale === "el" ? concern.story : concern.storyEn)?.trim() ||
      fallback?.body ||
      "";
    if (!title) return null;
    return { kind: "goal", title, body };
  }
  if (skin) {
    const fallback = skinTypes[skin.slug]?.[locale];
    const title =
      (locale === "el" ? skin.nameEl : skin.name) ||
      fallback?.title ||
      skin.name;
    const body =
      (locale === "el" ? skin.story : skin.storyEn)?.trim() ||
      fallback?.body ||
      "";
    if (!title) return null;
    return { kind: "skin", title, body };
  }
  return null;
}

export function skinIntentCopy(
  locale: Locale,
  concern?: string,
  skinType?: string
): (IntentCopy & { kind: "goal" | "skin" }) | null {
  if (concern && goals[concern]) {
    return { kind: "goal", ...goals[concern][locale] };
  }
  if (skinType && skinTypes[skinType]) {
    return { kind: "skin", ...skinTypes[skinType][locale] };
  }
  return null;
}
