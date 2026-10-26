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

export function formatAdminDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
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
