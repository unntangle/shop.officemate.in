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
  /** `dark` matches the charcoal Get-directions button on the store cards. */
  variant?: "solid" | "outline" | "dark";
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
    solid: "bg-accent text-white hover:bg-accent-deep shadow-accent",
    outline: "border border-accent bg-white text-accent hover:bg-accent-soft",
    dark: "bg-night text-white hover:bg-night-deep",
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
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
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
