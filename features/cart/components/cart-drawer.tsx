"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useUIStore } from "@/lib/ui-store";
import { useCartStore } from "@/features/cart/store";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";

const ANIM_MS = 320;

export function CartDrawer() {
  const { dict, t } = useTranslation();
  const open = useUIStore((s) => s.cartOpen);
  const close = useUIStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(id);
    }

    setVisible(false);
    const t = window.setTimeout(() => setMounted(false), ANIM_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={close}
        aria-label={dict.cart.closeCart}
      />
      <aside
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-[#D0B89A]/60 bg-[#FAF4ED] text-[#2B2927] shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={dict.cart.yourBag}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#D0B89A]/50 px-5">
          <h2 className="font-serif text-xl text-[#2B2927]">{dict.cart.yourBag}</h2>
          <button
            type="button"
            onClick={close}
            className="inline-flex h-9 w-9 items-center justify-center"
            aria-label={dict.cart.closeCart}
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="shrink-0 border-b border-[#D0B89A]/40 px-5 py-4">
          {remaining > 0 ? (
            <>
              <div className="flex justify-between text-xs text-[#5c5650]">
                <span>
                  {formatPrice(subtotal)} / {formatPrice(FREE_SHIPPING_THRESHOLD)}
                </span>
                <span>{dict.cart.freeShipping}</span>
              </div>
              <div className="mt-2 h-1 w-full bg-[#D0B89A]/30">
                <div
                  className="h-full bg-[#8A9A86] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[#5c5650]">
                {t((d) => d.cart.awayFromFree, {
                  amount: formatPrice(remaining),
                })}
              </p>
            </>
          ) : (
            <p className="text-xs text-[#5c5650]">{dict.cart.unlockedFree}</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif text-xl text-[#2B2927]">
                {dict.cart.emptyTitle}
              </p>
              <p className="mt-2 text-sm text-[#5c5650]">
                {dict.cart.emptyDescription}
              </p>
              <Link
                href="/skincare"
                onClick={close}
                className="mt-6 inline-flex h-11 items-center bg-[#8A9A86] px-6 text-xs uppercase tracking-wide text-[#F5EBE1] hover:bg-[#6f7f6c]"
              >
                {dict.cart.shopSkincare}
              </Link>
            </div>
          ) : (
            <ul className="space-y-5">
              {items.map((item) => (
                <li
                  key={`${item.productId}-${item.variantId ?? "d"}`}
                  className="flex gap-4"
                >
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={close}
                    className="relative h-24 w-20 shrink-0 overflow-hidden bg-[#F5EBE1]"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-wider text-[#5c5650]">
                      {item.brand}
                    </p>
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={close}
                      className="line-clamp-2 text-sm text-[#2B2927]"
                    >
                      {item.name}
                    </Link>
                    {item.variantName ? (
                      <p className="text-xs text-[#5c5650]">{item.variantName}</p>
                    ) : null}
                    <p className="mt-1 text-sm">{formatPrice(item.price)}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="inline-flex items-center border border-[#D0B89A]/60">
                        <button
                          type="button"
                          className="p-1.5"
                          aria-label={dict.cart.decreaseQty}
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.quantity - 1,
                              item.variantId
                            )
                          }
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="p-1.5"
                          aria-label={dict.cart.increaseQty}
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.quantity + 1,
                              item.variantId
                            )
                          }
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="text-xs text-[#5c5650] underline-offset-2 hover:underline"
                        onClick={() =>
                          removeItem(item.productId, item.variantId)
                        }
                      >
                        {dict.cart.remove}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 ? (
          <div className="shrink-0 border-t border-[#D0B89A]/50 px-5 py-5">
            <div className="flex justify-between text-sm">
              <span>{dict.cart.subtotal}</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-[#5c5650]">
              {dict.cart.shippingAtCheckout}
            </p>
            <Link
              href="/checkout"
              onClick={close}
              className="mt-4 flex h-12 w-full items-center justify-center bg-[#8A9A86] text-xs uppercase tracking-wide text-[#F5EBE1] hover:bg-[#6f7f6c]"
            >
              {dict.cart.checkout}
            </Link>
            <Link
              href="/cart"
              onClick={close}
              className="mt-2 flex h-10 w-full items-center justify-center text-xs uppercase tracking-wide text-[#2B2927] underline-offset-4 hover:underline"
            >
              {dict.cart.viewBag}
            </Link>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
