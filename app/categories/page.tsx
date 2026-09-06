import type { Metadata } from "next";
import { Suspense } from "react";
import { SITE } from "@/constants/site";
import { ProductsView } from "@/components/products/ProductsView";
import { CategoriesSkeleton } from "@/components/products/CategoriesSkeleton";

/**
 * The catalogue listing page.
 *
 * Lives at /categories, not /products. The route was renamed because this
 * screen is where a shopper browses BY CATEGORY — the drawer, the breadcrumb
 * and every header link that lands here are all category-shaped — while
 * /products/[slug] remains the individual product page. Splitting the two
 * names keeps "browse the range" and "look at one thing" as distinct URLs.
 *
 * ⚠ /products NO LONGER RESOLVES. There is deliberately no redirect: the old
 * URL 404s. If this site has ever been crawled or linked externally under
 * /products, add a permanent redirect in next.config.mjs before launch —
 * `redirects()` with `{ source: "/products", destination: "/categories",
 * permanent: true }` — or those links are lost along with their ranking.
 *
 * The page title and breadcrumb are rendered INSIDE ProductsView rather than
 * here. Both depend on `?category=` and `?sub=`, which the view rewrites via
 * `router.replace` on every filter change; rendering them at this level would
 * leave the heading a beat behind the grid it labels.
 *
 * The Suspense boundary is required, not stylistic: ProductsView calls
 * `useSearchParams`, and Next will not prerender a page containing that hook
 * unless it sits behind a boundary.
 *
 * THE WRAPPER DIVS SIT INSIDE THE BOUNDARY, not around it. `CategoriesSkeleton`
 * brings its own `py-8` and `container`, because app/categories/loading.tsx
 * renders it standalone with no wrapper of its own. Keeping the padding out
 * here means the skeleton is spaced identically whichever of the two loading
 * paths shows it — wrap it again and the streamed version would sit lower
 * than the navigated one.
 */
export const metadata: Metadata = {
  title: "Categories",
  description:
    "Explore the full Officemate range — ergonomic and office chairs, executive and gaming seating, standing desks and workspace accessories, all engineered around how the body moves.",
  alternates: { canonical: "/categories" },
  openGraph: {
    title: `Categories — ${SITE.name}`,
    description:
      "Ergonomic chairs, standing desks and accessories engineered around how the body moves.",
    url: `${SITE.url}/categories`,
  },
};

export default function CategoriesPage() {
  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <div className="py-8 md:py-10">
        <div className="container">
          <ProductsView />
        </div>
      </div>
    </Suspense>
  );
}
