import { CategoriesSkeleton } from "@/components/products/CategoriesSkeleton";

/**
 * Route-level loading UI for /categories.
 *
 * This file exists to OVERRIDE app/loading.tsx for this route. The root one
 * is a centred spinner inside a `min-h-[70vh]` box — a shape with nothing in
 * common with this page, so arriving here by clicking "All Categories" in the
 * header meant a spinner, then a full relayout as the real grid landed. Its
 * accent-red spinner also contradicted the charcoal-and-grey palette this
 * page now uses.
 *
 * Rendering the same skeleton the page's <Suspense> fallback uses makes the
 * two loading paths identical, so a client navigation and a hard reload look
 * the same and neither shifts.
 *
 * Note this is a SERVER component and must stay one: it takes no props and
 * reads nothing, which is why it can render the shared skeleton directly.
 */
export default function Loading() {
  return <CategoriesSkeleton />;
}
