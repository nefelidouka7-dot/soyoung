"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";

const LINKS = [
  { href: "/account", labelKey: "overview" as const, exact: true },
  { href: "/account/orders", labelKey: "orders" as const },
  { href: "/account/wishlist", labelKey: "wishlist" as const },
  { href: "/account/addresses", labelKey: "addresses" as const },
  { href: "/account/details", labelKey: "details" as const },
];

export function AccountNav() {
  const pathname = usePathname();
  const { dict } = useTranslation();

  return (
    <nav aria-label={dict.account.title} className="space-y-6">
      <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0">
        {LINKS.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors lg:border-b-0 lg:border-l-2 lg:px-0 lg:pl-3 lg:py-2",
                  active
                    ? "border-ink text-ink"
                    : "border-transparent text-ink-muted hover:text-ink"
                )}
              >
                {dict.account[link.labelKey]}
              </Link>
            </li>
          );
        })}
      </ul>

      <form action={logoutAction} className="hidden lg:block">
        <button
          type="submit"
          className="pl-3 text-[11px] uppercase tracking-[0.14em] text-ink-muted transition-colors hover:text-ink"
        >
          {dict.account.signOut}
        </button>
      </form>
    </nav>
  );
}

export function AccountSignOutMobile() {
  const { dict } = useTranslation();

  return (
    <form action={logoutAction} className="mt-10 lg:hidden">
      <button
        type="submit"
        className="text-[11px] uppercase tracking-[0.14em] text-ink-muted transition-colors hover:text-ink"
      >
        {dict.account.signOut}
      </button>
    </form>
  );
}
