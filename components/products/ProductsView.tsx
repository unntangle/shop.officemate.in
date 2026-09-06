"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, LayoutGrid, Search, SlidersHorizontal, X } from "lucide-react";
import type { CategorySlug } from "@/types";
import { CATEGORIES, categoryName } from "@/constants/categories";
import { CATEGORY_IMAGES } from "@/constants/home";
import { PLACEHOLDER_IMAGES, SUBCATEGORY_IMAGES } from "@/constants/products";
import { CATALOG, seriesIn } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { CatalogCard } from "@/components/products/CatalogCard";

/**
 * Category listing page.
 *
 * LAYOUT: breadcrumb, page title, a toolbar of Filters + count + search, then
 * the grid. Every filter lives in a right-hand drawer rather than a permanent
 * sidebar — one control at every breakpoint instead of a desktop rail and a
 * separate mobile sheet that had to be kept in step.
 *
 * COLOUR: CHARCOAL AND GREY, RED RESERVED FOR ERRORS. Same rule as the cart
 * and checkout pages. When the selected category, the active chip, the filter
 * badge and the slider were all red, red had stopped meaning anything — it was
 * simply "the colour of a control", which costs it exactly where it should
 * carry weight. Green on the cards stays: a discount is information, not an
 * action.
 *
 * THE DRAWER STAGES ITS CHANGES. Nothing filters until "Apply Filters" is
 * pressed, which is why there is a `draft` alongside the committed values read
 * from the URL. That is a deliberate change from the old live-filtering
 * sidebar: a drawer covers the grid, so filtering as you tick does work the
 * shopper cannot see, and on a phone they would apply four filters blind.
 */

/**
 * Sort options.
 *
 * Three, matching the agreed design. The previous build also carried "Biggest
 * discount", "Most reviewed" and "Newest"; they are dropped rather than hidden
 * because the sort is now a radio list where every option is visible at once,
 * and six rows pushed price and colour below the fold. Re-add here if wanted —
 * the `items` sort switch is the only other place that needs a case.
 */
const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price Low - High" },
  { id: "price-desc", label: "Price High - Low" },
] as const;

/**
 * Price bands.
 *
 * ⚠ THESE ARE NOT THE BANDS FROM THE REFERENCE DESIGN, AND THEY CANNOT BE.
 *
 * The reference runs "Under ₹1000" through "Above ₹5000", which suits a
 * homewares catalogue. This one is office furniture: the cheapest item in
 * CATALOG is about ₹7,000 and the dearest about ₹68,000. Shipped literally,
 * four of those five bands would match nothing at all and the fifth would
 * match all 47 products — five rows of filter that either do nothing or do
 * nothing.
 *
 * These bands cover the real spread instead, keeping the reference's shape:
 * five rows, an open-ended one at each end. Re-check them if real pricing
 * replaces the placeholder SERIES_PRICING in lib/catalog.ts, since today
 * roughly four in five items are priced from an invented series band.
 *
 * `max` is EXCLUSIVE so the bands cannot overlap — an item at exactly ₹20,000
 * belongs to one row, not two.
 */
const PRICE_BANDS = [
  { id: "under-10k", label: "Under ₹10,000", min: 0, max: 10000 },
  { id: "10k-20k", label: "₹10,000 - ₹20,000", min: 10000, max: 20000 },
  { id: "20k-35k", label: "₹20,000 - ₹35,000", min: 20000, max: 35000 },
  { id: "35k-50k", label: "₹35,000 - ₹50,000", min: 35000, max: 50000 },
  { id: "above-50k", label: "Above ₹50,000", min: 50000, max: Infinity },
] as const;

/**
 * Colour swatches, DERIVED FROM THE CATALOGUE rather than hardcoded.
 *
 * ⚠ AND THIS IS THE WEAKEST FILTER ON THE PAGE. Read before relying on it.
 *
 * The reference shows eight fixed swatches — Black, Grey, White, Brown, Red,
 * Orange, Yellow, Green. Nothing in this codebase carries colours in those
 * terms. Colourways exist only on the nine records in `constants/products.ts`
 * ("Black", "Grey", "Graphite", "White Oak", "Ivory" and so on); the 45 models
 * in `constants/chairs.ts` have NO colour data whatsoever.
 *
 * So the swatches are built from the colourways that genuinely exist, using
 * each one's real name and real hex. That keeps the filter honest — every
 * swatch shown can actually match something — but it does not fix the gap:
 * SELECTING ANY COLOUR HIDES EVERY MODEL WITHOUT COLOUR DATA, which today is
 * the large majority of the catalogue. A shopper filtering for black loses
 * chairs that are, in fact, available in black.
 *
 * THE FIX IS DATA, NOT CODE: add a `colors` array to the entries in
 * chairs.ts. This list and the filter below both pick that up with no change.
 * Until then, treat the section as provisional — or comment out the
 * `<FilterSection id="color">` block if the client would rather not ship a
 * filter that under-reports.
 */
const COLOR_OPTIONS: { name: string; hex: string }[] = (() => {
  const seen = new Map<string, string>();
  for (const item of CATALOG) {
    for (const colour of item.product?.colors ?? []) {
      if (!seen.has(colour.name)) seen.set(colour.name, colour.hex);
    }
  }
  return Array.from(seen, ([name, hex]) => ({ name, hex }));
})();

/** Everything the drawer stages before "Apply Filters" commits it. */
interface Draft {
  sort: string;
  category: CategorySlug | "all";
  sub: string | null;
  band: string | null;
  colors: string[];
}

/**
 * Short label for a series circle: "Executive Series" → "Executive".
 *
 * The full names are internal vocabulary and far too long for a 72px circle —
 * "Leatherette Series" wraps to three lines and pushes the row out of
 * alignment. The word "Series" is also redundant when every label in the row
 * carries it. `footerLinks.ts` does the same trimming for the same reason.
 */
const seriesLabel = (series: string) => series.replace(/\s+Series$/i, "");

/**
 * Artwork for a series circle, and HOW IT SHOULD BE FITTED.
 *
 * The two matter together, which is why they are returned together. The
 * sources are different kinds of picture and fitting them the same way is
 * what made the circles clip:
 *
 *   PRODUCT SHOTS — `SUBCATEGORY_IMAGES` and the model photography in
 *   CATALOG are chairs shot on white with no margin around them. Under
 *   `object-cover` a portrait chair is scaled to fill a square, so the
 *   armrests and castors go outside the box and the circle then trims the
 *   corners off what is left. They need `contain`, with padding, so the whole
 *   chair sits inside the circle.
 *
 *   LIFESTYLE PHOTOS — `CATEGORY_IMAGES` are Unsplash room shots with their
 *   own backgrounds. `contain` would letterbox them into a circle, which
 *   looks broken. They want `cover`, and cropping a room shot costs nothing.
 *
 * Ordered most specific first: a curated shot for this exact series, then any
 * real photographed model from it, then the category photo so a circle is
 * never empty. All three can be missing, in which case the caller draws a
 * glyph instead.
 */
interface SeriesArt {
  src: string;
  /** True for cut-out product shots; false for lifestyle photography. */
  contain: boolean;
}

function seriesImage(
  category: CategorySlug,
  series: string
): SeriesArt | undefined {
  const curated = SUBCATEGORY_IMAGES[`${category}:${series}`];
  if (curated) return { src: curated, contain: true };

  const model = CATALOG.find(
    (i) => i.category === category && i.subcategory === series && i.image
  )?.image;
  if (model) return { src: model, contain: true };

  const lifestyle = CATEGORY_IMAGES[category];
  if (lifestyle) return { src: lifestyle, contain: false };

  return undefined;
}

/* ------------------------------------------------------------------ atoms */

/**
 * A collapsible block inside the drawer.
 *
 * Declared at module scope, not inside the view. A component defined in a
 * render body is a NEW type on every render, so React unmounts and remounts
 * its whole subtree — which would drop focus and reset any open/closed state
 * the moment a swatch was ticked.
 */
function FilterSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-line py-5 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3"
      >
        <span className="text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-muted">
          {title}
        </span>
        <ChevronDown
          size={18}
          className={cn(
            "shrink-0 text-muted transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && <div className="mt-4 space-y-2.5">{children}</div>}
    </section>
  );
}

/**
 * One radio row.
 *
 * A `button` rather than a real `<input type="radio">`. These are staged
 * choices in a dialog, not a form that submits, and a native radio group would
 * need a shared `name` per section plus its own labels to style the way the
 * design asks. `aria-checked` with `role="radio"` gives assistive tech the
 * same information.
 */
function RadioRow({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-[0.9rem] transition-colors",
        selected
          ? "border-ink font-semibold text-ink"
          : "border-line text-ink hover:border-ink/30"
      )}
    >
      <span
        className={cn(
          "grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
          selected ? "border-ink" : "border-line"
        )}
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}
      </span>
      {label}
    </button>
  );
}

/**
 * One colour swatch.
 *
 * The tick box is white with a hairline border in EVERY state rather than
 * taking the swatch's colour. It has to sit legibly on both a near-black
 * swatch and an ivory one, and any single tinted treatment fails at one end or
 * the other. The tile carries an inset ring for the same reason: without it a
 * white or ivory swatch has no edge against the drawer.
 */
function ColorTile({
  name,
  hex,
  selected,
  onToggle,
}: {
  name: string;
  hex: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={cn(
        "overflow-hidden rounded-xl text-left transition-shadow",
        selected && "ring-2 ring-ink ring-offset-1"
      )}
    >
      <span
        className="flex h-16 w-full items-start p-2 ring-1 ring-inset ring-black/10"
        style={{ backgroundColor: hex }}
      >
        <span className="grid h-5 w-5 place-items-center rounded-[5px] border border-black/15 bg-white shadow-sm">
          {selected && <Check size={13} strokeWidth={3} className="text-ink" />}
        </span>
      </span>
      <span
        className={cn(
          "block px-2 py-1.5 text-center text-[0.76rem] font-medium transition-colors",
          selected ? "bg-ink text-white" : "bg-surface text-ink"
        )}
      >
        {name}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------- view */

export function ProductsView() {
  const router = useRouter();
  const params = useSearchParams();

  /* Committed filters. The URL is the source of truth for all of them, so a
     filtered view is shareable and the back button steps through it. */
  const activeCategory = (params.get("category") as CategorySlug | null) ?? "all";
  const activeSub = params.get("sub");
  const activeBand = params.get("price");
  /* Kept as the raw string as well as the parsed array. The array is a new
     identity on every render, so using it as a `useMemo` dependency would
     recompute the whole filtered list each time; the string is stable. */
  const colorParam = params.get("color") ?? "";
  const activeColors = useMemo(
    () => colorParam.split(",").filter(Boolean),
    [colorParam]
  );
  const urlQuery = params.get("q") ?? "";
  const urlSort = params.get("sort") ?? "featured";

  const [query, setQuery] = useState(urlQuery);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    sort: true,
    category: true,
    price: true,
    color: true,
  });

  const [draft, setDraft] = useState<Draft>({
    sort: urlSort,
    category: activeCategory,
    sub: activeSub,
    band: activeBand,
    colors: activeColors,
  });

  /**
   * The last value THIS component wrote into `?q=`.
   *
   * The URL is a round trip: the debounce effect patches it, Next re-renders
   * with the new param, and the sync effect fires with what we just wrote.
   * Left unguarded, that echo can land AFTER the shopper has typed another
   * character and overwrite it — replacing "mesh c" with the "mesh" pushed a
   * moment earlier, so characters vanish while typing.
   *
   * Comparing against what we pushed lets a GENUINE external change through
   * (the header search, a shared link, the back button) while ignoring our
   * own.
   */
  const selfPushed = useRef<string | null>(null);

  useEffect(() => {
    if (selfPushed.current === urlQuery) return;
    selfPushed.current = null;
    setQuery(urlQuery);
  }, [urlQuery]);

  const patch = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(Array.from(params.entries()));
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    /* MUST match the route this view is mounted on, which is /categories
       (app/categories/page.tsx). Pointing it anywhere else means every filter
       navigates away from the page doing the filtering — and since /products
       no longer exists, that would be a 404. */
    const qs = next.toString();
    router.replace(qs ? `/categories?${qs}` : "/categories", { scroll: false });
  };

  /**
   * Mirror the typed query into `?q=`, on a delay.
   *
   * The GRID does not wait for this — `items` reads `query` directly, so
   * results narrow on every keystroke. This exists only so the URL is
   * shareable, which is why it can afford to lag. 400ms rather than per
   * keystroke: `router.replace` re-runs the App Router's navigation machinery
   * and firing that per character makes typing stutter on a mid-range phone.
   *
   * `patch` is deliberately not a dependency — it is redefined every render,
   * so including it would reschedule the timer constantly and the debounce
   * would never fire.
   */
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === urlQuery) return;

    const timer = window.setTimeout(() => {
      selfPushed.current = trimmed;
      patch({ q: trimmed || null });
    }, 400);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, urlQuery]);

  /* Re-seed the draft from the URL every time the drawer opens, so a shopper
     who closes it without applying and reopens sees what is actually in
     effect rather than their abandoned edits. */
  const openDrawer = () => {
    setDraft({
      sort: urlSort,
      category: activeCategory,
      sub: activeSub,
      band: activeBand,
      colors: activeColors,
    });
    setDrawerOpen(true);
  };

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const applyDraft = () => {
    patch({
      sort: draft.sort === "featured" ? null : draft.sort,
      category: draft.category === "all" ? null : draft.category,
      sub: draft.sub,
      price: draft.band,
      color: draft.colors.length ? draft.colors.join(",") : null,
    });
    setDrawerOpen(false);
  };

  /* Clear resets the DRAFT only — it does not commit. The shopper still
     presses Apply, which keeps one button responsible for changing the grid
     and means an accidental Clear can be undone by closing the drawer. */
  const clearDraft = () =>
    setDraft({
      sort: "featured",
      category: "all",
      sub: null,
      band: null,
      colors: [],
    });

  const items = useMemo(() => {
    let list = CATALOG.slice();

    if (activeCategory !== "all") {
      list = list.filter((i) => i.category === activeCategory);
    }
    if (activeSub) list = list.filter((i) => i.subcategory === activeSub);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((i) =>
        `${i.name} ${i.subcategory}`.toLowerCase().includes(q)
      );
    }

    const band = PRICE_BANDS.find((b) => b.id === activeBand);
    if (band) {
      list = list.filter((i) => i.price >= band.min && i.price < band.max);
    }

    /* See the COLOR_OPTIONS warning: an item with no colour data cannot match
       any colour, so this necessarily hides most of the catalogue today. */
    if (activeColors.length > 0) {
      list = list.filter((i) =>
        (i.product?.colors ?? []).some((c) => activeColors.includes(c.name))
      );
    }

    switch (urlSort) {
      case "price-asc":
        return list.sort((a, b) => a.price - b.price);
      case "price-desc":
        return list.sort((a, b) => b.price - a.price);
      default:
        /* Featured: photographed and priced models first. A grid that opens on
           a wall of generated placeholders reads as an empty shop. */
        return list.sort(
          (a, b) =>
            Number(Boolean(b.image)) - Number(Boolean(a.image)) ||
            Number(!b.pricingIsEstimated) - Number(!a.pricingIsEstimated)
        );
    }
  }, [
    activeCategory,
    activeSub,
    activeBand,
    activeColors,
    query,
    urlSort,
  ]);

  /**
   * The badge on the Filters button.
   *
   * Counts ONLY what the drawer owns — price and colour.
   *
   * Category and series are both excluded because both are already spelled
   * out elsewhere on screen: the category in the title and breadcrumb, the
   * series in the circle rail beside it, where the active one is visibly
   * ringed. Counting them would tell a shopper who simply clicked "Chairs"
   * and then "Task" that they have two filters applied, which reads as
   * something to go and undo.
   */
  const appliedCount = (activeBand ? 1 : 0) + activeColors.length;

  /* The title stays the CATEGORY even when a series is selected. The series
     is shown by the rail, which rings the active circle, and by the last
     breadcrumb crumb — swapping the h1 to "Executive" as well would state it
     three times and lose the only label saying which category you are in. */
  const heading =
    activeCategory === "all" ? "All Categories" : categoryName(activeCategory);

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "All Categories", href: "/categories" },
    ...(activeCategory === "all"
      ? []
      : [
          {
            label: categoryName(activeCategory),
            href: `/categories?category=${activeCategory}`,
          },
        ]),
    ...(activeSub ? [{ label: activeSub }] : []),
  ];

  const toggleSection = (id: string) =>
    setOpenSections((s) => ({ ...s, [id]: !(s[id] ?? true) }));

  /**
   * Whether this render is the DIRECTORY or a LISTING.
   *
   * /categories with nothing applied is a directory: eight category tiles,
   * the way the homepage bento and the header's "All Categories" panel both
   * present the range. It is not a 47-product dump, which is what it used to
   * be — an undifferentiated wall of chairs is a poor answer to "show me
   * everything you sell", because almost none of it is what any one visitor
   * came for.
   *
   * The moment ANYTHING narrows the range — a category, a series, a price
   * band, a colour or a search term — the question changes from "what do you
   * sell" to "show me these", and the product grid takes over. That is why
   * search stays visible on the directory: typing is the one way to reach the
   * full cross-category product grid from here.
   */
  const showDirectory =
    activeCategory === "all" &&
    !activeSub &&
    !activeBand &&
    activeColors.length === 0 &&
    !query.trim();

  /**
   * Series available in the CURRENT category, for the circle rail.
   *
   * Guarded on a real category: `seriesIn("all")` returns every series across
   * the whole catalogue, which is nineteen unrelated names and meaningless as
   * a row of circles.
   *
   * Shown only when there is more than one. A rail reading "All / Sofas" is a
   * choice with no alternative in it.
   */
  const categorySeries =
    activeCategory === "all" ? [] : seriesIn(activeCategory);
  const showSeriesRail = !showDirectory && categorySeries.length > 1;

  /**
   * The search field, rendered in one of two places.
   *
   * On a LISTING it sits in the toolbar beside Filters and the item count.
   * On the DIRECTORY there is no toolbar — nothing to filter, nothing to
   * count — so it moves up onto the title row instead. Left in a toolbar of
   * its own it was stranded on an otherwise empty line below the heading.
   *
   * A function taking the wrapper classes rather than two copies of the
   * markup: the field carries a controlled input, a clear button and the
   * WebKit cancel-button suppression, and two copies of that drift.
   */
  const renderSearch = (className: string) => (
    <div className={cn("relative flex h-10 items-center", className)}>
      <Search
        size={15}
        className="pointer-events-none absolute left-3.5 text-muted"
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or series…"
        aria-label="Search products"
        className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-9 text-[0.8rem] text-ink outline-none transition-colors placeholder:text-muted focus:border-ink focus-visible:outline-none [&::-webkit-search-cancel-button]:appearance-none"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          aria-label="Clear search"
          className="absolute right-2.5 flex h-5 w-5 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );

  return (
    <div>
      {/* ------------------------------------------------------- page head

          Deliberately understated. This block is a signpost, not a hero: it
          tells you where you are and gets out of the way of the grid, which
          is the thing people came for. An oversized title pushes the first
          row of product below the fold on a laptop and reads as a landing
          page rather than a listing.

          The sizes are a step down from the site's `section-title` scale for
          that reason — do not reach for `display` weight here. */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="min-w-0">
          <Breadcrumb items={crumbs} />

          <h1 className="mt-2 text-[1.5rem] font-bold leading-tight tracking-[-0.02em] text-ink sm:text-[1.75rem]">
            {heading}
          </h1>
        </div>

        {/* Series rail.

            The series were reachable only from inside the filter drawer,
            which buried the single most useful cut of a category behind two
            taps and a panel that covers the grid. Out here they are visible
            on arrival, they show which one is active, and they are one tap.

            THESE APPLY IMMEDIATELY, unlike the drawer. That is not an
            oversight: this is navigation, the same as clicking a category,
            and staging a nav control behind an Apply button would be strange.
            It is also why the drawer no longer carries a Series section —
            two controls for one filter, one instant and one staged, is a
            contradiction waiting to confuse someone.

            Horizontally scrollable below `lg`. Office Chairs alone has six
            series plus "All", which will not fit a phone at any circle size
            worth tapping.

            THE PADDING IS LOAD-BEARING, not spacing. `overflow-x-auto`
            computes `overflow-y` to `auto` as well — the two cannot be
            visible and auto independently — so this box clips in BOTH
            directions. The active circle's `ring-2 ring-offset-2` paints 4px
            outside its own edge, and with no padding that ring was sliced
            flat against the top of the container. `py-1.5` (6px) clears it
            with a little room; the matching `lg:px-1.5` does the same for the
            first and last circles' rings, and the negative margins cancel the
            padding so the row still aligns with the grid below. */}
        {showSeriesRail && (
          <div
            className="-mx-4 flex shrink-0 gap-4 overflow-x-auto px-4 py-1.5 [scrollbar-width:none] sm:gap-5 lg:-mx-1.5 lg:px-1.5 [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label="Filter by series"
          >
            {[null, ...categorySeries].map((series) => {
              const active = activeSub === series;
              const label = series ? seriesLabel(series) : "All";
              const art = series
                ? seriesImage(activeCategory as CategorySlug, series)
                : undefined;

              return (
                <button
                  key={series ?? "all"}
                  onClick={() => patch({ sub: series })}
                  aria-pressed={active}
                  className="group flex w-[4.5rem] shrink-0 flex-col items-center gap-2"
                >
                  <span
                    className={cn(
                      "relative grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-white transition-all duration-200",
                      /* WHITE, not `surface`. The product shots are on white
                         backgrounds, so a grey circle behind a `contain`d
                         chair shows the photo's own white square as a hard
                         edge inside the circle. White makes the two meet
                         invisibly and lets the ring draw the only edge. */
                      /* Ring plus offset rather than a border: a border would
                         eat 2px of the photograph and make the active circle
                         visibly smaller than its neighbours. */
                      active
                        ? "ring-2 ring-ink ring-offset-2"
                        : "ring-1 ring-line group-hover:ring-ink/30"
                    )}
                  >
                    {art ? (
                      <Image
                        src={art.src}
                        alt=""
                        fill
                        sizes="64px"
                        className={cn(
                          "transition-all duration-300",
                          /* See `seriesImage`: product shots are contained
                             and padded so the whole chair fits the circle;
                             lifestyle photos cover it. `fill` makes this
                             absolute, and object-fit resolves inside the
                             padding box, so `p-2` genuinely insets the
                             chair rather than being ignored. */
                          art.contain
                            ? "object-contain p-2"
                            : "object-cover",
                          /* Inactive circles desaturate, so the selected one
                             and the product grid are the only colour in this
                             band. Same treatment the old filter rail used. */
                          active ? "" : "grayscale group-hover:grayscale-0"
                        )}
                      />
                    ) : (
                      <LayoutGrid
                        size={20}
                        className={active ? "text-ink" : "text-muted"}
                      />
                    )}
                  </span>

                  <span
                    className={cn(
                      "text-center text-[0.72rem] leading-tight transition-colors",
                      active
                        ? "font-semibold text-ink"
                        : "text-muted group-hover:text-ink"
                    )}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* On the directory the search shares the title row. `justify-between`
            on the wrapper pushes it right, opposite the heading, which is the
            same place the series rail occupies on a listing — so the two
            layouts put their right-hand control in the same spot. */}
        {showDirectory &&
          renderSearch("w-full shrink-0 lg:w-[18rem]")}
      </div>

      {/* ---------------------------------------------------------- toolbar

          LISTING ONLY. On the directory there is nothing to filter and
          nothing to count, and the search has moved up beside the title.
          Rendering this row there anyway is what left the field stranded on
          an otherwise empty line. */}
      {!showDirectory && (
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2.5">
          <button
            onClick={openDrawer}
            className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-surface px-3.5 text-[0.82rem] font-semibold text-ink transition-colors hover:bg-line"
          >
            <SlidersHorizontal size={15} />
            Filters
            {appliedCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-night px-1 text-[0.6rem] font-bold text-white">
                {appliedCount}
              </span>
            )}
          </button>

          <p className="shrink-0 text-[0.82rem] text-muted">
            Showing{" "}
            <span className="font-semibold text-ink">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </p>

          {/* Search stays out here rather than moving into the drawer.
              Typing narrows the grid live, and a live control belongs where
              the results are visible — behind a panel that covers them it
              would be the one filter you cannot watch work.

              Capped at `max-w-xs` so it reads as a utility beside the Filters
              button rather than a second hero element. */}
          {renderSearch(
            "w-full sm:ml-auto sm:w-auto sm:min-w-[13rem] sm:max-w-xs sm:flex-1"
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- grid */}
      {showDirectory ? (
        /* Category tiles.

           `object-cover`, not `contain`, because CATEGORY_IMAGES currently
           holds stock JPEGs with their own backgrounds — see the note on that
           constant. If real cut-out PNGs on white ever replace them, switch
           this to `object-contain` and the product will float on the grey
           well the way the reference does.

           The well is static and only the photo inside it scales on hover.
           Eight tiles that each lift make the row feel unstable — the same
           reasoning as CategoryStrip and the header mega-menu, so all three
           surfaces behave alike. */
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {CATEGORIES.map((category, i) => (
            <Link
              key={category.slug}
              href={`/categories?category=${category.slug}`}
              className="group flex flex-col rounded-2xl bg-surface p-3 transition-colors hover:bg-line/70"
            >
              <span className="relative block aspect-square w-full overflow-hidden rounded-xl">
                <Image
                  src={
                    CATEGORY_IMAGES[category.slug] ??
                    PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length]
                  }
                  alt=""
                  fill
                  sizes="(max-width: 768px) 45vw, 340px"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </span>
              <span className="mt-3 block pb-0.5 text-center text-[0.85rem] font-medium leading-snug text-muted transition-colors group-hover:text-ink">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      ) : items.length > 0 ? (
        <motion.div
          layout
          className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <CatalogCard key={item.slug} item={item} />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-line py-20 text-center">
          {/* The message names the search term when there is one. "Nothing
              matches those filters" is misleading after a typo — it points at
              the drawer when the cause is the field. */}
          <p className="text-lg font-semibold text-ink">
            {query.trim()
              ? `Nothing matches “${query.trim()}”`
              : "Nothing matches those filters"}
          </p>
          <p className="mt-2 max-w-sm text-sm text-muted">
            {query.trim()
              ? "Check the spelling or try a shorter word — searching matches product and series names."
              : "Try a wider price band, or clear the colour filter — most models do not carry colourways yet."}
          </p>
          <button
            onClick={() => {
              setQuery("");
              patch({
                category: null,
                sub: null,
                price: null,
                color: null,
                q: null,
              });
            }}
            className="mt-6 rounded-xl border-2 border-line px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* ----------------------------------------------------- filter drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-[65] bg-scrim/50 backdrop-blur-[2px]"
              aria-hidden
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: EASE }}
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              className="fixed right-0 top-0 z-[66] flex h-dvh w-full max-w-[26rem] flex-col bg-white shadow-lift"
            >
              <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
                <h2 className="flex items-center gap-2.5 text-[1.15rem] font-bold text-ink">
                  <SlidersHorizontal size={20} />
                  Filter
                </h2>
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close filters"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink"
                >
                  <X size={20} />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto px-5">
                <FilterSection
                  title="Sort by"
                  open={openSections.sort}
                  onToggle={() => toggleSection("sort")}
                >
                  <div role="radiogroup" className="space-y-2.5">
                    {SORTS.map((s) => (
                      <RadioRow
                        key={s.id}
                        label={s.label}
                        selected={draft.sort === s.id}
                        onSelect={() => setDraft((d) => ({ ...d, sort: s.id }))}
                      />
                    ))}
                  </div>
                </FilterSection>

                {/* CATEGORY IS NOT IN THE REFERENCE DRAWER, and is here
                    because the reference has no sidebar either — between the
                    two, a shopper would have had no way to change category
                    from this page at all except the header menu. */}
                <FilterSection
                  title="Category"
                  open={openSections.category}
                  onToggle={() => toggleSection("category")}
                >
                  <div role="radiogroup" className="space-y-2.5">
                    <RadioRow
                      label="All categories"
                      selected={draft.category === "all"}
                      onSelect={() =>
                        setDraft((d) => ({ ...d, category: "all", sub: null }))
                      }
                    />
                    {CATEGORIES.map((c) => (
                      <RadioRow
                        key={c.slug}
                        label={c.name}
                        selected={draft.category === c.slug}
                        onSelect={() =>
                          /* Reset the series too. Series names do not carry
                             across categories, so keeping the old one would
                             apply a filter that matches nothing. */
                          setDraft((d) => ({
                            ...d,
                            category: c.slug,
                            sub: null,
                          }))
                        }
                      />
                    ))}
                  </div>
                </FilterSection>

                {/* NO SERIES SECTION HERE. Series are chosen from the circle
                    rail beside the page title instead — see the note there.
                    Having both would mean one filter with two controls that
                    behave differently: the rail applies on tap, the drawer
                    only on Apply.

                    `draft.sub` is still carried through `applyDraft` even
                    though nothing here edits it, so applying a price or
                    colour does not silently wipe the series the rail set. */}

                <FilterSection
                  title="Price range"
                  open={openSections.price}
                  onToggle={() => toggleSection("price")}
                >
                  <div role="radiogroup" className="space-y-2.5">
                    {PRICE_BANDS.map((b) => (
                      <RadioRow
                        key={b.id}
                        label={b.label}
                        selected={draft.band === b.id}
                        onSelect={() =>
                          /* Tapping the selected band again clears it. Without
                             this a radio group with no "Any price" row is a
                             one-way door — once a band is picked there is no
                             way back to the full range short of Clear. */
                          setDraft((d) => ({
                            ...d,
                            band: d.band === b.id ? null : b.id,
                          }))
                        }
                      />
                    ))}
                  </div>
                </FilterSection>

                {COLOR_OPTIONS.length > 0 && (
                  <FilterSection
                    title="Color"
                    open={openSections.color}
                    onToggle={() => toggleSection("color")}
                  >
                    <div className="grid grid-cols-4 gap-2.5">
                      {COLOR_OPTIONS.map((c) => (
                        <ColorTile
                          key={c.name}
                          name={c.name}
                          hex={c.hex}
                          selected={draft.colors.includes(c.name)}
                          onToggle={() =>
                            setDraft((d) => ({
                              ...d,
                              colors: d.colors.includes(c.name)
                                ? d.colors.filter((n) => n !== c.name)
                                : [...d.colors, c.name],
                            }))
                          }
                        />
                      ))}
                    </div>

                    {/* Stated on screen, not just in a code comment. A filter
                        that silently under-reports is worse than one that
                        admits its limits. Remove this line once chairs.ts
                        carries colour data. */}
                    <p className="pt-1 text-[0.72rem] leading-relaxed text-muted">
                      Colourways are recorded for part of the range only —
                      filtering by colour hides models we have not catalogued
                      yet.
                    </p>
                  </FilterSection>
                )}
              </div>

              <footer className="flex gap-3 border-t border-line p-4">
                <button
                  onClick={clearDraft}
                  className="flex-1 rounded-xl border-2 border-line py-3.5 text-[0.95rem] font-semibold text-ink transition-colors hover:border-ink"
                >
                  Clear
                </button>
                <button
                  onClick={applyDraft}
                  className="flex-[2] rounded-xl bg-night py-3.5 text-[0.95rem] font-semibold text-white transition-colors hover:bg-night-deep active:scale-[0.99]"
                >
                  Apply Filters
                </button>
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
