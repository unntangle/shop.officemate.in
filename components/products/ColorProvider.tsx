"use client";

import { createContext, useContext, useState } from "react";

type ProductColor = { name: string; hex: string };

type ColorContextValue = {
  colors: ProductColor[];
  active: ProductColor;
  setActive: (c: ProductColor) => void;
};

/* Undefined default so useProductColor can tell "no provider" apart from
   "provider with no colours" and fail loudly rather than silently. */
const ColorContext = createContext<ColorContextValue | undefined>(undefined);

/**
 * Stand-in for a product with no colourways.
 *
 * ⚠ THE REASON THIS EXISTS: `useState(colors[0])` on an empty array gives
 * `undefined`, and every consumer reads `active.name` or `active.hex`
 * unguarded — so a product with no colour option crashed the whole detail
 * page with "Cannot read properties of undefined". That is not a rare edge
 * case: it is EVERY product created in Shopify without a Color option, which
 * is the default state of a new product.
 *
 * Fixing it here rather than in each consumer means the contract holds —
 * `active` is always a real colour — and no future component has to remember
 * to defend against it.
 *
 * The name is what a cart line will carry for such a product, and it matches
 * what Shopify calls a variant with no options.
 */
const DEFAULT_COLOR: ProductColor = { name: "Default", hex: "#2B2B2E" };

/**
 * Holds the selected colourway for a product detail page.
 *
 * This is a client component, but `children` are passed through untouched —
 * so the server-rendered product page keeps its layout and stays a server
 * component. Only the leaves that actually need the state (ColorPicker,
 * ProductGallery) call useProductColor().
 */
export function ColorProvider({
  colors,
  children,
}: {
  colors: ProductColor[];
  children: React.ReactNode;
}) {
  const [active, setActive] = useState<ProductColor>(
    colors[0] ?? DEFAULT_COLOR
  );

  return (
    <ColorContext.Provider value={{ colors, active, setActive }}>
      {children}
    </ColorContext.Provider>
  );
}

export function useProductColor() {
  const ctx = useContext(ColorContext);
  if (!ctx) {
    throw new Error("useProductColor must be used inside a <ColorProvider>");
  }
  return ctx;
}
