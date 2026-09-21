import { Suspense } from "react";
import CategoryListingPage from "@/features/products/components/product-listing";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={null}>
      <CategoryListingPage
        params={Promise.resolve({ category: "skincare" })}
        searchParams={searchParams}
      />
    </Suspense>
  );
}
