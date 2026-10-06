import {
  COD_FEE,
  STANDARD_SHIPPING_FEE,
  STORE_PICKUP,
} from "@/lib/checkout-options";
import { FREE_SHIPPING_THRESHOLD, STORE_NAME } from "@/lib/utils";

export const STORE_SETTING_KEY = "store";

export type StorePickupSettings = {
  name: string;
  line1: string;
  line2: string | null;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
};

export type StoreSettings = {
  name: string;
  currency: string;
  freeShippingThreshold: number;
  standardShippingFee: number;
  codFee: number;
  pickup: StorePickupSettings;
};

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  name: STORE_NAME,
  currency: "EUR",
  freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  standardShippingFee: STANDARD_SHIPPING_FEE,
  codFee: COD_FEE,
  pickup: {
    name: STORE_PICKUP.name,
    line1: STORE_PICKUP.line1,
    line2: STORE_PICKUP.line2 ?? null,
    city: STORE_PICKUP.city,
    postalCode: STORE_PICKUP.postalCode,
    country: STORE_PICKUP.country,
    phone: STORE_PICKUP.phone,
  },
};

function positive(n: unknown, fallback: number) {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) && v >= 0 ? v : fallback;
}

function str(n: unknown, fallback: string) {
  return typeof n === "string" && n.trim() ? n.trim() : fallback;
}

export function parseStoreSettings(value: unknown): StoreSettings {
  const base = DEFAULT_STORE_SETTINGS;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return base;
  }
  const v = value as Record<string, unknown>;
  const pickupRaw =
    v.pickup && typeof v.pickup === "object" && !Array.isArray(v.pickup)
      ? (v.pickup as Record<string, unknown>)
      : {};

  return {
    name: str(v.name, base.name),
    currency: str(v.currency, base.currency),
    freeShippingThreshold: positive(
      v.freeShippingThreshold,
      base.freeShippingThreshold
    ),
    standardShippingFee: positive(
      v.standardShippingFee,
      base.standardShippingFee
    ),
    codFee: positive(v.codFee, base.codFee),
    pickup: {
      name: str(pickupRaw.name, base.pickup.name),
      line1: str(pickupRaw.line1, base.pickup.line1),
      line2:
        pickupRaw.line2 == null || pickupRaw.line2 === ""
          ? null
          : str(pickupRaw.line2, base.pickup.line2 ?? ""),
      city: str(pickupRaw.city, base.pickup.city),
      postalCode: str(pickupRaw.postalCode, base.pickup.postalCode),
      country: str(pickupRaw.country, base.pickup.country),
      phone: str(pickupRaw.phone, base.pickup.phone),
    },
  };
}
