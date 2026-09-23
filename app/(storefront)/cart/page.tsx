"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore } from "@/features/cart/store";
import { formatPrice, FREE_SHIPPING_THRESHOLD, cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";

export default function CartPage() {
  const { dict, t } = useTranslation();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="container-page py-16 lg:py-24">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center border border-oak/50 bg-bg-muted">
            <ShoppingBag className="h-6 w-6 text-ink-muted" strokeWidth={1.25} />
          </div>
          <h1 className="mt-8 font-serif text-3xl text-ink sm:text-4xl">
            {dict.cart.emptyTitle}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            {dict.cart.emptyDescription}
          </p>
          <Link
            href="/skincare"
            className="mt-8 inline-flex h-12 items-center bg-sage px-8 text-xs uppercase tracking-wide font-bold text-white transition-colors hover:bg-sage-dark"
          >
            {dict.cart.shopSkincare}
          </Link>
          <Link
            href="/"
            className="mt-4 text-xs uppercase tracking-wide text-ink-muted transition-colors hover:text-ink"
          >
            {dict.checkout.continueShopping}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-28">
      <div className="border-b border-oak/30 bg-bg-muted/40">
        <div className="container-page py-8 lg:py-10">
          <p className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">
            {dict.nav.cart}
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-serif text-3xl text-ink sm:text-4xl">
              {dict.cart.yourBag}
            </h1>
            <p className="text-sm text-ink-muted">
              {t((d) => d.cart.itemsCount, { count: itemCount })}
            </p>
          </div>
        </div>
      </div>

      <div className="container-page mt-8 grid items-start gap-10 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,20rem)] lg:gap-14">
        <div>
          <div className="border-b border-oak/35 pb-4">
            {remaining > 0 ? (
              <>
                <div className="flex items-center justify-between gap-4 text-xs text-ink-muted">
                  <span>
                    {t((d) => d.cart.awayFromFree, {
                      amount: formatPrice(remaining),
                    })}
                  </span>
                  <span className="shrink-0 uppercase tracking-wider">
                    {dict.cart.freeShipping}
                  </span>
                </div>
                <div className="mt-3 h-1 w-full bg-oak/25">
                  <div
                    className="h-full bg-sage transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-sage-dark">{dict.cart.unlockedFree}</p>
            )}
          </div>

          <ul className="divide-y divide-oak/30">
            {items.map((item) => (
              <li
                key={`${item.productId}-${item.variantId}`}
                className="flex gap-4 py-6 sm:gap-6"
              >
                <Link
                  href={`/product/${item.slug}`}
                  className="relative block h-[7.5rem] w-[6.25rem] shrink-0 overflow-hidden bg-bg-muted sm:h-36 sm:w-[7.5rem]"
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-contain p-2"
                    sizes="120px"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                        {item.brand}
                      </p>
                      <Link
                        href={`/product/${item.slug}`}
                        className="mt-1 block font-serif text-lg leading-snug text-ink transition-opacity hover:opacity-65"
                      >
                        {item.name}
                      </Link>
                      {item.variantName ? (
                        <p className="mt-1 text-xs text-ink-muted">
                          {item.variantName}
                        </p>
                      ) : null}
                    </div>
                    <p className="shrink-0 text-sm tabular-nums text-ink">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                    <div className="inline-flex items-center border border-oak/50">
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center text-ink transition-opacity hover:opacity-55"
                        aria-label={dict.cart.decreaseQty}
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            Math.max(1, item.quantity - 1),
                            item.variantId
                          )
                        }
                      >
                        <Minus className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                      <span className="w-8 text-center text-sm tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center text-ink transition-opacity hover:opacity-55"
                        aria-label={dict.cart.increaseQty}
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            Math.min(item.maxStock, item.quantity + 1),
                            item.variantId
                          )
                        }
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      {item.quantity > 1 ? (
                        <p className="text-xs text-ink-muted">
                          {formatPrice(item.price)} / 1
                        </p>
                      ) : null}
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 text-xs text-ink-muted transition-colors hover:text-ink"
                        onClick={() =>
                          removeItem(item.productId, item.variantId)
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {dict.cart.remove}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Link
            href="/skincare"
            className="mt-2 inline-flex text-xs uppercase tracking-wide text-ink-muted transition-colors hover:text-ink"
          >
            {dict.checkout.continueShopping}
          </Link>
        </div>

        <aside className="border border-oak/40 bg-bg-muted/70 p-6 lg:sticky lg:top-24">
          <h2 className="font-serif text-xl text-ink">{dict.checkout.summary}</h2>

          <div className="mt-6 space-y-3 border-b border-oak/35 pb-5 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-ink-muted">{dict.cart.subtotal}</span>
              <span className="tabular-nums text-ink">
                {formatPrice(subtotal)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-ink-muted">{dict.checkout.shipping}</span>
              <span
                className={cn(
                  "tabular-nums",
                  remaining > 0 ? "text-ink-muted" : "text-sage-dark"
                )}
              >
                {remaining > 0
                  ? dict.cart.shippingAtCheckout
                  : dict.checkout.freeShipping}
              </span>
            </div>
          </div>

          <div className="mt-5 flex items-baseline justify-between gap-4">
            <span className="text-sm text-ink">{dict.checkout.total}</span>
            <span className="font-serif text-2xl tabular-nums text-ink">
              {formatPrice(subtotal)}
            </span>
          </div>

          <Link
            href="/checkout"
            className="mt-6 flex h-12 items-center justify-center bg-sage text-xs uppercase tracking-wide font-bold text-white transition-colors hover:bg-sage-dark"
          >
            {dict.cart.checkout}
          </Link>
        </aside>
      </div>
    </div>
  );
}
