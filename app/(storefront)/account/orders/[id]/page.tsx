import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/db/prisma";
import { formatPrice } from "@/lib/utils";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: { items: true, timeline: { orderBy: { createdAt: "asc" } }, shipment: true, payment: true },
  });
  if (!order) notFound();

  return (
    <div className="container-page py-10 lg:py-14">
      <Link href="/account/orders" className="text-xs uppercase tracking-wider text-ink-muted hover:underline">
        ← Orders
      </Link>
      <h1 className="mt-4 font-serif text-3xl">{order.orderNumber}</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Placed {order.createdAt.toLocaleDateString("en-GB")} · {order.status}
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-xs uppercase tracking-wider">Products</h2>
          <ul className="mt-4 space-y-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 text-sm">
                <span>
                  {item.productName}
                  {item.variantName ? ` — ${item.variantName}` : ""} × {item.quantity}
                </span>
                <span>{formatPrice(Number(item.totalPrice))}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-1 border-t border-oak/40 pt-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(Number(order.subtotal))}</dd></div>
            <div className="flex justify-between"><dt>Shipping</dt><dd>{formatPrice(Number(order.shippingAmount))}</dd></div>
            <div className="flex justify-between"><dt>Discount</dt><dd>-{formatPrice(Number(order.discountAmount))}</dd></div>
            <div className="flex justify-between font-medium"><dt>Total</dt><dd>{formatPrice(Number(order.total))}</dd></div>
          </dl>
        </div>
        <div className="space-y-8">
          <div>
            <h2 className="text-xs uppercase tracking-wider">Shipping</h2>
            <p className="mt-3 text-sm text-ink-muted">
              {order.shippingName}<br />
              {order.shippingLine1}<br />
              {order.shippingLine2 ? <>{order.shippingLine2}<br /></> : null}
              {order.shippingPostal} {order.shippingCity}<br />
              {order.shippingCountry}
            </p>
          </div>
          <div>
            <h2 className="text-xs uppercase tracking-wider">Timeline</h2>
            <ol className="mt-3 space-y-2">
              {order.timeline.map((t) => (
                <li key={t.id} className="text-sm text-ink-muted">
                  <span className="text-ink">{t.status}</span> · {t.createdAt.toLocaleString("en-GB")}
                  {t.note ? ` — ${t.note}` : ""}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
