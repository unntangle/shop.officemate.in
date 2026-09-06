"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Heart, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useCart } from "@/components/commerce/CartProvider";
import { QuantityStepper } from "@/components/commerce/QuantityStepper";
import { OrderSummary } from "@/components/commerce/OrderSummary";
import { ProductRender } from "@/components/common/ProductRender";
import { categoryName } from "@/constants/categories";
import {
  amountToFreeShipping,
  deliveryEstimate,
  discountPercent,
  formatINR,
} from "@/lib/commerce";

/**
 * Cart page.
 *
 * Deliberately separate from the drawer rather than reusing it at a wider
 * breakpoint. The drawer is for confirming an add and getting back to
 * shopping; this page is for reviewing an order before committing money, so it
 * shows unit prices, per-line savings and a delivery estimate the drawer omits.
 *
 * COLOUR: CHARCOAL ACTIONS, RED RESERVED FOR ERRORS — the same rule as the
 * drawer and the checkout page. The buttons are `night`, links and row actions
 * are grey darkening to ink, and green stays for money saved. Nothing on this
 * page is red, because nothing on it is a problem.
 */
export default function CartPage() {
  const { lines, totals, ready, setQty, removeItem, toggleWishlist } = useCart();

  /* Before hydration the cart is always empty, and rendering the empty state
     during that window makes a full cart flash "your cart is empty" on every
     reload. A skeleton is the honest thing to show while we don't yet know. */
  if (!ready) {
    return (
      <div className="container py-16">
        <div className="h-8 w-40 animate-pulse rounded-full bg-surface" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface" />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-2xl bg-surface" />
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container py-20">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-surface">
            <ShoppingBag size={30} className="text-muted" />
          </span>
          <h1 className="mt-6 text-2xl font-bold text-ink">Your cart is empty</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Nothing here yet. Browse the seating range or let the advisor
            shortlist a chair based on how you actually sit.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/products"
              className="inline-flex h-12 items-center rounded-xl bg-night px-7 text-sm font-semibold text-white transition-colors hover:bg-night-deep"
            >
              Shop all products
            </Link>
            <Link
              href="/advisor"
              className="inline-flex h-12 items-center rounded-xl border border-ink/15 px-7 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-surface"
            >
              Find your chair
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const gap = amountToFreeShipping(totals.subtotal);

  return (
    <div className="bg-surface py-8 md:py-10">
      <div className="container">
        <Link
          href="/products"
          className="group inline-flex items-center gap-1.5 text-[0.82rem] font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft
            size={15}
            className="transition-transform duration-300 group-hover:-translate-x-0.5"
          />
          Continue shopping
        </Link>

        <h1 className="mt-3 text-[1.6rem] font-bold tracking-[-0.02em] text-ink md:text-[2rem]">
          Your cart
          <span className="ml-2 text-base font-normal text-muted">
            {totals.itemCount} {totals.itemCount === 1 ? "item" : "items"}
          </span>
        </h1>

        {gap > 0 && (
          <p className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-[0.82rem] text-ink">
            <Truck size={16} className="shrink-0 text-muted" />
            Add <strong>{formatINR(gap)}</strong> more to qualify for free delivery.
          </p>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {lines.map((line) => {
                const off = discountPercent(line.price, line.compareAtPrice);

                return (
                  <motion.li
                    key={line.lineId}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.28 }}
                    className="overflow-hidden rounded-2xl border border-line bg-white p-4"
                  >
                    <div className="flex gap-4">
                      <Link
                        href={`/products/${line.slug}`}
                        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface sm:h-28 sm:w-28"
                      >
                        {line.image ? (
                          <Image
                            src={line.image}
                            alt={line.name}
                            fill
                            sizes="112px"
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

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[0.7rem] uppercase tracking-wide text-muted">
                              {categoryName(line.category)}
                            </p>
                            <Link
                              href={`/products/${line.slug}`}
                              className="clamp-2 mt-0.5 text-[0.95rem] font-bold leading-snug text-ink hover:text-muted"
                            >
                              {line.name}
                            </Link>
                            <p className="mt-1 flex items-center gap-1.5 text-[0.75rem] text-muted">
                              <span
                                className="inline-block h-3 w-3 rounded-full border border-line"
                                style={{ background: line.colorHex }}
                                aria-hidden
                              />
                              {line.color}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-[1.05rem] font-bold text-ink">
                              {formatINR(line.price * line.qty)}
                            </p>
                            {line.compareAtPrice && (
                              <>
                                <p className="mrp">
                                  {formatINR(line.compareAtPrice * line.qty)}
                                </p>
                                <p className="text-[0.72rem] font-semibold text-save">
                                  {off}% off
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        <p className="mt-2 text-[0.72rem] text-muted">
                          Delivery by {deliveryEstimate()} · Free installation
                        </p>

                        <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
                          <QuantityStepper
                            size="sm"
                            value={line.qty}
                            onChange={(n) => setQty(line.lineId, n)}
                          />

                          {/* Save-for-later removes the line as well as saving
                              it. Leaving it in the cart would mean the shopper
                              has to perform two actions to achieve the one
                              thing the label promises. */}
                          <button
                            onClick={() => {
                              toggleWishlist(line.slug);
                              removeItem(line.lineId);
                            }}
                            className="flex items-center gap-1.5 text-[0.78rem] font-medium text-muted transition-colors hover:text-ink"
                          >
                            <Heart size={14} />
                            Save for later
                          </button>

                          <button
                            onClick={() => removeItem(line.lineId)}
                            className="flex items-center gap-1.5 text-[0.78rem] font-medium text-muted transition-colors hover:text-ink"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>

                          {line.qty > 1 && (
                            <span className="ml-auto text-[0.72rem] text-muted">
                              {formatINR(line.price)} each
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>

          <div className="lg:sticky lg:top-28">
            <OrderSummary
              action={
                <Link
                  href="/checkout"
                  className="flex w-full items-center justify-center rounded-xl bg-night py-4 text-sm font-semibold text-white transition-colors hover:bg-night-deep"
                >
                  Proceed to checkout
                </Link>
              }
            />

            <div className="mt-3 rounded-2xl border border-line bg-white p-4">
              <p className="text-[0.82rem] font-semibold text-ink">
                Ordering 10 seats or more?
              </p>
              <p className="mt-1 text-[0.75rem] leading-relaxed text-muted">
                Bulk pricing beats the retail cart. Our workspace team will quote
                you directly.
              </p>
              <Link
                href="/contact?intent=bulk"
                className="mt-3 inline-flex text-[0.78rem] font-semibold text-ink underline underline-offset-4 transition-colors hover:text-muted"
              >
                Request a bulk quote →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
