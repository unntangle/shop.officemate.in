"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Quantity control used on the cart line, the drawer and the product page.
 *
 * The minus button becomes a remove affordance at qty 1 rather than going
 * disabled: a shopper who wants one fewer than one wants the line gone, and
 * making them hunt for a separate bin icon is a needless extra target.
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 10,
  size = "md",
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const box = size === "sm" ? "h-8" : "h-10";
  const btn = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const icon = size === "sm" ? 13 : 15;

  return (
    <div
      className={cn(
        "inline-flex items-center overflow-hidden rounded-full border border-line bg-white",
        box,
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min - 1}
        aria-label="Decrease quantity"
        className={cn(
          "flex items-center justify-center text-ink transition-colors hover:bg-surface disabled:opacity-30",
          btn
        )}
      >
        <Minus size={icon} />
      </button>

      <span
        className={cn(
          "min-w-8 text-center text-sm font-semibold tabular-nums text-ink",
          size === "sm" && "text-[0.8rem]"
        )}
        aria-live="polite"
      >
        {value}
      </span>

      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={cn(
          "flex items-center justify-center text-ink transition-colors hover:bg-surface disabled:opacity-30",
          btn
        )}
      >
        <Plus size={icon} />
      </button>
    </div>
  );
}
