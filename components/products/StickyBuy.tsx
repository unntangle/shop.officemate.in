"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "@/types";
import { AddToCartButton } from "@/components/commerce/AddToCartButton";
import { EnquireButton } from "@/components/common/EnquireButton";
import { useProductColor } from "@/components/products/ColorProvider";
import { formatINR, isPurchasable } from "@/lib/commerce";
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
  const [show, setShow] = useState(false);
  const [active, setActive] = useState(SECTIONS[0].id);
  const lastY = useRef(0);

  const buyable = isPurchasable(product);
  const color = activeColor?.name ?? product.colors[0]?.name;

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;

      /* The navbar hides on the way down and returns on the way up, and it's
         translucent — so this bar takes the same cue in reverse. The two swap
         at the top of the page instead of bleeding through one another. */
      const goingDown = y > lastY.current;
      if (Math.abs(y - lastY.current) > 4) {
        setShow(y > 620 && goingDown);
      }
      if (y <= 620) setShow(false);
      lastY.current = y;

      /* Whichever section has passed under the bar is the current one. */
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

  return (
    <>
      {/* Desktop — product sub-nav pinned to the top */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-0 z-40 hidden border-b border-white/10 bg-ink/90 backdrop-blur-xl md:block"
          >
            <div className="container flex h-14 items-center justify-between gap-6">
              <div className="flex items-center gap-7">
                <span className="display shrink-0 text-base font-semibold text-white">
                  {product.name}
                </span>
                <nav className="flex items-center gap-6">
                  {SECTIONS.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className={cn(
                        "text-sm transition-colors",
                        active === s.id
                          ? "text-white"
                          : "text-white/55 hover:text-white"
                      )}
                    >
                      {s.label}
                    </a>
                  ))}
                </nav>
              </div>

              <div className="flex shrink-0 items-center gap-4">
                {buyable && (
                  <span className="text-[0.95rem] font-bold text-white">
                    {formatINR(product.price)}
                  </span>
                )}
                {buyable ? (
                  <AddToCartButton
                    product={product}
                    color={color}
                    /* White on the dark bar. `solid` is charcoal now, which
                       on `bg-ink/90` would be all but invisible. */
                    variant="light"
                    size="sm"
                    fullWidth={false}
                  />
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
                <span className="shrink-0 text-[1.05rem] font-bold text-ink">
                  {formatINR(product.price)}
                </span>
                <AddToCartButton
                  product={product}
                  color={color}
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
