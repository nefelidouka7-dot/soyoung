import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";

const ADMIN_ROLES: Role[] = ["ADMIN", "SUPER_ADMIN", "MANAGER", "EDITOR"];

export async function requireAdmin() {
  const session = await auth();
  const role = session?.user?.role;
  const id = session?.user?.id;
  if (!session || !id || !role || !ADMIN_ROLES.includes(role)) {
    redirect("/login?callbackUrl=/admin");
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
