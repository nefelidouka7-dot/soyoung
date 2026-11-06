import { cache } from "react";
import { prisma } from "@/db/prisma";
import {
  DEFAULT_STORE_SETTINGS,
  parseStoreSettings,
  STORE_SETTING_KEY,
  type StoreSettings,
} from "@/lib/store-settings";

export type {
  StoreSettings,
  StorePickupSettings,
  StoreBusinessSettings,
} from "@/lib/store-settings";
export {
  DEFAULT_STORE_SETTINGS,
  STORE_SETTING_KEY,
  parseStoreSettings,
} from "@/lib/store-settings";

/** Cached per request: the layout and pages (contact, legal) both read it. */
export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: STORE_SETTING_KEY },
    });
    return parseStoreSettings(row?.value);
  } catch (error) {
    console.error("[store-settings] Failed to load — using defaults:", error);
    return DEFAULT_STORE_SETTINGS;
  }
});

export async function saveStoreSettings(
  next: StoreSettings
): Promise<StoreSettings> {
  const value = {
    name: next.name,
    currency: next.currency,
    freeShippingThreshold: next.freeShippingThreshold,
    standardShippingFee: next.standardShippingFee,
    codFee: next.codFee,
    pickup: next.pickup,
    business: next.business,
  };

  await prisma.siteSetting.upsert({
    where: { key: STORE_SETTING_KEY },
    create: { key: STORE_SETTING_KEY, value },
    update: { value },
  });

  return next;
}
