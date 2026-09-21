import CategoryListingPage from "@/features/products/components/product-listing";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  return (
    <CategoryListingPage
      params={Promise.resolve({ category: undefined })}
      searchParams={Promise.resolve({ ...sp, offers: "1" })}
    />
  );
}
