import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/db/prisma";
import { formatPrice } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/orders");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="container-page py-10 lg:py-14">
      <Link href="/account" className="text-xs uppercase tracking-wider text-ink-muted hover:underline">
        ← Account
      </Link>
      <h1 className="mt-4 font-serif text-3xl">Orders</h1>
      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="When you place an order, it will appear here."
          action={{ label: "Shop now", href: "/skincare" }}
        />
      ) : (
        <ul className="mt-8 divide-y divide-oak/40 border border-oak/40">
          {orders.map((o) => (
            <li key={o.id} className="bg-bg-muted px-4 py-4 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link href={`/account/orders/${o.id}`} className="font-medium hover:underline">
                    {o.orderNumber}
                  </Link>
                  <p className="text-xs text-ink-muted">
                    {o.createdAt.toLocaleDateString("en-GB")} · {o.items.length} items · {o.status}
                  </p>
                </div>
                <span>{formatPrice(Number(o.total))}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
