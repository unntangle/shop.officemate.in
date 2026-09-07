import type { CategorySlug } from "@/types";

/**
 * ⚠ THE 45 MOCK CHAIR MODELS THAT LIVED HERE HAVE BEEN REMOVED.
 *
 * They were names and series scraped from officemate.in with no price, no
 * photography, no specs and no detail page — placeholders standing in for a
 * catalogue that had not been entered yet. `lib/catalog.ts` invented a price
 * band for each one so the storefront had something to render, which is a
 * reasonable thing to do for a demo and an unreasonable thing to ship.
 *
 * The real catalogue is now the five records in `constants/products.ts`, and
 * the rest is being built in Shopify.
 *
 * NOTHING WAS LOST WITH THEM. The category and series taxonomy those models
 * carried already lived — properly — in `constants/categories.ts`, on
 * `Category.subcategories`. That is now the single source for the series
 * shown in the header mega-menu, the circle rail on the listing page and the
 * filter drawer, so all nineteen series still appear even though only a
 * handful currently contain stock.
 *
 * THIS FILE IS KEPT ONLY FOR THE `ChairModel` TYPE, which
 * `components/products/ModelCard.tsx` still imports. Once that component is
 * confirmed unused, delete both. Do not repopulate the array — new products
 * belong in Shopify, and `lib/catalog.ts` is where they are read from.
 */
export interface ChairModel {
  name: string;
  slug: string;
  category: CategorySlug;
  subcategory: string;
  image?: string;
}

/** Intentionally empty. See the note above. */
export const CHAIR_MODELS: ChairModel[] = [];

/** Models within a subcategory, e.g. modelsIn("Task Series"). */
export const modelsIn = (subcategory: string) =>
  CHAIR_MODELS.filter((m) => m.subcategory === subcategory);

/** Models within a category, e.g. modelsFor("office-chairs"). */
export const modelsFor = (category: CategorySlug) =>
  CHAIR_MODELS.filter((m) => m.category === category);

/** How many models sit in a subcategory — used for menu counts. */
export const modelCount = (subcategory: string) => modelsIn(subcategory).length;
