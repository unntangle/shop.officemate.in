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
  size = "md",
  fullWidth = true,
  label = "Add to cart",
  className,
}: {
  product: Product;
  color?: string;
  qty?: number;
  variant?: "solid" | "outline";
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

  const variants = {
    solid: "bg-accent text-white hover:bg-accent-deep shadow-accent",
    outline:
      "border border-accent bg-white text-accent hover:bg-accent-soft",
  }[variant];

  if (!available) {
    return (
      <button
        type="button"
        disabled
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full font-semibold",
          "cursor-not-allowed border border-line bg-surface text-muted",
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
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold uppercase tracking-[0.04em]",
        "transition-all duration-300 active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
        added ? "bg-save text-white shadow-none" : variants,
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
