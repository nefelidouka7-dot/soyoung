import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { STORE_NAME } from "@/lib/utils";
import { AdminNav } from "@/features/admin/components/admin-nav";
import { logoutAction } from "@/features/auth/actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: {
    default: "Admin",
    template: `%s · Admin · ${STORE_NAME}`,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-bg-muted font-sans text-ink">
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-oak/40 bg-white">
        <div className="border-b border-oak/40 px-4 py-4">
          <Link href="/admin" className="font-serif text-xl tracking-tight text-ink">
            {STORE_NAME}
          </Link>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-ink-muted">
            Admin CMS
          </p>
        </div>
        <AdminNav />
        <div className="mt-auto border-t border-oak/40 px-4 py-3">
          <p className="truncate text-xs text-ink-muted">{session.user.email}</p>
          <Link
            href="/"
            className="mt-1 inline-block text-xs font-medium text-sage hover:underline"
          >
            ← Back to storefront
          </Link>
          <form action={logoutAction} className="mt-3">
            <button
              type="submit"
              className="text-xs font-medium text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              Log out
            </button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
