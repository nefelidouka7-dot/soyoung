import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";
import { ADMIN_ROLES } from "@/lib/admin-access";

export { ADMIN_ROLES, OPERATIONS_ROLES, OWNER_ROLES } from "@/lib/admin-access";

/**
 * Guard for admin pages and server actions (actions are public endpoints, so
 * each one must call this). `allowed` narrows access below the full admin set.
 */
export async function requireAdmin(allowed: Role[] = ADMIN_ROLES) {
  const session = await auth();
  const role = session?.user?.role;
  const id = session?.user?.id;
  if (!session || !id || !role || !ADMIN_ROLES.includes(role)) {
    redirect("/login?callbackUrl=/admin");
  }
  if (!allowed.includes(role)) {
    redirect("/admin");
  }
  return session;
}

/** The shop's wall clock. Servers (e.g. Vercel) run in UTC. */
export const STORE_TIME_ZONE = "Europe/Athens";

/** Milliseconds the store's time zone is ahead of UTC at instant `ts`. */
function storeOffsetMs(ts: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: STORE_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(ts));
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second")
  );
  return asUtc - Math.floor(ts / 1000) * 1000;
}

/**
 * Parse a `<input type="datetime-local">` value ("2026-11-06T14:30") as store
 * local time. `new Date(value)` would read it in the server's zone (UTC).
 */
export function parseStoreDateTime(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value.trim());
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const wall = Date.UTC(y, mo - 1, d, h, mi);
  let ts = wall - storeOffsetMs(wall);
  // Around a DST switch the offset at the real instant can differ.
  const corrected = wall - storeOffsetMs(ts);
  if (corrected !== ts) ts = corrected;
  return new Date(ts);
}

export function formatAdminDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: STORE_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(typeof date === "string" ? new Date(date) : date);
}

export function decimalToNumber(value: { toString(): string } | number | null | undefined) {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return Number(value.toString());
}
