"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, Trash2, Truck, X } from "lucide-react";
import { useCart } from "@/components/commerce/CartProvider";
import { QuantityStepper } from "@/components/commerce/QuantityStepper";
import { ProductRender } from "@/components/common/ProductRender";
import { amountToFreeShipping, formatINR, FREE_SHIPPING_THRESHOLD } from "@/lib/commerce";
import { EASE } from "@/lib/motion";

export function CartDrawer() {
  const { drawerOpen, closeDrawer, lines, totals, setQty, removeItem } = useCart();

  const gap = amountToFreeShipping(totals.subtotal);
  const progress = Math.min(100, (totals.subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-[70] bg-scrim/50 backdrop-blur-[2px]"
            aria-hidden
          />

          <motion.aside
            role="dialog"
            aria-label="Shopping cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: EASE }}
            className="fixed right-0 top-0 z-[71] flex h-dvh w-full max-w-[27rem] flex-col bg-white shadow-lift"
          >
            <header className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={18} className="text-accent" />
                <h2 className="text-[0.95rem] font-bold text-ink">
                  Your cart
                  {totals.itemCount > 0 && (
                    <span className="ml-1.5 font-normal text-muted">
                      ({totals.itemCount})
                    </span>
                  )}
                </h2>
              </div>
              <button
                onClick={closeDrawer}
                aria-label="Close cart"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink"
              >
                <X size={19} />
              </button>
            </header>

            {/* Free-shipping meter. Placed above the lines rather than beside
                the total, because it's an instruction to add more, and that
                decision is made while looking at the basket, not the maths. */}
            {lines.length > 0 && (
              <div className="border-b border-line bg-sand px-5 py-3">
                <p className="flex items-center gap-2 text-[0.78rem] text-ink">
                  <Truck size={14} className="shrink-0 text-accent" />
                  {gap > 0 ? (
                    <span>
                      Add <strong>{formatINR(gap)}</strong> more for free delivery
                    </span>
                  ) : (
                    <span className="font-semibold text-save">
                      Free delivery unlocked
                    </span>
                  )}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5">
              {lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface">
                    <ShoppingBag size={26} className="text-muted" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink">Your cart is empty</p>
                    <p className="mt-1 text-sm text-muted">
                      Chairs, desks and storage — all one tap away.
                    </p>
                  </div>
                  <Link
                    href="/products"
                    onClick={closeDrawer}
                    className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
                  >
                    Start shopping
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {lines.map((line) => (
                    <li key={line.lineId} className="flex gap-3 py-4">
                      <Link
                        href={`/products/${line.slug}`}
                        onClick={closeDrawer}
                        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface"
                      >
                        {line.image ? (
                          <Image
                            src={line.image}
                            alt={line.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <ProductRender
                            category={line.category}
                            color={line.colorHex}
                            label={line.name}
                          />
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/products/${line.slug}`}
                            onClick={closeDrawer}
                            className="clamp-2 text-[0.85rem] font-semibold leading-snug text-ink hover:text-accent"
                          >
                            {line.name}
                          </Link>
                          <button
                            onClick={() => removeItem(line.lineId)}
                            aria-label={`Remove ${line.name}`}
                            className="shrink-0 text-muted transition-colors hover:text-accent"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <p className="mt-0.5 flex items-center gap-1.5 text-[0.72rem] text-muted">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full border border-line"
                            style={{ background: line.colorHex }}
                            aria-hidden
                          />
                          {line.color}
                        </p>

                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <QuantityStepper
                            size="sm"
                            value={line.qty}
                            onChange={(n) => setQty(line.lineId, n)}
                          />
                          <div className="text-right">
                            <p className="text-[0.9rem] font-bold text-ink">
                              {formatINR(line.price * line.qty)}
                            </p>
                            {line.compareAtPrice && (
                              <p className="mrp">
                                {formatINR(line.compareAtPrice * line.qty)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {lines.length > 0 && (
              <footer className="border-t border-line px-5 py-4">
                {totals.savings > 0 && (
                  <p className="mb-2 rounded-lg bg-save-soft px-3 py-2 text-[0.78rem] font-medium text-save">
                    You save {formatINR(totals.savings)} on this order
                  </p>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="text-lg font-bold text-ink">
                    {formatINR(totals.subtotal)}
                  </span>
                </div>
                <p className="mt-1 text-[0.72rem] text-muted">
                  Taxes included. Delivery calculated at checkout.
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    href="/cart"
                    onClick={closeDrawer}
                    className="flex h-12 items-center justify-center rounded-full border border-ink/15 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-surface"
                  >
                    View cart
                  </Link>
                  <Link
                    href="/checkout"
                    onClick={closeDrawer}
                    className="flex h-12 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white shadow-accent transition-colors hover:bg-accent-deep"
                  >
                    Checkout
                  </Link>
                </div>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
