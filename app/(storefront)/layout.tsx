import { StorefrontChrome } from "@/components/layout/storefront-chrome";
import { getNavigationData } from "@/server/repositories/navigation.repository";
import { getStoreSettings } from "@/server/repositories/store-settings.repository";

// Catalog lives in Postgres — never statically prerender against the DB at build time.
export const dynamic = "force-dynamic";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [navigation, storeSettings] = await Promise.all([
    getNavigationData(),
    getStoreSettings(),
  ]);

  return (
    <StorefrontChrome navigation={navigation} storeSettings={storeSettings}>
      {children}
    </StorefrontChrome>
  );
}
