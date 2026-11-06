/**
 * Create (or reset) a real admin account and remove the seed's demo accounts.
 *
 *   npm run admin:setup -- --email you@example.gr
 *   npm run admin:setup -- --email you@example.gr --remove-demo
 *
 * The password is asked for interactively (never pass it as an argument: it
 * would end up in shell history). Uses DATABASE_URL from the environment or
 * `.env`; for production, pull the Vercel env first and point DATABASE_URL at
 * the production database.
 *
 * --remove-demo deletes the seed accounts admin@soyoung.com and
 * customer@soyoung.com (whose password is public in the README) and the demo
 * customer's orders.
 */
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { resolveDatabaseUrl } from "../db/env";

config({ path: ".env" });

const DEMO_ADMIN = "admin@soyoung.com";
const DEMO_CUSTOMER = "customer@soyoung.com";

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

/** Read a line without echoing it to the terminal. */
function askHidden(question: string): Promise<string> {
  let muted = false;
  const output = new Writable({
    write(chunk, _enc, done) {
      if (!muted) process.stdout.write(chunk);
      done();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const removeDemo = process.argv.includes("--remove-demo");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Usage: npm run admin:setup -- --email you@example.gr [--remove-demo]");
    process.exit(1);
  }
  if (email === DEMO_ADMIN || email === DEMO_CUSTOMER) {
    console.error(`Use your own email, not the demo account ${email}.`);
    process.exit(1);
  }

  const url = resolveDatabaseUrl();
  if (!url) {
    console.error("Missing DATABASE_URL.");
    process.exit(1);
  }
  console.log(`Database host: ${new URL(url).hostname}`);

  const password = await askHidden("New admin password (min 12 chars): ");
  if (password.length < 12) {
    console.error("Password too short (min 12 characters).");
    process.exit(1);
  }
  if ((await askHidden("Repeat password: ")) !== password) {
    console.error("Passwords don't match.");
    process.exit(1);
  }

  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    // passwordChangedAt invalidates sessions signed in with the old password.
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        passwordHash,
        role: "ADMIN",
        active: true,
        passwordChangedAt: new Date(),
        wishlist: { create: {} },
        cart: { create: {} },
      },
      update: { passwordHash, role: "ADMIN", active: true, passwordChangedAt: new Date() },
    });
    console.log(`✓ Admin ready: ${user.email}`);

    if (removeDemo) {
      const orders = await prisma.order.deleteMany({ where: { email: DEMO_CUSTOMER } });
      const users = await prisma.user.deleteMany({
        where: { email: { in: [DEMO_ADMIN, DEMO_CUSTOMER] } },
      });
      console.log(`✓ Removed ${users.count} demo account(s) and ${orders.count} demo order(s).`);
    } else {
      const demo = await prisma.user.count({
        where: { email: { in: [DEMO_ADMIN, DEMO_CUSTOMER] } },
      });
      if (demo > 0) {
        console.log(
          `! ${demo} demo account(s) still exist. Sign in with ${email}, then rerun with --remove-demo.`
        );
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
