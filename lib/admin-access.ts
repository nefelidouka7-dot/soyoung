import type { Role } from "@prisma/client";

/** Every role that can open /admin. */
export const ADMIN_ROLES: Role[] = ["ADMIN", "SUPER_ADMIN", "MANAGER", "EDITOR"];
/** Orders, customers, coupons and stock — money and personal data. */
export const OPERATIONS_ROLES: Role[] = ["ADMIN", "SUPER_ADMIN", "MANAGER"];
/** Store-wide settings (shipping fees, COD, pickup address). */
export const OWNER_ROLES: Role[] = ["ADMIN", "SUPER_ADMIN"];

const RESTRICTED_PATHS: Array<[prefix: string, roles: Role[]]> = [
  ["/admin/settings", OWNER_ROLES],
  ["/admin/orders", OPERATIONS_ROLES],
  ["/admin/customers", OPERATIONS_ROLES],
  ["/admin/discounts", OPERATIONS_ROLES],
  ["/admin/inventory", OPERATIONS_ROLES],
];

/** Used by the admin nav to hide sections the role can't open. */
export function canAccessAdminPath(role: Role, path: string) {
  const rule = RESTRICTED_PATHS.find(
    ([prefix]) => path === prefix || path.startsWith(`${prefix}/`)
  );
  return rule ? rule[1].includes(role) : ADMIN_ROLES.includes(role);
}
