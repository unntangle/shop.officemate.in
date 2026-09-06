"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { Search, X } from "lucide-react";
import { PRODUCTS, PRODUCT_IMAGES } from "@/constants/products";
import { CATEGORIES, categoryName } from "@/constants/categories";
import { CATEGORY_IMAGES } from "@/constants/home";
import { formatINR } from "@/lib/commerce";
import { cn } from "@/lib/utils";

/**
 * Strings cycled through the animated placeholder.
 *
 * Categories, not model names. A placeholder is a suggestion about how to
 * search, and "Zenpro" only helps someone who already knows the model — which
 * is exactly the shopper who does not need the hint. Categories tell a first
 * time visitor what this store actually sells.
 *
 * Derived from CATEGORIES rather than hand-listed so the header can never
 * advertise a category that has been renamed or removed. Lowercased because
 * the string renders mid-sentence, after "Search for".
 */
const TYPED_SUGGESTIONS = CATEGORIES.map((c) => c.name.toLowerCase());

const STATIC_PLACEHOLDER = "Search chairs, desks, storage…";

/**
 * Types a word out, holds, deletes it, moves to the next.
 *
 * Driven by a chain of one-shot timeouts keyed off the current text rather
 * than a single interval, because the four phases need different speeds:
 * deleting reads as sluggish at typing speed, and the hold at the end of a
 * word is what makes the name readable at all. An interval would force one
 * rate for all four.
 */
function useTypewriter(words: string[], enabled: boolean) {
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const word = words[index % words.length];
    const complete = !deleting && text === word;
    const cleared = deleting && text === "";

    /* Hold long enough to actually read the phrase, clear quickly. */
    const delay = complete ? 1800 : cleared ? 200 : deleting ? 35 : 80;

    const timer = window.setTimeout(() => {
      if (complete) {
        setDeleting(true);
        return;
      }
      if (cleared) {
        setDeleting(false);
        setIndex((i) => (i + 1) % words.length);
        return;
      }
      setText((prev) =>
        deleting ? word.slice(0, prev.length - 1) : word.slice(0, prev.length + 1)
      );
    }, delay);

    return () => window.clearTimeout(timer);
  }, [text, deleting, index, words, enabled]);

  return text;
}

/**
 * Header search with a type-ahead panel.
 *
 * Matching runs over name, tagline, category and badges, not just the name —
 * shoppers search by problem ("lumbar", "sit stand", "mesh") far more often
 * than by model, and a name-only match returns nothing for all of those.
 */
export function SearchBar({
  className,
  autoFocus,
}: {
  className?: string;
  /** Focus on mount. Only set by the header's expanding search row, where the
      field exists BECAUSE someone just pressed the search button — focusing it
      is finishing their gesture. Never set it on a field that is present on
      load: stealing focus scrolls the page on mobile and traps a screen reader
      in a search box the person never asked for. */
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  /* Viewport Y of the panel's top edge, measured rather than assumed.

     The popular-searches panel is full-bleed, so it cannot be positioned
     against this component — it has to be `fixed` to the viewport, and a fixed
     element needs a real number for `top`. The header's height is not a
     constant: it changes with the announcement bar, and on mobile the search
     field moves to a second row entirely. Hardcoding an offset would put the
     panel in the wrong place on at least one of those. */
  const [panelTop, setPanelTop] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* The typewriter can only start after mount. Rendering animated text during
     SSR would hand the client a different first frame than the server sent and
     trip a hydration mismatch, so the static placeholder is what ships in the
     HTML and the animation takes over afterwards. */
  useEffect(() => setMounted(true), []);

  /* Runs only while the field is empty. Once someone is typing, a second
     animated string in the same box is just competing with their own input.
     Suppressed entirely under prefers-reduced-motion. */
  const typerActive = mounted && !reduce && query.length === 0;
  const typed = useTypewriter(TYPED_SUGGESTIONS, typerActive);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return { products: [], categories: [] };

    const products = PRODUCTS.filter((p) =>
      [p.name, p.tagline, categoryName(p.category), ...p.badges]
        .join(" ")
        .toLowerCase()
        .includes(q)
    ).slice(0, 5);

    const categories = CATEGORIES.filter((c) =>
      `${c.name} ${c.tagline} ${(c.subcategories ?? []).join(" ")}`
        .toLowerCase()
        .includes(q)
    ).slice(0, 3);

    return { products, categories };
  }, [query]);

  const hasResults = results.products.length > 0 || results.categories.length > 0;

  /* Close on outside click. Without this the panel stays open behind the page
     when someone clicks a category tile, and reappears over the new route. */
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  /* Escape closes too. Once the panel opens on focus rather than on typing, a
     keyboard user who tabs into the field gets a panel they did not ask for,
     and without this the only way out is to tab through every tile in it. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  /* Keep the fixed panel glued to the bottom of the field.

     Re-measured on scroll as well as resize: the header is sticky, so the
     field's viewport position is stable once the page has scrolled past the
     top — but it MOVES during those first few hundred pixels as the page
     slides under it. Without the scroll listener the panel detaches and floats
     over the field on the way down.

     `passive: true` because neither handler calls preventDefault, and a
     non-passive scroll listener blocks the compositor on every frame. */
  useEffect(() => {
    if (!open) return;

    const measure = () => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (rect) setPanelTop(rect.bottom + 8);
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    router.push(`/products?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <form onSubmit={submit} role="search">
        <div className="search-sweep relative">
          {/* Focus beam. Two overlaid rects — the resting outline and the
              travelling neon dash.

              `rx` MUST be half the height, not an arbitrarily large number.
              CSS `border-radius: 9999px` clamps proportionally and gives a
              pill; SVG clamps rx and ry independently, so a large rx becomes
              half the WIDTH and the corner arcs meet in the middle — you get
              an ellipse, not a pill. The field is `h-11` (44px) and the svg is
              inset by the 1.5px stroke, so the drawn box is 42.5px tall and
              the radius is 21.25. Change this if the field height changes.

              `pathLength={100}` normalises the perimeter so
              `stroke-dasharray: 16 84` means "16% of the way round" at any
              width — the dash stays the same proportion on mobile as it is in
              the wide desktop header. */}
          <svg className="search-beam" aria-hidden="true" focusable="false">
            <rect
              className="beam-track"
              width="100%"
              height="100%"
              rx="21.25"
              pathLength={100}
            />
            <rect
              className="beam-head"
              width="100%"
              height="100%"
              rx="21.25"
              pathLength={100}
            />
          </svg>

          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            ref={inputRef}
            autoFocus={autoFocus}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            /* Emptied while the overlay is running, or the real placeholder
               would sit underneath the animated text. */
            placeholder={typerActive ? "" : STATIC_PLACEHOLDER}
            aria-label="Search products"
            /* No accent border or ring on focus. The outline is drawn by the
               wrapper's `.search-sweep` pseudo-element instead — if the border
               went red the instant the field was clicked, the travelling line
               would have nothing left to reveal. The global focus-visible
               outline is suppressed for the same reason. */
            className="h-11 w-full rounded-full border border-line bg-surface pl-10 pr-10 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:bg-white focus:outline-none focus-visible:outline-none"
          />
          {typerActive && (
            /* aria-hidden: this is decoration. The field is already named by
               its aria-label, and a screen reader announcing a string that
               rewrites itself twice a second would be actively hostile. */
            <span className="search-typer" aria-hidden="true">
              Search for {typed}
              <i className="search-caret" />
            </span>
          )}

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setOpen(false);
              }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-ink"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </form>

      {/* ------------------------------------------------ popular searches

          Shown on focus, before there is anything to match on. An empty
          dropdown is a wasted moment: the field has the shopper's full
          attention and nothing to offer them, so this fills it with the eight
          things the store actually sells.

          Tiles rather than a text list, following the reference. At this size
          a photograph identifies a category faster than its name does,
          particularly for the ones whose names are internal vocabulary — "Tele
          Pods" and "Leisure Lounges" mean very little cold, and the picture
          explains both instantly.

          Categories, not query strings. A "popular searches" list should be
          driven by real query data, and there is none — inventing a ranking
          would be a claim about shopper behaviour nobody has measured. These
          are CATEGORIES in their defined order, which is honest and, until
          analytics exist, just as useful. Swap the source when there is
          something real to sort by.

          `mousedown`, not `click`, on the outside-close handler above — a tile
          click would otherwise fire after the panel had already closed.

          FULL-BLEED, so `fixed` rather than `absolute`. An absolute panel is
          bound by this component's width, which is the search field's width;
          the reference runs edge to edge. `fixed` escapes the header's
          container entirely, at the cost of needing a measured `top` — see
          `panelTop` above.

          The white surface spans the viewport; the tiles inside sit in a
          `container`, so they line up with the logo and the nav above rather
          than starting hard against the window edge. */}
      {open && query.trim().length < 2 && (
        <div
          style={{ top: panelTop }}
          className="fixed inset-x-0 z-50 border-y border-line bg-white py-5 shadow-lift"
        >
          <div className="container">
            <p className="text-[0.85rem] font-semibold text-ink">
              Popular searches
            </p>

            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.slug}
                  href={`/products?category=${c.slug}`}
                  onClick={() => setOpen(false)}
                  className="group text-center"
                >
                  {/* Square well, image contained inside it. The well stays
                      put and only the photo scales on hover — eight tiles that
                      each lift make the panel feel unstable. Same treatment as
                      CategoryStrip and the mega menu. */}
                  <span className="relative block aspect-square w-full overflow-hidden rounded-xl bg-surface">
                    <Image
                      src={CATEGORY_IMAGES[c.slug] ?? ""}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 160px, 33vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                    />
                  </span>
                  <span className="mt-2.5 block text-[0.8rem] font-medium leading-tight text-muted transition-colors group-hover:text-ink">
                    {c.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-line bg-white shadow-lift">
          {!hasResults ? (
            <p className="px-4 py-6 text-center text-sm text-muted">
              Nothing matched “{query}”. Try “mesh”, “sit stand” or “storage”.
            </p>
          ) : (
            <>
              {results.categories.length > 0 && (
                <div className="border-b border-line p-2">
                  {results.categories.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/products?category=${c.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface"
                    >
                      <span className="font-medium text-ink">{c.name}</span>
                      <span className="text-[0.72rem] text-muted">Category</span>
                    </Link>
                  ))}
                </div>
              )}

              <div className="p-2">
                {results.products.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/products/${p.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface"
                  >
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface">
                      {PRODUCT_IMAGES[p.slug] && (
                        <Image
                          src={PRODUCT_IMAGES[p.slug]}
                          alt=""
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.82rem] font-semibold text-ink">
                        {p.name}
                      </span>
                      <span className="block truncate text-[0.72rem] text-muted">
                        {categoryName(p.category)}
                      </span>
                    </span>
                    <span className="shrink-0 text-[0.82rem] font-bold text-ink">
                      {formatINR(p.price)}
                    </span>
                  </Link>
                ))}
              </div>

              <button
                onClick={submit}
                className="w-full border-t border-line bg-surface py-2.5 text-[0.78rem] font-semibold text-ink transition-colors hover:bg-line"
              >
                See all results for “{query}”
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
