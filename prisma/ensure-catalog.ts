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

async function main() {
  const url = resolveDatabaseUrl();
  if (!url) {
    console.warn(
      "[ensure-catalog] No DATABASE_URL / db_POSTGRES_PRISMA_URL — skipping."
    );
    return;
  }

  console.log("[ensure-catalog] Pushing schema…");
  runPrisma(["db", "push", "--skip-generate"]);

  const prisma = new PrismaClient();
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
