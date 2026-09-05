"use client";

import { Heart } from "lucide-react";
import { useCart } from "@/components/commerce/CartProvider";
import { cn } from "@/lib/utils";

/**
 * Save-for-later heart.
 *
 * Sits inside a linked card on the grid, so it stops propagation as well as
 * preventing default — otherwise saving a product navigates away from the
 * grid, which is the opposite of what "save for later" means.
 */
export function WishlistButton({
  slug,
  name,
  className,
  size = 17,
}: {
  slug: string;
  name: string;
  className?: string;
  size?: number;
}) {
  const { toggleWishlist, isWishlisted } = useCart();
  const saved = isWishlisted(slug);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(slug);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from wishlist` : `Save ${name} for later`}
      title={saved ? "Saved" : "Save for later"}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full border bg-white/95 backdrop-blur-sm",
        "transition-all duration-200 hover:scale-105 active:scale-95",
        saved ? "border-accent text-accent" : "border-line text-muted hover:text-ink",
        className
      )}
    >
      <Heart size={size} className={cn(saved && "fill-accent")} />
    </button>
  );
}
