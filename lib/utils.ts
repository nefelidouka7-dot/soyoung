import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | string, currency = "EUR") {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function appBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ?? "";
  // Must be an absolute http(s) origin — values like "" or "/" break metadataBase.
  if (/^https?:\/\//i.test(explicit)) return explicit;

  // Vercel sets this automatically during build/runtime (host only, no protocol).
  const vercel = process.env.VERCEL_URL?.trim().replace(/\/$/, "") ?? "";
  if (vercel && !/^https?:\/\//i.test(vercel)) return `https://${vercel}`;
  if (/^https?:\/\//i.test(vercel)) return vercel;

  return "http://localhost:3000";
}

export function absoluteUrl(path = "") {
  const base = appBaseUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Safe origin for Next.js metadataBase — never throws on bad env. */
export function metadataBaseUrl(): URL {
  try {
    return new URL(appBaseUrl());
  } catch {
    return new URL("http://localhost:3000");
  }
}

function parsePositiveNumber(value: string | undefined, fallback: number) {
  const n = Number(value?.trim());
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const FREE_SHIPPING_THRESHOLD = parsePositiveNumber(
  process.env.FREE_SHIPPING_THRESHOLD,
  50
);

export const STORE_NAME =
  process.env.NEXT_PUBLIC_STORE_NAME?.trim() || "SoYoung";
