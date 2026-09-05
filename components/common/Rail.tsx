"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Horizontal scroll rail with edge arrows.
 *
 * The arrows are driven by measured scroll position rather than an index, so
 * the rail works with children of mixed widths and stays correct after a
 * resize. They also hide at the ends instead of going disabled — a permanently
 * greyed-out control at the left edge is visual debt on every rail on the page.
 *
 * Touch users get native momentum scrolling and never see the arrows; the
 * arrows exist because a trackpad has no obvious horizontal affordance.
 */
export function Rail({
  children,
  className,
  itemClassName,
  ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  /** Applied to the scroller, e.g. to change gap or padding. */
  itemClassName?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 4);
    /* 4px of slack absorbs sub-pixel rounding, which otherwise leaves the
       right arrow visible on a rail that is already fully scrolled. */
    setAtEnd(el.scrollLeft >= max - 4);
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;

    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [measure]);

  /* Scroll by most of a viewport rather than all of it: leaving a sliver of
     the previous card visible keeps the shopper oriented after the jump. */
  const nudge = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.82, behavior: "smooth" });
  };

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => nudge(-1)}
        aria-label="Scroll left"
        className={cn("rail-arrow -left-3", atStart && "pointer-events-none opacity-0")}
      >
        <ChevronLeft size={17} />
      </button>

      <div
        ref={ref}
        role="region"
        aria-label={ariaLabel}
        className={cn("rail", itemClassName)}
      >
        {children}
      </div>

      <button
        type="button"
        onClick={() => nudge(1)}
        aria-label="Scroll right"
        className={cn("rail-arrow -right-3", atEnd && "pointer-events-none opacity-0")}
      >
        <ChevronRight size={17} />
      </button>
    </div>
  );
}
