/**
 * Search adapter — Postgres ILIKE now; swap for Meilisearch later.
 */

export type SearchHit = {
  id: string;
  type: "product" | "brand" | "category";
  title: string;
  href: string;
};

export interface SearchAdapter {
  search(query: string): Promise<SearchHit[]>;
}

export { searchCatalog as postgresSearch } from "@/features/search/actions";
