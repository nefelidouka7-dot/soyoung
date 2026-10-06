import { PrismaClient } from "@prisma/client";
import { resolveDatabaseUrl } from "@/db/env";

resolveDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/** After `prisma generate`, a hot-reloaded Next process can keep a stale singleton. */
function isStaleClient(client: PrismaClient) {
  const heroSlide = (client as unknown as { heroSlide?: { findMany?: unknown } })
    .heroSlide;
  return typeof heroSlide?.findMany !== "function";
}

const existing = globalForPrisma.prisma;
if (existing && process.env.NODE_ENV !== "production" && isStaleClient(existing)) {
  void existing.$disconnect();
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
