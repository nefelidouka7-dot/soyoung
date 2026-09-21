import { cookies } from "next/headers";
import { DEFAULT_LOCALE, getDictionary, type Locale } from "@/lib/i18n";

export const LOCALE_COOKIE = "soyoung-locale";

export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  const v = c.get(LOCALE_COOKIE)?.value;
  return v === "en" || v === "el" ? v : DEFAULT_LOCALE;
}

export async function getServerDictionary() {
  return getDictionary(await getLocale());
}
