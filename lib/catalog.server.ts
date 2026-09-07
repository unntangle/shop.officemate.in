import type { ShopItem } from "@/lib/catalog";
import { PRODUCTS, PRODUCT_IMAGES, galleryFor } from "@/constants/products";
import { shopifyConfigured, shopifyFetch, ShopifyError } from "@/lib/shopify/client";
import { ALL_PRODUCTS_QUERY } from "@/lib/shopify/queries";
import { toShopItem, type RawProduct } from "@/lib/shopify/mapper";

/**
 * The catalogue, loaded on the server.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THIS IS THE ONE FUNCTION SHOPIFY REPLACES.
 *
 * Everything above it — components, filters, cart, mega-menu — reads
 * `ShopItem`. Everything below it is where the data happens to come from.
 * Swap the body of this function for a Storefront API query that returns the
 * same shape and the storefront changes source without a single component
 * being touched. That is the entire point of the seam.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * WHY IT IS ASYNC WHEN IT DOES NOT YET AWAIT ANYTHING.
 *
 * `CATALOG` in lib/catalog.ts is a module-level const, built synchronously at
 * import time. That works only while the data is a local array. A network
 * call cannot be made at module scope in a client component, so every
 * `"use client"` file that imports `CATALOG` today would have to change the
 * day Shopify lands.
 *
 * Making the signature async NOW means those call sites are already awaiting
 * a promise, and the Shopify swap becomes a change inside this function
 * rather than a change to its callers. The alternative — going sync-to-async
 * at the same moment as local-to-remote — mixes two failure modes in one
 * step, and a breakage could be either.
 *
 * ⚠ SERVER ONLY. This must never be imported into a `"use client"` file.
 * Client components read the catalogue through CatalogProvider, which is
 * seeded from here in app/layout.tsx. When the Shopify token moves to a
 * server-only variable, importing this client-side would either leak it or
 * fail the build — better to keep the boundary now than to discover it then.
 */
export async function getCatalog(): Promise<ShopItem[]> {
  /* No credentials means no Shopify. The storefront must keep working on a
     fresh clone with no .env.local, and a missing variable in production
     should degrade to the previous behaviour rather than to an error page. */
  if (shopifyConfigured) {
    try {
      const data = await shopifyFetch<{
        products: {
          pageInfo: { hasNextPage: boolean };
          edges: { node: RawProduct }[];
        };
      }>(ALL_PRODUCTS_QUERY, { first: 250 });

      const items = data.products.edges.map((e) => toShopItem(e.node));

      /* 250 is the Storefront API's per-page ceiling and the response is
         valid when truncated — just short. Without this the symptom is
         "some products are missing", which is a miserable thing to debug. */
      if (data.products.pageInfo.hasNextPage) {
        console.warn(
          "[catalog] More than 250 products in Shopify. This query returns the " +
            "first page only — add cursor pagination in lib/shopify/queries.ts."
        );
      }

      /* An empty store is not an error, but silently rendering an empty shop
         is worse than falling back to what we have. During the migration the
         local catalogue is the better answer; delete this branch once Shopify
         is the real source. */
      if (items.length > 0) return items;

      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[catalog] Shopify returned no products — serving the local catalogue. " +
            "Run `npm run shopify:check` to confirm the store is populated."
        );
      }
    } catch (err) {
      /* A Shopify outage, an expired token or a revoked scope must not take
         the storefront down with it. Log loudly, serve what we have. */
      console.error(
        `[catalog] Shopify fetch failed, serving the local catalogue. ${
          err instanceof ShopifyError ? err.message : String(err)
        }`
      );
    }
  }

  /* Local data. When every product is in Shopify with its content, this block
     and the constants/products.ts import above are what gets deleted.

     The `subcategory` fallback to "Featured" is deliberate: a product with no
     series shows up in the rail as a circle named "Featured", which is the
     visible signal that its `subcategory` is missing. In Shopify terms that
     is a product with no Product type set. */
  return PRODUCTS.map((product) => ({
    name: product.name,
    slug: product.slug,
    category: product.category,
    subcategory: product.subcategory ?? "Featured",
    image: PRODUCT_IMAGES[product.slug],
    /* Resolved here rather than looked up per component. See the note on
       `ShopItem.images` — a component calling `galleryFor(slug)` itself will
       keep finding local photography even for a product Shopify now owns. */
    images: galleryFor(product.slug),
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    rating: product.rating,
    reviewCount: product.reviewCount,
    pricingIsEstimated: false,
    product,
  }));
}
