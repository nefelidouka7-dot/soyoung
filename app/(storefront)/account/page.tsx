import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/db/prisma";
import { logoutAction } from "@/features/auth/actions";
import { formatPrice } from "@/lib/utils";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/details", label: "Account details" },
];

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <div className="container-page py-10 lg:py-14">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-56">
          <h1 className="font-serif text-3xl">Account</h1>
          <p className="mt-1 text-sm text-ink-muted">{session.user.email}</p>
          <nav className="mt-6 space-y-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block py-2 text-sm text-ink-muted hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <form action={logoutAction} className="mt-6">
            <button type="submit" className="text-xs uppercase tracking-wider text-ink-muted underline-offset-4 hover:underline">
              Sign out
            </button>
          </form>
        </aside>
        <div className="flex-1">
          <h2 className="font-serif text-2xl">Overview</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Welcome back{session.user.name ? `, ${session.user.name}` : ""}.
          </p>
          <section className="mt-8">
            <h3 className="text-xs uppercase tracking-wider text-ink">
              Recent orders
            </h3>
            {orders.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">
                No orders yet.{" "}
                <Link href="/skincare" className="underline">
                  Start shopping
                </Link>
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-oak/40 border border-oak/40">
                {orders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-4 bg-bg-muted px-4 py-3">
                    <div>
                      <Link href={`/account/orders/${o.id}`} className="text-sm font-medium hover:underline">
                        {o.orderNumber}
                      </Link>
                      <p className="text-xs text-ink-muted">
                        {o.createdAt.toLocaleDateString("en-GB")} · {o.status}
                      </p>
                    </div>
                    <span className="text-sm">{formatPrice(Number(o.total))}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
