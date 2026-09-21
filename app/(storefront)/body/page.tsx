import CategoryListingPage from "@/features/products/components/product-listing";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <CategoryListingPage
      params={Promise.resolve({ category: "body" })}
      searchParams={searchParams}
    />
  );
}
