"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Video } from "lucide-react";
import type { Product } from "@/types";
import { AddToCartButton } from "@/components/commerce/AddToCartButton";
import { EnquireButton } from "@/components/common/EnquireButton";
import { useCart } from "@/components/commerce/CartProvider";
import { useProductColor } from "@/components/products/ColorProvider";
import { waHrefWithText } from "@/lib/whatsapp";
import { discountPercent, formatINR, isPurchasable } from "@/lib/commerce";
import { cn } from "@/lib/utils";

/**
 * Sticky product bar — section nav on desktop, a reachable CTA on mobile.
 *
 * Replaces StickyEnquiry, which is otherwise identical. The only change is
 * what the button does: it adds to the cart rather than opening the enquiry
 * modal, so the bar that follows the shopper down a 4,000px page offers the
 * same action as the buy box they scrolled past.
 *
 * StickyEnquiry is left in the repo untouched. It is still the right component
 * for a page with nothing to sell, and deleting it would take the showcase
 * build's behaviour with it.
 *
 * QUOTE-ONLY PRODUCTS STILL GET ENQUIRE. `isPurchasable` is the same check the
 * grid card uses — a model with no confirmed price cannot be added to a cart,
 * and showing a dead Add to cart on those would be worse than the enquiry
 * button it replaced.
 *
 * The price rides along on desktop. By the time this bar appears the shopper
 * is past the buy box, and asking someone to scroll back up to check a number
 * before committing is how a decision gets postponed.
 */

/** Anchors mirror the section ids on the product detail page. */
const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "features", label: "Features" },
  { id: "benefits", label: "Benefits" },
  { id: "specs", label: "Tech specs" },
  { id: "faqs", label: "FAQs" },
];

export function StickyBuy({ product }: { product: Product }) {
  const { active: activeColor } = useProductColor();
  const { addItem } = useCart();
  const [show, setShow] = useState(false);
  const [active, setActive] = useState(SECTIONS[0].id);
  const lastY = useRef(0);

  const buyable = isPurchasable(product);
  const color = activeColor?.name ?? product.colors[0]?.name;
  const off = discountPercent(product.price, product.compareAtPrice);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;

      /* VISIBLE WHENEVER YOU ARE PAST THE BUY BOX, in either direction.

         This used to show only while scrolling DOWN, so that it never met the
         navbar — which returns on the way up — at the top of the screen. The
         result was a bar that vanished the instant someone scrolled back up,
         which is exactly when they are reconsidering and most likely to want
         it. Anchoring the bar to the BOTTOM removes the collision entirely
         and lets it simply stay put.

         620px is roughly where the buy box leaves the viewport. Above that
         the real one is on screen and a second copy would be noise. */
      setShow(y > 620);
      lastY.current = y;

      /* Whichever section has passed under the header is the current one. */
      const line = y + 160;
      let current = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.offsetTop <= line) current = s.id;
      }
      setActive(current);
    };

    lastY.current = window.scrollY;
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /**
   * Hide the site header while this bar is up.
   *
   * Both are fixed to the top at `z-50`, and this bar is shorter than the
   * header — so it covered the announcement strip and left the logo and nav
   * row poking out beneath it, two headers stacked on one screen.
   *
   * Done through a BODY ATTRIBUTE rather than shared state because the two
   * components are far apart in the tree: the header is in the root layout,
   * this renders at the bottom of a product page. Threading a provider around
   * the entire app to toggle one CSS property would be a lot of machinery for
   * a class name.
   *
   * `visibility`, not `display` — see globals.css. The header is sticky and
   * still occupies its place in the document flow; removing it outright would
   * jerk the whole page upward by its height the moment this appears.
   *
   * The cleanup runs on unmount as well as on hide, so navigating away mid‑
   * scroll cannot leave the header invisible on the next page.
   */
  useEffect(() => {
    if (show) document.body.setAttribute("data-pdp-bar", "");
    else document.body.removeAttribute("data-pdp-bar");

    return () => document.body.removeAttribute("data-pdp-bar");
  }, [show]);

  return (
    <>
      {/* Desktop — pinned to the TOP of the viewport */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-0 z-50 hidden border-b border-line bg-white/95 backdrop-blur-xl md:block"
          >
            {/* LIGHT, AND IT SITS OVER THE NAVBAR RATHER THAN BESIDE IT.

                `z-50` is deliberate: while this bar is up it REPLACES the site
                header rather than stacking under it. Two fixed bars at the top
                of a page is the worst of both — they either overlap or squash
                the content into a narrow strip, and the earlier attempt to
                avoid that by only showing this while scrolling DOWN meant it
                vanished the moment someone scrolled up to reconsider.

                Taking over the top is defensible here because this bar is not
                a lesser thing than the navbar on a product page: it carries
                the product, its price, its discount and both buy actions. The
                site nav is one scroll to the top away.

                It was a near-black bar, which read as a separate application
                layered over the storefront and forced every control inside to
                invert. On white it reads as the page's own header, and the
                buttons are the same ones from the buy box, so nothing has to
                be relearned.

                It also lets the PRICE carry its real treatment — struck MRP
                and the green discount pill. The dark version showed a bare
                white number, quietly dropping the discount at the moment
                someone is closest to deciding. */}
            <div className="container flex h-16 items-center justify-between gap-6">
              <div className="flex min-w-0 items-center gap-7">
                <span className="display shrink-0 truncate text-base font-semibold text-ink">
                  {product.name}
                </span>

                {/* Section nav survives, but only where there is room for it.
                    Below `xl` the price and the two buttons need the width
                    more — anchors are a convenience, buying is the point. */}
                <nav className="hidden items-center gap-6 xl:flex">
                  {SECTIONS.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className={cn(
                        "text-sm transition-colors",
                        active === s.id
                          ? "font-semibold text-ink"
                          : "text-muted hover:text-ink"
                      )}
                    >
                      {s.label}
                    </a>
                  ))}
                </nav>
              </div>

              <div className="flex shrink-0 items-center gap-4">
                {buyable && (
                  <div className="hidden items-center gap-2 lg:flex">
                    <span className="text-[1.05rem] font-bold text-ink">
                      {formatINR(product.price)}
                    </span>
                    {product.compareAtPrice && (
                      <span className="text-[0.8rem] text-muted">
                        MRP{" "}
                        <span className="line-through">
                          {formatINR(product.compareAtPrice)}
                        </span>
                      </span>
                    )}
                    {off > 0 && (
                      <span className="rounded-full bg-save px-2 py-0.5 text-[0.68rem] font-bold uppercase text-white">
                        {off}% off
                      </span>
                    )}
                    <span className="text-[0.72rem] text-muted">
                      (Incl. of all taxes)
                    </span>
                  </div>
                )}

                {/* SHOP LIVE and BUY NOW, not Visit store and Add to cart.

                    By the time this bar appears the shopper has scrolled past
                    the buy box — they have read the page and are either close
                    to deciding or stuck on a question. Those are the two
                    states worth serving: BUY NOW skips the cart for the first,
                    and SHOP LIVE reaches a person for the second.

                    Add to cart is not lost; it is still the primary button in
                    the buy box a scroll away, and repeating it here would
                    offer a slower version of Buy now beside it. */}
                <a
                  href={waHrefWithText(
                    `Hi Officemate, can someone show me the ${product.name} on a video call?`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden h-11 items-center gap-2 rounded-xl border border-save/30 bg-save-soft px-5 text-[0.85rem] font-semibold text-save transition-colors hover:bg-save/15 sm:flex"
                >
                  <Video size={16} />
                  Shop Live
                </a>

                {buyable ? (
                  <Link
                    href="/checkout"
                    onClick={() => addItem(product, { color })}
                    className="flex h-11 items-center justify-center rounded-xl bg-night px-7 text-[0.88rem] font-semibold text-white transition-colors hover:bg-night-deep"
                  >
                    Buy now
                  </Link>
                ) : (
                  <EnquireButton
                    product={product.name}
                    variant="accent"
                    size="sm"
                    withArrow
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile — a single reachable CTA stays at the bottom.

          The price sits beside it rather than above: this bar overlays the
          page, and a two-line version covers roughly a fifth of a phone
          screen's usable height. */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line bg-white/90 px-4 py-3 backdrop-blur-xl md:hidden"
          >
            {buyable ? (
              <>
                <div className="min-w-0 shrink-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[1.05rem] font-bold text-ink">
                      {formatINR(product.price)}
                    </span>
                    {off > 0 && (
                      <span className="text-[0.7rem] font-bold text-save">
                        {off}% off
                      </span>
                    )}
                  </div>
                  <span className="text-[0.65rem] text-muted">
                    Incl. taxes
                  </span>
                </div>
                <AddToCartButton
                  product={product}
                  color={color}
                  shape="rounded"
                  size="md"
                  className="flex-1"
                />
              </>
            ) : (
              <EnquireButton
                product={product.name}
                variant="accent"
                size="lg"
                withArrow
                className="w-full"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
