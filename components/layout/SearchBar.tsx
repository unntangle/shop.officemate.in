"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { Search, X } from "lucide-react";
import { PRODUCTS, PRODUCT_IMAGES } from "@/constants/products";
import { CATEGORIES, categoryName } from "@/constants/categories";
import { formatINR } from "@/lib/commerce";
import { cn } from "@/lib/utils";

/**
 * Product names cycled through the animated placeholder.
 *
 * Curated by hand rather than pulled from the catalogue. Two reasons: the
 * demo records in `constants/products.ts` still carry the old "Aeris" prefix,
 * which would advertise the wrong brand in the header; and a placeholder that
 * suggests a model with no photography sends people to a thin page. Keep this
 * to models that are photographed, in stock and worth landing on.
 */
const TYPED_SUGGESTIONS = [
  "Zenpro",
  "Altura sit-stand desk",
  "Webstar",
  "Jupiter",
  "Ferro",
  "executive chairs",
];

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

    /* Hold long enough to actually read the name, clear quickly. */
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
export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

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
                className="w-full border-t border-line bg-surface py-2.5 text-[0.78rem] font-semibold text-accent transition-colors hover:bg-accent-soft"
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
