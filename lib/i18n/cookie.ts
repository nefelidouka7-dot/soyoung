export const LOCALE_COOKIE = "soyoung-locale";

export function setLocaleCookie(locale: string) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax`;
}
