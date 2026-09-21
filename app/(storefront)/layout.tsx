import { StorefrontChrome } from "@/components/layout/storefront-chrome";
import { getNavigationData } from "@/server/repositories/navigation.repository";

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
