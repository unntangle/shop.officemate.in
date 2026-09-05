import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * Text input.
 *
 * Frido's form fields sit on a soft grey fill with no visible border at rest,
 * and lift to white with an accent edge on focus. The point is that an unfocused
 * form reads as a set of quiet slots rather than a stack of outlined boxes —
 * on a contact or checkout page with eight fields, eight borders is a lot of
 * visual noise for something the eye is only meant to scan.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "h-13 w-full rounded-2xl border border-transparent bg-surface px-4 py-3.5 text-sm text-ink",
        "placeholder:text-muted/70",
        "transition-colors focus:border-accent focus:bg-white focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
export { Input };
