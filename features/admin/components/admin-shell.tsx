"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ExternalLink, LogOut, Menu, X } from "lucide-react";
import { SiteLogo } from "@/components/layout/site-logo";
import {
  AdminNav,
  adminPageContext,
  type AdminNavBadges,
} from "@/features/admin/components/admin-nav";
import { cn } from "@/lib/utils";

type Props = {
  email: string;
  logoutAction: () => void | Promise<void>;
  badges?: AdminNavBadges;
  children: React.ReactNode;
};

export function AdminShell({ email, logoutAction, badges, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { section, title } = adminPageContext(pathname);
  const initial = (email.trim().charAt(0) || "A").toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div data-admin className="flex min-h-screen font-sans text-ink">
      <aside className="sticky top-0 z-30 hidden h-screen w-64 shrink-0 flex-col border-r border-ink/[0.07] bg-[#f1efec] lg:flex">
        <SidebarBrand />
        <AdminNav badges={badges} />
        <SidebarFooter email={email} initial={initial} logoutAction={logoutAction} />
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <button
          type="button"
          aria-label="Close menu"
          className={cn(
            "absolute inset-0 bg-ink/30 backdrop-blur-sm transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setOpen(false)}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] flex-col bg-[#f1efec] shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between pr-3">
            <SidebarBrand />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-ink/[0.05] hover:text-ink"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <AdminNav badges={badges} onNavigate={() => setOpen(false)} />
          <SidebarFooter email={email} initial={initial} logoutAction={logoutAction} />
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-ink/[0.07] bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-xl">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-10">
            <button
              type="button"
              className="-ml-1.5 inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink transition-colors hover:bg-ink/[0.05] lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
              <span className="hidden text-ink-muted sm:inline">{section}</span>
              <ChevronRight
                className="hidden h-3.5 w-3.5 text-ink/25 sm:inline"
                aria-hidden
              />
              <span className="truncate font-semibold text-ink">{title}</span>
            </div>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-ink/[0.1] bg-white px-3 text-[13px] font-medium text-ink/80 shadow-[0_1px_2px_rgba(28,25,23,0.05)] transition-colors hover:border-ink/20 hover:text-ink"
            >
              <span className="hidden sm:inline">View store</span>
              <span className="sm:hidden">Store</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-60" aria-hidden />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[88rem] flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="animate-soft-enter">{children}</div>
        </main>
      </div>
    </div>
  );
}

function SidebarBrand() {
  return (
    <div className="flex h-16 items-center gap-2.5 px-6">
      <SiteLogo href="/admin" height={24} />
      <span className="rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
        Admin
      </span>
    </div>
  );
}

function SidebarFooter({
  email,
  initial,
  logoutAction,
}: {
  email: string;
  initial: string;
  logoutAction: () => void | Promise<void>;
}) {
  return (
    <div className="mt-auto border-t border-ink/[0.07] p-3">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white"
          aria-hidden
        >
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-ink">{email}</p>
          <p className="text-xs text-ink-muted">Administrator</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            title="Log out"
            aria-label="Log out"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-ink/[0.06] hover:text-ink"
          >
            <LogOut className="h-4 w-4" aria-hidden />
          </button>
        </form>
      </div>
    </div>
  );
}
