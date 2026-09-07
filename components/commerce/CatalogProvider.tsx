"use client";

import { createContext, useContext } from "react";
import type { ShopItem } from "@/lib/catalog";

/**
 * The catalogue, for client components.
 *
 * WHY A PROVIDER RATHER THAN AN IMPORT.
 *
 * Navbar, SearchBar and ProductsView all need the full catalogue, and all
 * three are `"use client"`. Today they `import { CATALOG }` — a module-level
 * array evaluated at import time. That is fine for a local constant and
 * impossible for a network call: a client component cannot await a fetch at
 * module scope, and the Shopify token has no business in a client bundle
 * anyway.
 *
 * So the catalogue is fetched once on the server in app/layout.tsx and passed
 * down through this context. The components read a hook instead of an import,
 * and the day the source changes they do not.
 *
 * ONE FETCH, NOT ONE PER COMPONENT. The layout wraps every page, so the
 * catalogue is loaded a single time per request and shared by the header, the
 * search panel and the listing grid. Three separate `getCatalog()` calls
 * would become three Storefront API round trips for identical data.
 *
 * IT IS DELIBERATELY NOT STATE. Nothing mutates the catalogue in the browser
 * — filtering and searching derive from it and never write to it — so there
 * is no setter and no `useState`. A context holding a stable array costs
 * nothing to read and cannot be accidentally desynchronised.
 */
const CatalogContext = createContext<ShopItem[] | null>(null);

export function CatalogProvider({
  items,
  children,
}: {
  items: ShopItem[];
  children: React.ReactNode;
}) {
  /* No memo: `items` arrives from a server component as a stable prop for the
     lifetime of the render, so wrapping it would add a hook and change
     nothing. */
  return (
    <CatalogContext.Provider value={items}>{children}</CatalogContext.Provider>
  );
}

/**
 * The full catalogue.
 *
 * Throws rather than returning `[]` when the provider is missing. An empty
 * catalogue is indistinguishable from a store with no products, so a silent
 * fallback would surface as "the search finds nothing" three screens away
 * from the actual mistake.
 */
export function useCatalog(): ShopItem[] {
  const ctx = useContext(CatalogContext);
  if (ctx === null)
    throw new Error("useCatalog must be used inside <CatalogProvider>");
  return ctx;
}
