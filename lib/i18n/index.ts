import { el } from "./dictionaries/el";
import { en } from "./dictionaries/en";
import {
  DEFAULT_LOCALE,
  type Dictionary,
  type Locale,
} from "./types";

const dictionaries: Record<Locale, Dictionary> = { el, en };

export function getDictionary(locale: Locale = DEFAULT_LOCALE): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

export function interpolate(
  template: string,
  vars: Record<string, string | number>
) {
  return Object.entries(vars).reduce(
    (s, [key, value]) => s.replaceAll(`{${key}}`, String(value)),
    template
  );
}

export { DEFAULT_LOCALE, type Dictionary, type Locale };
export { LOCALES } from "./types";
