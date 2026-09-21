import { StorefrontChrome } from "@/components/layout/storefront-chrome";
import { getNavigationData } from "@/server/repositories/navigation.repository";

// Catalog lives in Postgres — never statically prerender against the DB at build time.
export const dynamic = "force-dynamic";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigation = await getNavigationData();

  return (
    <StorefrontChrome navigation={navigation}>{children}</StorefrontChrome>
  );
}
