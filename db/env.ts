/**
 * Neon’s Vercel integration prefixes vars with `db_` (e.g. db_POSTGRES_PRISMA_URL).
 * Prisma expects DATABASE_URL — map once before creating a client.
 */
export function resolveDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL?.trim()) {
    return process.env.DATABASE_URL.trim();
  }

  const fromNeon =
    process.env.db_POSTGRES_PRISMA_URL?.trim() ||
    process.env.db_POSTGRES_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL?.trim();

  if (fromNeon) {
    process.env.DATABASE_URL = fromNeon;
    return fromNeon;
  }

  return undefined;
}
