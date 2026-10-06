import { prisma } from "@/db/prisma";
import {
  parseStoreSettings,
  STORE_SETTING_KEY,
  type StoreSettings,
} from "@/lib/store-settings";

export type { StoreSettings, StorePickupSettings } from "@/lib/store-settings";
export {
  DEFAULT_STORE_SETTINGS,
  STORE_SETTING_KEY,
  parseStoreSettings,
} from "@/lib/store-settings";

export async function getStoreSettings(): Promise<StoreSettings> {
  const row = await prisma.siteSetting.findUnique({
    where: { key: STORE_SETTING_KEY },
  });
  return parseStoreSettings(row?.value);
}

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
  };

  await prisma.siteSetting.upsert({
    where: { key: STORE_SETTING_KEY },
    create: { key: STORE_SETTING_KEY, value },
    update: { value },
  });

  return next;
}
