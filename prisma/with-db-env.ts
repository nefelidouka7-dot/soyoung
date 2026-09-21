/**
 * Run Prisma CLI with Neon `db_*` env vars mapped to DATABASE_URL.
 * Usage: tsx prisma/with-db-env.ts db push
 */
import { spawnSync } from "node:child_process";
import { config } from "dotenv";
import { resolveDatabaseUrl } from "../db/env";

config({ path: ".env" });

if (!resolveDatabaseUrl()) {
  console.error(
    "Missing database URL. Set DATABASE_URL or db_POSTGRES_PRISMA_URL."
  );
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: tsx prisma/with-db-env.ts <prisma args>");
  process.exit(1);
}

const result = spawnSync("npx", ["prisma", ...args], {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
