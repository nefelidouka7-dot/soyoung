/**
 * Ensures Neon has schema + demo catalog during Vercel builds.
 * - Always runs `prisma db push`
 * - Seeds only when the Product table is empty (safe on redeploy)
 */
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { resolveDatabaseUrl } from "../db/env";

function runPrisma(args: string[]) {
  const result = spawnSync("npx", ["prisma", ...args], {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if ((result.status ?? 1) !== 0) {
    throw new Error(`prisma ${args.join(" ")} failed with code ${result.status}`);
  }
}

/**
 * Prisma cannot add a required column with an app-level default when rows exist.
 * Backfill Order.accessToken / User.passwordChangedAt before `db push`.
 */
async function backfillSecurityColumns(url: string) {
  const prisma = new PrismaClient({
    datasources: { db: { url } },
  });
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "accessToken" TEXT`
    );
    await prisma.$executeRawUnsafe(`
      UPDATE "Order"
      SET "accessToken" = md5(random()::text || id || clock_timestamp()::text)
      WHERE "accessToken" IS NULL
    `);
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Order" ALTER COLUMN "accessToken" SET NOT NULL`
    );
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'Order_accessToken_key'
        ) THEN
          ALTER TABLE "Order" ADD CONSTRAINT "Order_accessToken_key" UNIQUE ("accessToken");
        END IF;
      END $$
    `);
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "Order_accessToken_idx" ON "Order"("accessToken")`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3)`
    );
    console.log("[ensure-catalog] Security columns backfilled (if needed).");
  } catch (error) {
    // Fresh DB / missing tables — db push will create them.
    console.warn("[ensure-catalog] Security backfill skipped:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const url = resolveDatabaseUrl();
  if (!url) {
    console.warn(
      "[ensure-catalog] No DATABASE_URL / db_POSTGRES_PRISMA_URL — skipping."
    );
    return;
  }

  await backfillSecurityColumns(url);

  console.log("[ensure-catalog] Pushing schema…");
  runPrisma(["db", "push", "--skip-generate"]);

  const prisma = new PrismaClient({
    datasources: { db: { url } },
  });
  try {
    const count = await prisma.product.count();
    if (count > 0) {
      console.log(`[ensure-catalog] Catalog already has ${count} products — skip seed.`);
      return;
    }
  } catch (error) {
    console.warn("[ensure-catalog] Could not count products:", error);
  } finally {
    await prisma.$disconnect();
  }

  console.log("[ensure-catalog] Empty catalog — running seed…");
  runPrisma(["db", "seed"]);
}

main().catch((error) => {
  console.error("[ensure-catalog] Failed:", error);
  process.exit(1);
});
