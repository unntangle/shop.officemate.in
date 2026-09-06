"use client";

import { Heart } from "lucide-react";
import { useCart } from "@/components/commerce/CartProvider";
import { useAuth } from "@/components/common/AuthProvider";
import { cn } from "@/lib/utils";

/**
 * Save-for-later heart.
 *
 * Sits inside a linked card on the grid, so it stops propagation as well as
 * preventing default — otherwise saving a product navigates away from the
 * grid, which is the opposite of what "save for later" means.
 *
 * SIGNED OUT, IT OPENS SIGN-IN INSTEAD OF SAVING. The heart stays visible on
 * every card either way: hiding it would remove the only prompt to sign in
 * that appears where someone is actually shopping, and a control that
 * disappears teaches nothing.
 *
 * This is a prompt, not a gate. The wishlist is local storage — it is not
 * protecting anything, and it must not be treated as though it were. It
 * exists so "sign in" arrives at a moment the shopper has a reason to care,
 * rather than as a wall on arrival.
 *
 * One consequence worth knowing: the save is NOT replayed after verifying.
 * Doing that means holding the intent across a modal, and a heart that fills
 * in by itself a beat after the dialog closes reads as a glitch. The shopper
 * taps it again, on a card they are still looking at, and that time it works.
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
  const { signedIn, openLogin } = useAuth();
  const saved = isWishlisted(slug);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!signedIn) {
          openLogin();
          return;
        }
        toggleWishlist(slug);
      }}
      aria-pressed={signedIn ? saved : undefined}
      aria-haspopup={signedIn ? undefined : "dialog"}
      aria-label={
        !signedIn
          ? `Sign in to save ${name} for later`
          : saved
            ? `Remove ${name} from wishlist`
            : `Save ${name} for later`
      }
      title={!signedIn ? "Sign in to save" : saved ? "Saved" : "Save for later"}
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
