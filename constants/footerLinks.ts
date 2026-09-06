import type { CategorySlug } from "@/types";
import { CATEGORIES } from "@/constants/categories";
import { ZONE_TILES } from "@/constants/home";
import { PRODUCTS, PRODUCT_IMAGES } from "@/constants/products";

/* =========================================================================
   FOOTER LINK CLOUD

   The dense, pipe-separated band that sits under the main footer columns —
   the same job Wakefit's "Shop By Popular Categories / Shop By Rooms / Retail
   Stores" block does, rewritten for an office-furniture catalogue.

   It is NOT a second navigation menu. The five columns above it already carry
   Shop / Help / Policies / Company, and repeating those here would dilute
   both. Everything in this file is *deeper* than the menu above: individual
   chair series, individual product pages, sort views, workspace zones and the
   trust signals a buyer looks for before paying.

   TWO RULES, both learned the hard way in this codebase:

     1. EVERY href here must resolve today. Placeholder routes (/resources/*,
        for example) 404 rather than rendering an "under development" page,
        and a footer full of 404s is worse for crawling than no footer block
        at all. When guide pages land, add them here — not before.

     2. `?sub=` is only safe on `office-chairs`. `lib/catalog.ts` builds the
        catalogue from CHAIR_MODELS, so only the six chair series exist as
        real `subcategory` values. Every other category resolves through
        PRODUCTS orphans whose subcategory is the literal string "Featured",
        so `?category=office-tables&sub=Conference Table Series` renders an
        empty grid. Non-chair categories are therefore linked at category
        level only.

   A THIRD, EASY TRAP: /products/<slug> is NOT valid for all 44 models. Note
   the listing page lives at /categories while an individual product page is
   still /products/<slug> — the two are different routes, and `plp` below is
   the only place that should build the former.
   `app/products/[slug]/page.tsx` resolves through `getProduct`, which reads
   PRODUCTS — the nine richly-specified records — and calls `notFound()` for
   anything else. A model can appear in the listing grid (CATALOG merges
   CHAIR_MODELS in) and still 404 on its own page. That is why the featured
   models below are derived from PRODUCTS rather than hand-listed.
========================================================================= */

export type FooterLink = {
  label: string;
  /** Omit for a plain text item — payment methods and certifications are
      statements, not destinations, and marking them up as links would be a
      lie to both a shopper and a crawler. */
  href?: string;
  /** Opens in a new tab. Used for Google Maps links. */
  external?: boolean;
};

export type FooterLinkSet = {
  heading: string;
  links: FooterLink[];
};

export type FooterLinkColumn = {
  title: string;
  sets: FooterLinkSet[];
};

/** Category listing page URL. See rule 2 above before passing `sub`. */
const plp = (category: CategorySlug, sub?: string) =>
  sub
    ? `/categories?category=${category}&sub=${encodeURIComponent(sub)}`
    : `/categories?category=${category}`;

/**
 * "Executive Series" → "Executive Chairs", but "Cafe Chairs Series" stays
 * "Cafe Chairs" rather than becoming "Cafe Chairs Chairs". A shopper scanning
 * a footer reads nouns, not internal series names.
 */
const seriesLabel = (series: string) => {
  const base = series.replace(/\s+Series$/i, "");
  return /chairs?$/i.test(base) ? base : `${base} Chairs`;
};

const chairSeries = CATEGORIES.find((c) => c.slug === "office-chairs");

const CHAIR_SERIES_LINKS: FooterLink[] = [
  ...(chairSeries?.subcategories ?? []).map((series) => ({
    label: seriesLabel(series),
    href: plp("office-chairs", series),
  })),
  { label: "All office chairs", href: plp("office-chairs") },
];

/**
 * Deep links to individual product pages.
 *
 * Derived from PRODUCTS, never hand-listed — see the third trap above. Every
 * slug here therefore has a real PDP by construction, and the list grows on
 * its own as records are promoted from `constants/chairs.ts` into PRODUCTS.
 *
 * Photographed models sort first, the same ordering `productsByCategory` uses,
 * so the strongest pages get the internal links. Capped at eight: past that
 * the run wraps to a fourth line and the column stops scanning.
 *
 * Deliberately titled "Featured models" and not "Bestsellers" — nothing in
 * this codebase carries sales data, and a bestseller claim is a factual claim
 * about the business.
 */
const FEATURED_MODEL_LINKS: FooterLink[] = PRODUCTS.slice()
  .sort(
    (a, b) =>
      Number(Boolean(PRODUCT_IMAGES[b.slug])) -
      Number(Boolean(PRODUCT_IMAGES[a.slug]))
  )
  .slice(0, 8)
  .map((p) => ({ label: p.name, href: `/products/${p.slug}` }));

/** The seven categories that are not office chairs, at category level. */
const OTHER_CATEGORY_LINKS: FooterLink[] = CATEGORIES.filter(
  (c) => c.slug !== "office-chairs"
).map((c) => ({ label: c.name, href: plp(c.slug) }));

/**
 * Sort views. These are real query params read by `ProductsView` — each one
 * is a genuinely different page for a shopper who arrives with a different
 * question ("what's cheapest", "what's new", "what's discounted").
 */
const BROWSE_LINKS: FooterLink[] = [
  { label: "All categories", href: "/categories" },
  { label: "Biggest discounts", href: "/categories?sort=discount" },
  { label: "New arrivals", href: "/categories?sort=newest" },
  { label: "Most reviewed", href: "/categories?sort=popular" },
  { label: "Price: low to high", href: "/categories?sort=price-asc" },
  { label: "Ergonomic Advisor", href: "/advisor" },
];

/**
 * Workspace zones, reused from the homepage rail so the two never drift.
 *
 * ⚠ Note "Meeting Room" points at `office-tables&sub=Conference Table Series`
 * and will render an empty grid until the tables catalogue carries real
 * series data — see rule 2 at the top. Fixing it in `ZONE_TILES` fixes it
 * here and on the homepage at once.
 */
const ZONE_LINKS: FooterLink[] = ZONE_TILES.map((z) => ({
  label: z.label,
  href: z.href,
}));

/**
 * Experience centres are deliberately NOT listed here.
 *
 * <FooterAddresses /> renders the four centres as full cards immediately
 * below this block, so a row of city links would print Chennai, Coimbatore,
 * Bengaluru and Hyderabad twice within one screen. If the addresses ever move
 * back above the cloud, a `STORES.map(...)` row of Maps links belongs in
 * column three's second slot — that is how Wakefit lists retail cities, and
 * it works when the two are separated.
 */

/**
 * ⚠ PLACEHOLDER TRUST CLAIMS — VERIFY BEFORE LAUNCH.
 *
 * The certification lines below are drawn from `AWARDS` in constants/home.ts,
 * which is itself marked placeholder. An awards rail overstating a citation
 * is embarrassing; a footer trust badge overstating a certification is a
 * consumer-protection problem. Every line here needs a certificate number on
 * file, or it comes out.
 */
const CERTIFICATION_LINKS: FooterLink[] = [
  { label: "BIFMA X5.1 tested seating" },
  { label: "ISO 9001:2015 — Chennai plant" },
  { label: "GREENGUARD Gold materials" },
];

/**
 * Purchase-side assurances, split out from the certifications above because
 * they answer a different question. A certification is about how the chair
 * was made; these are about what happens after the card is charged, and a
 * shopper hesitating at checkout is asking the second one.
 *
 * Payment marks are NOT listed here — they render as logo tiles via
 * <PaymentMarks />, below the grid. See constants/payments.ts.
 */
const CONFIDENCE_LINKS: FooterLink[] = [
  { label: "1-year warranty on frames & mechanisms" },
  { label: "Free installation, 38 cities" },
  { label: "Free delivery above ₹15,000" },
  { label: "SSL-secured checkout" },
];

export const FOOTER_LINK_COLUMNS: FooterLinkColumn[] = [
  {
    title: "Office chairs",
    sets: [
      { heading: "Shop by series", links: CHAIR_SERIES_LINKS },
      { heading: "Featured models", links: FEATURED_MODEL_LINKS },
    ],
  },
  {
    title: "The rest of the range",
    sets: [
      { heading: "Desks, storage & soft seating", links: OTHER_CATEGORY_LINKS },
      { heading: "Browse by", links: BROWSE_LINKS },
    ],
  },
  {
    title: "Shop by workspace",
    sets: [{ heading: "Set up a space", links: ZONE_LINKS }],
  },
  {
    title: "Why buy from us",
    sets: [
      { heading: "Tested & certified", links: CERTIFICATION_LINKS },
      { heading: "Every order includes", links: CONFIDENCE_LINKS },
    ],
  },
];
