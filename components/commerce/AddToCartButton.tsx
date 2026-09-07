"use client";

import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import type { Product } from "@/types";
import { useCart } from "@/components/commerce/CartProvider";
import { isPurchasable } from "@/lib/commerce";
import { cn } from "@/lib/utils";

/**
 * The storefront's primary action.
 *
 * CHARCOAL, NOT RED. `solid` is `night`, matching every other primary action
 * on the site — Proceed to checkout, Get directions, Save changes. Red used to
 * mean "buy", "error", "low stock", "link" and "selected" simultaneously; it
 * now means only the first two of those nowhere and errors everywhere else.
 *
 * The confirmation state stays GREEN, because that is a different message. It
 * is not the button changing style, it is the button reporting a result, and
 * green is what the discount badge and the savings line already use for "this
 * went well".
 *
 * It confirms in place for 1.4s before reverting. The cart drawer already
 * opens on add, so this isn't the only feedback — but on a dense grid the
 * drawer covers the row the shopper was reading, and the button flashing
 * "Added" is what tells them *which* tile they just hit once it closes.
 */
export function AddToCartButton({
  product,
  color,
  qty = 1,
  variant = "solid",
  shape = "pill",
  size = "md",
  fullWidth = true,
  label = "Add to cart",
  className,
}: {
  product: Product;
  color?: string;
  qty?: number;
  /** `light` is for DARK backgrounds — the sticky product bar. */
  variant?: "solid" | "outline" | "dark" | "light";
  /** `pill` is the storefront default; `rounded` is the softer card style. */
  shape?: "pill" | "rounded";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  label?: string;
  className?: string;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const available = isPurchasable(product);

  const sizes = {
    sm: "h-9 px-3 text-[0.78rem]",
    md: "h-11 px-5 text-sm",
    lg: "h-[3.25rem] px-7 text-[0.95rem]",
  }[size];

  /* Case travels with shape, not with size. The pill is the loud storefront
     CTA and carries uppercase + tracking; the rounded card button is quieter
     and sets its label in sentence case, matching Get directions. */
  const shapes = {
    pill: "rounded-full uppercase tracking-[0.04em]",
    rounded: "rounded-xl",
  }[shape];

  const variants = {
    solid: "bg-night text-white hover:bg-night-deep",
    outline: "border-2 border-ink bg-white text-ink hover:bg-surface",
    /* `dark` is now identical to `solid` and kept only so existing call sites
       do not need touching. Prefer `solid`; this alias can go once the last
       `variant="dark"` is removed. */
    dark: "bg-night text-white hover:bg-night-deep",
    /**
     * INVERTED, for placement on a dark surface.
     *
     * The desktop sticky bar is `bg-ink/90`. Now that the primary button is
     * charcoal, putting `solid` there would be charcoal on charcoal — the
     * button would effectively disappear, which is the hazard of moving a
     * CTA from red to a neutral. White reads as the primary action against
     * dark exactly as charcoal does against white.
     */
    light: "bg-white text-ink hover:bg-white/90",
  }[variant];

  if (!available) {
    return (
      <button
        type="button"
        disabled
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold",
          "cursor-not-allowed border border-line bg-surface text-muted",
          shapes,
          sizes,
          fullWidth && "w-full",
          className
        )}
      >
        Out of stock
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        addItem(product, { color, qty });
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1400);
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold",
        "transition-all duration-300 active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2",
        added ? "bg-save text-white shadow-none" : variants,
        shapes,
        sizes,
        fullWidth && "w-full",
        className
      )}
      aria-live="polite"
    >
      {added ? (
        <>
          <Check size={size === "sm" ? 14 : 16} />
          Added
        </>
      ) : (
        <>
          <ShoppingBag size={size === "sm" ? 14 : 16} />
          {label}
        </>
      )}
    </button>
  );
}
