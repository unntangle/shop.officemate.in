import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Matches Input — soft grey fill at rest, white with an accent edge on focus. */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[140px] w-full resize-none rounded-2xl border border-transparent bg-surface px-4 py-3.5 text-sm text-ink",
        "placeholder:text-muted/70",
        "transition-colors focus:border-accent focus:bg-white focus:outline-none",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
export { Textarea };
