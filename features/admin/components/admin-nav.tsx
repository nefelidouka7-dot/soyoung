"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tags,
  ShoppingBag,
  Users,
  TicketPercent,
  Star,
  Warehouse,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

type NavGroup = {
  label: string;
  links: NavLink[];
};

const groups: NavGroup[] = [
  {
    label: "Overview",
    links: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Catalog",
    links: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
      { href: "/admin/brands", label: "Brands", icon: Tags },
      { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
    ],
  },
  {
    label: "Commerce",
    links: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/discounts", label: "Discounts", icon: TicketPercent },
    ],
  },
  {
    label: "Content",
    links: [
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

function isActive(pathname: string, link: NavLink) {
  return link.exact
    ? pathname === link.href
    : pathname === link.href || pathname.startsWith(`${link.href}/`);
}

export type AdminNavBadges = Partial<Record<string, number>>;

export function AdminNav({
  onNavigate,
  badges,
}: {
  onNavigate?: () => void;
  badges?: AdminNavBadges;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-5">
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[11px] font-medium text-ink-muted/75">
              {group.label}
            </p>
            <ul className="space-y-px">
              {group.links.map((link) => {
                const active = isActive(pathname, link);
                const Icon = link.icon;
                const count = badges?.[link.href] ?? 0;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      onClick={onNavigate}
                      className={cn(
                        "group flex h-9 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150",
                        active
                          ? "bg-white font-semibold text-ink shadow-[0_1px_2px_rgba(28,25,23,0.06),0_0_0_1px_rgba(28,25,23,0.06)]"
                          : "font-medium text-ink-muted hover:bg-ink/[0.04] hover:text-ink"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          active
                            ? "text-sage-dark"
                            : "text-ink-muted/60 group-hover:text-ink/80"
                        )}
                        aria-hidden
                      />
                      <span className="flex-1 truncate">{link.label}</span>
                      {count > 0 ? (
                        <span
                          className={cn(
                            "min-w-5 rounded-full px-1.5 text-center text-[11px] font-semibold leading-5 tabular-nums",
                            active
                              ? "bg-coral text-white"
                              : "bg-ink/[0.07] text-ink/70"
                          )}
                        >
                          {count > 99 ? "99+" : count}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

export function adminPageContext(pathname: string): {
  section: string;
  title: string;
} {
  for (const group of groups) {
    for (const link of group.links) {
      if (isActive(pathname, link)) return { section: group.label, title: link.label };
    }
  }
  return { section: "Admin", title: "Admin" };
}
