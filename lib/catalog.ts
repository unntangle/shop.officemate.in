import type { CategorySlug, Product } from "@/types";
import { CHAIR_MODELS, type ChairModel } from "@/constants/chairs";
import { PRODUCTS, PRODUCT_IMAGES } from "@/constants/products";

/* =========================================================================
   CATALOGUE RESOLUTION

   The project carries two product sources that were never reconciled:

     constants/chairs.ts    44 real Officemate models — name, series, image.
                            NO price, NO rating, NO specs.
     constants/products.ts   9 richly-specified demo products WITH pricing.

   A showcase site could live with that, because nothing was for sale. A
   storefront cannot: a product listing page without a price is not a listing
   page. This module is the seam that makes the real catalogue shoppable.

   Resolution order for any model:
     1. A matching entry in PRODUCTS  → real price, rating, specs, colours.
     2. SERIES_PRICING below          → PLACEHOLDER band by series.

   ⚠️  SERIES_PRICING IS PLACEHOLDER DATA. ⚠️
   These are plausible market-rate bands for Indian office seating, invented
   for this build. They are NOT Officemate's prices. Every model priced this
   way is flagged `pricingIsEstimated: true`, and the UI renders those with a
   "Price on request" treatment rather than a hard number, so nothing false is
   ever shown to a shopper.

   To go live: replace SERIES_PRICING with real per-model pricing, or better,
   add `price` / `compareAtPrice` to each entry in constants/chairs.ts and
   delete the fallback entirely.
========================================================================= */

/** PLACEHOLDER price bands by series. See the warning above. */
const SERIES_PRICING: Record<string, { price: number; mrp: number }> = {
  "Executive Series": { price: 24999, mrp: 32999 },
  "Leather Series": { price: 34999, mrp: 44999 },
  "Leatherette Series": { price: 18999, mrp: 24999 },
  "Task Series": { price: 12999, mrp: 17499 },
  "Training Series": { price: 9499, mrp: 12999 },
  "Cafe Chairs Series": { price: 6999, mrp: 9499 },
};

const FALLBACK_PRICING = { price: 11999, mrp: 15999 };

/**
 * A catalogue entry as the storefront needs it: always priced, always
 * displayable, and honest about which of those two things is real.
 */
export interface ShopItem {
  name: string;
  slug: string;
  category: CategorySlug;
  subcategory: string;
  image?: string;
  price: number;
  compareAtPrice?: number;
  rating?: number;
  reviewCount?: number;
  /** True when price came from SERIES_PRICING rather than real data. */
  pricingIsEstimated: boolean;
  /** The full record, when this model exists in PRODUCTS. */
  product?: Product;
}

/** Fold a raw model and its optional rich record into one shoppable entry. */
function resolve(model: ChairModel): ShopItem {
  const product = PRODUCTS.find((p) => p.slug === model.slug);

  if (product) {
    return {
      name: product.name,
      slug: product.slug,
      category: product.category,
      subcategory: model.subcategory,
      image: PRODUCT_IMAGES[product.slug] ?? model.image,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      rating: product.rating,
      reviewCount: product.reviewCount,
      pricingIsEstimated: false,
      product,
    };
  }

  const band = SERIES_PRICING[model.subcategory] ?? FALLBACK_PRICING;

  return {
    name: model.name,
    slug: model.slug,
    category: model.category,
    subcategory: model.subcategory,
    image: model.image,
    price: band.price,
    compareAtPrice: band.mrp,
    pricingIsEstimated: true,
  };
}

/**
 * The full storefront catalogue.
 *
 * Built from CHAIR_MODELS, then extended with any PRODUCTS entry that has no
 * corresponding model — the desks and standing tables live only in PRODUCTS,
 * and dropping them would quietly remove a whole category from the shop.
 */
export const CATALOG: ShopItem[] = (() => {
  const fromModels = CHAIR_MODELS.map(resolve);
  const seen = new Set(fromModels.map((i) => i.slug));

  const orphans: ShopItem[] = PRODUCTS.filter((p) => !seen.has(p.slug)).map(
    (product) => ({
      name: product.name,
      slug: product.slug,
      category: product.category,
      /* These have no series in the real catalogue; group them by category
         name so the series filter still has something coherent to show. */
      subcategory: "Featured",
      image: PRODUCT_IMAGES[product.slug],
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      rating: product.rating,
      reviewCount: product.reviewCount,
      pricingIsEstimated: false,
      product,
    })
  );

  return [...fromModels, ...orphans];
})();

/** Count of models whose price is invented. Surfaced in dev to keep it visible. */
export const ESTIMATED_PRICING_COUNT = CATALOG.filter(
  (i) => i.pricingIsEstimated
).length;

if (process.env.NODE_ENV === "development" && ESTIMATED_PRICING_COUNT > 0) {
  console.warn(
    `[catalog] ${ESTIMATED_PRICING_COUNT} of ${CATALOG.length} models are using ` +
      `PLACEHOLDER pricing from lib/catalog.ts → SERIES_PRICING. ` +
      `Replace with real prices before launch.`
  );
}

export const getItem = (slug: string) => CATALOG.find((i) => i.slug === slug);

/** Categories that actually contain stock, for building filter UI. */
export const populatedCategories = (): CategorySlug[] =>
  Array.from(new Set(CATALOG.map((i) => i.category)));

/** Series present within a category. */
export const seriesIn = (category: CategorySlug | "all"): string[] =>
  Array.from(
    new Set(
      CATALOG.filter((i) => category === "all" || i.category === category).map(
        (i) => i.subcategory
      )
    )
  );

/** Price bounds across the catalogue, for the range filter. */
export const priceBounds = (): [number, number] => {
  const prices = CATALOG.map((i) => i.price);
  return [Math.min(...prices), Math.max(...prices)];
};
