import * as React from "react";
import { Slot } from "@/components/ui/slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Shared button primitive.
 *
 * Styled to the Frido reference, which is unusually specific about buttons:
 * full pills, heavy weight, generous horizontal padding, and a solid fill with
 * no gradient, no glow and no border. The press feedback is a small scale,
 * nothing else.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * `accent` IS NOW CHARCOAL, NOT RED, and that is the point of this change.
 *
 * It used to be the brand red, on the reasoning that the brand-coloured
 * button should be the one that adds to cart. In practice red ended up
 * carrying the CTA, errors, low stock, links and selected states at once — so
 * it stopped distinguishing anything, and the one place it genuinely needed
 * to shout (a validation message) was the place it was least noticed.
 *
 * `accent` and `primary` are therefore IDENTICAL charcoal. The duplication is
 * deliberate rather than lazy: dozens of call sites pass one or the other,
 * and collapsing them here changes the whole storefront in one edit instead
 * of touching every component. Prefer `primary` in new code.
 *
 * Red survives on exactly two things, both outside this file: validation
 * messages, and the CLOSE-account confirmation. Everything else is charcoal,
 * blue for utility, or grey.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Weight is `font-semibold`, not `font-medium`. Frido's CTAs are visually
 * heavy relative to body copy, and at medium the pill reads as a chip rather
 * than as the primary action on the section.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full",
    "font-semibold tracking-[-0.01em]",
    "transition-all duration-300 active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "bg-night text-white hover:bg-night-deep",
        /* Alias of `primary` — see the note above. */
        accent: "bg-night text-white hover:bg-night-deep",
        /* Hairline outline on white. Frido's secondary buttons are a thin
           neutral border, not a grey fill — a filled secondary competes with
           the primary and flattens the hierarchy. */
        outline:
          "border border-ink/15 bg-transparent text-ink hover:border-ink hover:bg-surface",
        ghost: "text-ink hover:bg-surface",
        subtle: "bg-surface text-ink hover:bg-line/60",
        /* For dark sections — the CTA band, the night-ground hero slides.
           Charcoal on charcoal is invisible, which is the trap when a primary
           button moves from a brand colour to a neutral. */
        light: "bg-white text-ink hover:bg-white/90",
      },
      size: {
        /* Taller than the previous scale across the board. Frido's buttons are
           chunky; a 36px pill next to their type sizes looks undernourished. */
        sm: "h-10 px-5 text-[0.82rem]",
        md: "h-12 px-7 text-[0.9rem]",
        lg: "h-14 px-9 text-[0.95rem]",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
