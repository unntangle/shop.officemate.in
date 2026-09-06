"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useCart } from "@/components/commerce/CartProvider";
import { QuantityStepper } from "@/components/commerce/QuantityStepper";
import { ProductRender } from "@/components/common/ProductRender";
import { waChatHref } from "@/lib/whatsapp";
import { formatINR } from "@/lib/commerce";
import { EASE } from "@/lib/motion";

/**
 * Cart drawer, on the Frido pattern: a titled list of lines and a sticky
 * action bar carrying the total and the trust row.
 *
 * NO REWARD TRACK. The reference has one — a progress bar toward free shipping
 * and two gift-coupon tiers — and this had a single-milestone version of it.
 * It was removed because with only one threshold there is nothing to progress
 * THROUGH: the bar was either empty or full, which is a boolean wearing the
 * costume of a meter. The free-delivery threshold is still announced in the
 * header bar, the footer and the trust row below.
 *
 * If real tiers are ever agreed (spend more, get X), a track earns its place
 * again — but it needs at least two reachable steps to be worth the height.
 * Do not reinstate it with invented coupon tiers to fill the space; that is
 * advertising a discount that cannot be honoured at checkout.
 *
 * COLOUR.
 *
 * The checkout button is `bg-night` with white text — the same `dark` variant
 * AddToCartButton uses on the product page, so the two ends of the purchase
 * read as one button family rather than two designs.
 *
 * The Help link is plain underlined grey. It is a way out for someone who is
 * stuck, not a second primary action, and a filled chip beside the close
 * button read as the latter.
 *
 * The icons are `muted` grey. Red is this site's action colour, and spending
 * it on a bag glyph and two trust marks makes it mean "decoration" — which
 * costs it exactly where it should carry weight. Grey also stops the trust row
 * competing with the total directly above it.
 *
 * The trust row follows an honesty rule. The reference shows "7-Day Easy
 * Returns"; no returns window is written down anywhere in this codebase, so
 * this shows the delivery threshold and the one-year warranty, both of which
 * are stated site-wide and are true.
 */

const TRUST = [
  { icon: Truck, label: "Free delivery over ₹15,000" },
  { icon: ShieldCheck, label: "1-year warranty" },
];

export function CartDrawer() {
  const { drawerOpen, closeDrawer, lines, totals, setQty, removeItem } = useCart();

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
            className="fixed right-0 top-0 z-[71] flex h-dvh w-full max-w-[27rem] flex-col bg-surface shadow-lift"
          >
            {/* ------------------------------------------------------ header */}
            <header className="flex items-center justify-between gap-3 bg-white px-5 py-4">
              <h2 className="flex items-center gap-2.5 text-[1.05rem] font-semibold text-ink">
                <ShoppingBag size={19} className="text-muted" />
                Your cart
                {totals.itemCount > 0 && (
                  <span className="font-normal text-muted">
                    ({totals.itemCount})
                  </span>
                )}
              </h2>

              <div className="flex items-center gap-1">
                {/* Plain underlined text, not a pill.

                    A filled chip sitting next to the close button read as a
                    second primary action, which Help is not — it is a way out
                    for the small number of people who are stuck. Underlined
                    grey states that it is a link and lets the checkout button
                    below keep the weight.

                    It goes to WhatsApp rather than a support page, because
                    WhatsApp is the only channel that actually answers today.
                    A link to an under-development contact page would be worse
                    than no help button at all. */}
                <a
                  href={waChatHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-1 text-[0.8rem] font-medium text-muted underline underline-offset-4 transition-colors hover:text-ink"
                >
                  Help
                </a>
                <button
                  onClick={closeDrawer}
                  aria-label="Close cart"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink"
                >
                  <X size={19} />
                </button>
              </div>
            </header>

            {/* ------------------------------------------------------- lines */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
                    <ShoppingBag size={26} className="text-muted" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink">Your cart is empty</p>
                    <p className="mt-1 text-sm text-muted">
                      Chairs, desks and storage — all one tap away.
                    </p>
                  </div>
                  <Link
                    href="/categories"
                    onClick={closeDrawer}
                    className="rounded-xl bg-night px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-night-deep"
                  >
                    Start shopping
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-baseline justify-between px-1">
                    <h3 className="text-[0.95rem] font-semibold text-ink">
                      Review your order
                    </h3>
                    <span className="text-[0.78rem] text-muted">
                      {totals.itemCount}{" "}
                      {totals.itemCount === 1 ? "item" : "items"}
                    </span>
                  </div>

                  {/* Each line is its own card on a grey ground, rather than
                      rows divided by hairlines. On a narrow drawer the card
                      edge is what separates one product from the next once the
                      names run to two lines. */}
                  <ul className="space-y-3">
                    {lines.map((line) => (
                      <li
                        key={line.lineId}
                        className="flex gap-3 rounded-2xl bg-white p-3"
                      >
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
                              className="clamp-2 text-[0.88rem] font-semibold leading-snug text-ink hover:text-accent"
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

                          <div className="mt-2.5 flex items-end justify-between gap-2">
                            <QuantityStepper
                              size="sm"
                              value={line.qty}
                              onChange={(n) => setQty(line.lineId, n)}
                            />
                            <div className="text-right leading-tight">
                              {line.compareAtPrice && (
                                <p className="mrp">
                                  {formatINR(line.compareAtPrice * line.qty)}
                                </p>
                              )}
                              <p className="text-[0.95rem] font-bold text-ink">
                                {formatINR(line.price * line.qty)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {/* ---------------------------------------------- action bar

                One primary action, the way the reference has it. "View cart"
                drops to a text link: on a 27rem drawer, two equal buttons make
                the shopper choose between them, and the choice does not
                matter — both lead to the same purchase. */}
            {lines.length > 0 && (
              <footer className="border-t border-line bg-white px-5 pb-4 pt-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.9rem] font-semibold text-ink">
                      Total
                    </span>
                    {totals.savings > 0 && (
                      <span className="rounded-full bg-save-soft px-2.5 py-1 text-[0.72rem] font-semibold text-save">
                        Saving {formatINR(totals.savings)}
                      </span>
                    )}
                  </div>
                  <span className="text-[1.15rem] font-bold text-ink">
                    {formatINR(totals.subtotal)}
                  </span>
                </div>

                <p className="mt-0.5 text-[0.72rem] text-muted">
                  Taxes included. Delivery calculated at checkout.
                </p>

                {/* Charcoal, matching AddToCartButton's `dark` variant at
                    `shape="rounded"` — same fill, same hover, same radius, same
                    sentence case. The shopper meets that button on the product
                    page and this one in the drawer; making them look alike is
                    what tells them it is the same action continuing.

                    No ring here. The soft version needed one because a
                    97%-luminance fill has no visible edge on a white footer;
                    charcoal defines itself. */}
                <Link
                  href="/checkout"
                  onClick={closeDrawer}
                  className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-night py-4 text-[0.95rem] font-semibold text-white transition-colors hover:bg-night-deep active:scale-[0.99]"
                >
                  <ShoppingBag size={17} />
                  Proceed to checkout
                </Link>

                <Link
                  href="/cart"
                  onClick={closeDrawer}
                  className="mt-2.5 block text-center text-[0.8rem] font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
                >
                  View full cart
                </Link>

                {/* Facts, not reassurance copy. Every one of these is stated
                    elsewhere on the site and is true — see the note at the top
                    of this file about what is deliberately NOT here.

                    Centred with a fixed gap rather than `justify-between`.
                    With three items, spreading them across the full width read
                    as a row; with two, it just pushed them into opposite
                    corners with a void between, and they stopped reading as a
                    pair. `gap-6` keeps them related without crowding.

                    If a third item is added, `justify-between` becomes the
                    better choice again — but check it still fits on a 360px
                    viewport first; three of these at 0.68rem is close to the
                    limit. */}
                <ul className="mt-3.5 flex items-center justify-center gap-6 border-t border-line pt-3">
                  {TRUST.map(({ icon: Icon, label }) => (
                    <li
                      key={label}
                      className="flex items-center gap-1.5 text-[0.68rem] leading-tight text-muted"
                    >
                      <Icon size={13} className="shrink-0 text-muted" />
                      {label}
                    </li>
                  ))}
                </ul>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
