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
 *
 * `controls` swaps the edge arrows for a dots-and-arrows cluster centred below
 * the rail. Use it where the rail is the main event and the overlay arrows sit
 * awkwardly over card corners; keep the default where the rail is one of
 * several on a page and the chrome should stay out of the way.
 */
export function Rail({
  children,
  className,
  itemClassName,
  ariaLabel,
  controls = false,
  autoplay = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** Applied to the scroller, e.g. to change gap or padding. */
  itemClassName?: string;
  ariaLabel?: string;
  /** Render paging dots and arrows below the rail instead of edge arrows. */
  controls?: boolean;
  /** Advance a page every few seconds, wrapping back to the start. */
  autoplay?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 4);
    /* 4px of slack absorbs sub-pixel rounding, which otherwise leaves the
       right arrow visible on a rail that is already fully scrolled. */
    setAtEnd(el.scrollLeft >= max - 4);

    /* Pages, not cards. Dots track how many screenfuls the rail holds, so the
       count stays sane whether there are six cards or sixty — one dot per
       card would be a hairline smear on a long rail. */
    const w = el.clientWidth || 1;
    const count = Math.max(1, Math.ceil(el.scrollWidth / w));
    setPages(count);
    setPage(Math.min(count - 1, Math.round(el.scrollLeft / w)));
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
     the previous card visible keeps the shopper oriented after the jump.

     With `controls` on, page by the full width instead — otherwise each nudge
     lands 18% short of a page boundary and the dots drift out of step with
     what is actually on screen. */
  const nudge = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const step = controls ? el.clientWidth : el.clientWidth * 0.82;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  const goTo = (i: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  /* Autoplay wraps by scrolling back to 0 rather than by cloning the children.

     Cloning would give a seamless infinite belt, but it means duplicate cards
     in the DOM — duplicate links, duplicate Add-to-cart buttons, and the same
     product announced twice to a screen reader. For a five-card rail the
     rewind is a fair trade for keeping one card per product and leaving the
     native scroller intact.

     Not gated on reduced motion: freezing the rail would hide the later cards
     from those users entirely, which is the mistake the hero carousel used to
     make. Motion preference is about HOW it moves, not whether the content is
     reachable. */
  useEffect(() => {
    if (!autoplay || paused || pages <= 1) return;
    const id = window.setInterval(() => {
      const el = ref.current;
      if (!el) return;
      const w = el.clientWidth || 1;
      const next = Math.round(el.scrollLeft / w) + 1;
      el.scrollTo({
        left: next >= pages ? 0 : next * w,
        behavior: "smooth",
      });
    }, 3500);
    return () => window.clearInterval(id);
  }, [autoplay, paused, pages]);

  return (
    <div
      className={cn("relative", className)}
      /* Pause on hover and on keyboard focus. Without the focus half, a
         keyboard user tabbing through the cards has the rail scroll out from
         under them mid-tab. */
      onMouseEnter={autoplay ? () => setPaused(true) : undefined}
      onMouseLeave={autoplay ? () => setPaused(false) : undefined}
      onFocusCapture={autoplay ? () => setPaused(true) : undefined}
      onBlurCapture={autoplay ? () => setPaused(false) : undefined}
    >
      {/* Edge arrows only when there is no bottom cluster. With `controls` on,
         the cluster carries navigation and a second pair overlaying the card
         corners is duplicate chrome. */}
      {!controls && (
        <button
          type="button"
          onClick={() => nudge(-1)}
          aria-label="Scroll left"
          className={cn(
            "rail-arrow -left-3",
            atStart && "pointer-events-none opacity-0"
          )}
        >
          <ChevronLeft size={17} />
        </button>
      )}

      <div
        ref={ref}
        role="region"
        aria-label={ariaLabel}
        className={cn("rail", itemClassName)}
      >
        {children}
      </div>

      {!controls && (
        <button
          type="button"
          onClick={() => nudge(1)}
          aria-label="Scroll right"
          className={cn(
            "rail-arrow -right-3",
            atEnd && "pointer-events-none opacity-0"
          )}
        >
          <ChevronRight size={17} />
        </button>
      )}

      {/* Hidden when everything already fits: a single dot and two dead arrows
          under a rail that cannot scroll is chrome describing nothing. */}
      {controls && pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => nudge(-1)}
            disabled={atStart}
            aria-label="Scroll left"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink transition-colors hover:bg-line disabled:opacity-40"
          >
            <ChevronLeft size={17} />
          </button>

          {/* Dots sit between the arrows: position in the middle, direction
              either side of it. */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Page ${i + 1} of ${pages}`}
                aria-current={i === page}
                /* The active dot stretches into a bar rather than just
                   darkening, so position is readable at a glance without
                   relying on colour alone. */
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === page ? "w-6 bg-ink" : "w-1.5 bg-ink/20 hover:bg-ink/35"
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => nudge(1)}
            disabled={atEnd}
            aria-label="Scroll right"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink transition-colors hover:bg-line disabled:opacity-40"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
