import type { CategorySlug, Product } from "@/types";
import { CATEGORIES } from "@/constants/categories";
import { PRODUCTS, PRODUCT_IMAGES } from "@/constants/products";

/* =========================================================================
   CATALOGUE RESOLUTION

   This module used to reconcile two product sources: 45 name-only models in
   constants/chairs.ts and a handful of richly-specified records here. A model
   with no price cannot appear on a listing page, so this file invented one —
   SERIES_PRICING, a set of plausible market bands flagged
   `pricingIsEstimated: true` and rendered as "Price on request".

   ALL OF THAT IS GONE. The mock models were deleted; the catalogue is now the
   five real products in constants/products.ts, every one with a real price,
   real photography and a real detail page. Nothing here is invented any more,
   which is why SERIES_PRICING, FALLBACK_PRICING and the resolve() merge have
   all been removed rather than left behind "just in case".

   `pricingIsEstimated` SURVIVES ON THE TYPE and is always false. It is read
   by the header mega-menu, the listing sort and the product card, and it is
   the hook Shopify will need for genuinely quote-only products — the ones
   with no online price that route to an enquiry instead. Deleting the field
   would mean re-adding it in a fortnight.

   ⚠ WHEN SHOPIFY LANDS, THIS IS THE SEAM. `ShopItem` is the shape the whole
   storefront reads; swap the body of CATALOG for a Storefront API query that
   returns the same shape and nothing above this file needs to change. Keep
   product access flowing through here rather than importing PRODUCTS
   directly, or that promise stops being true.
========================================================================= */

/**
 * A catalogue entry as the storefront needs it: always priced, always
 * displayable, and honest about which of those two things is real.
 */
export interface ShopItem {
  name: string;
  slug: string;
  category: CategorySlug;
  subcategory: string;
  /** The hero shot. */
  image?: string;
  /**
   * Every photo, in display order, hero first.
   *
   * Carried on the item rather than looked up by slug, because the source
   * differs: Shopify products bring their own media, local ones come from
   * `galleryFor`. Components that reached for `galleryFor(slug)` themselves
   * kept showing local photography for a product whose images had already
   * moved to Shopify — the lookup succeeded, so nothing looked wrong.
   */
  images?: string[];
  price: number;
  compareAtPrice?: number;
  rating?: number;
  reviewCount?: number;
  /**
   * True when the price is not a real one and must not be printed.
   *
   * Always false today. Kept for quote-only products — see the note above.
   */
  pricingIsEstimated: boolean;
  /** The full record. Always present now that PRODUCTS is the only source. */
  product?: Product;
}

/**
 * The full storefront catalogue.
 *
 * `subcategory` falls back to "Featured" only if a product is authored
 * without one. That is a bucket, not a series — it will show up in the rail
 * as a circle named "Featured", which is the visible signal that a product is
 * missing its `subcategory`. See the field note in types/index.ts.
 */
export const CATALOG: ShopItem[] = PRODUCTS.map((product) => ({
  name: product.name,
  slug: product.slug,
  category: product.category,
  subcategory: product.subcategory ?? "Featured",
  image: PRODUCT_IMAGES[product.slug],
  price: product.price,
  compareAtPrice: product.compareAtPrice,
  rating: product.rating,
  reviewCount: product.reviewCount,
  pricingIsEstimated: false,
  product,
}));

export const getItem = (slug: string) => CATALOG.find((i) => i.slug === slug);

/** Categories that actually contain stock, for building filter UI. */
export const populatedCategories = (): CategorySlug[] =>
  Array.from(new Set(CATALOG.map((i) => i.category)));

/**
 * Series within a category.
 *
 * READ FROM THE TAXONOMY, NOT FROM STOCK. This used to derive the list from
 * whatever series happened to appear in CATALOG, which was fine when 45 mock
 * models covered every one — and useless now that five products cover two.
 * Deriving it today would collapse the Office Chairs rail from six series to
 * two and empty every other category's filter entirely.
 *
 * The taxonomy is the real structure of the range and does not depend on what
 * is currently entered, so a series with no stock still appears and lands on
 * an empty grid with a clear message. That is the honest result: the series
 * exists, we have not listed it yet.
 */
export const seriesIn = (category: CategorySlug | "all"): string[] => {
  if (category === "all") {
    return Array.from(
      new Set(CATEGORIES.flatMap((c) => c.subcategories ?? []))
    );
  }
  return CATEGORIES.find((c) => c.slug === category)?.subcategories ?? [];
};

/** Price bounds across the catalogue, for the range filter. */
export const priceBounds = (): [number, number] => {
  const prices = CATALOG.map((i) => i.price);
  /* Guard the empty case: Math.min() of nothing is Infinity, which would
     render as a broken filter rather than an empty one. */
  if (prices.length === 0) return [0, 0];
  return [Math.min(...prices), Math.max(...prices)];
};
