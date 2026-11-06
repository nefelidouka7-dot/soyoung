import { revalidateTag } from "next/cache";

/**
 * Cross-request caches for data every storefront page reads but that only the
 * admin changes. Admin actions call these right after a write so the shop
 * shows the change on the next request (a 1h TTL is the safety net).
 */
export const NAVIGATION_CACHE_TAG = "navigation";
export const STORE_SETTINGS_CACHE_TAG = "store-settings";

/** Categories, brands, skin types/concerns, or active products changed. */
export function invalidateNavigation() {
  revalidateTag(NAVIGATION_CACHE_TAG, { expire: 0 });
}

export function invalidateStoreSettings() {
  revalidateTag(STORE_SETTINGS_CACHE_TAG, { expire: 0 });
}
