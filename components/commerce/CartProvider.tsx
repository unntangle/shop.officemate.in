"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import type { CartLine, CartTotals, Coupon, Product } from "@/types";
import { calculateTotals, makeLineId } from "@/lib/commerce";
import { PRODUCT_IMAGES } from "@/constants/products";

const STORAGE_KEY = "officemate.cart.v1";
const WISHLIST_KEY = "officemate.wishlist.v1";

/* -------------------------------------------------------------------------
   Reducer

   Kept as a pure reducer rather than a pile of useState setters so the cart
   has a single, auditable set of transitions. Persistence and the drawer are
   layered on top; neither can mutate a line behind the reducer's back.
------------------------------------------------------------------------- */

type Action =
  | { type: "hydrate"; lines: CartLine[] }
  | { type: "add"; line: CartLine }
  | { type: "setQty"; lineId: string; qty: number }
  | { type: "remove"; lineId: string }
  | { type: "clear" };

function reducer(state: CartLine[], action: Action): CartLine[] {
  switch (action.type) {
    case "hydrate":
      return action.lines;

    case "add": {
      const existing = state.find((l) => l.lineId === action.line.lineId);

      /* Adding a product already in the cart increments rather than duplicates.
         Capped at 10 — an order larger than that is a bulk enquiry, and the
         bulk flow gives the buyer better pricing than the retail path would. */
      if (existing) {
        return state.map((l) =>
          l.lineId === action.line.lineId
            ? { ...l, qty: Math.min(10, l.qty + action.line.qty) }
            : l
        );
      }
      return [...state, action.line];
    }

    case "setQty":
      /* Zero quantity is a removal. Letting a 0-qty line linger produces the
         confusing state where the cart looks non-empty but totals nothing. */
      if (action.qty <= 0) {
        return state.filter((l) => l.lineId !== action.lineId);
      }
      return state.map((l) =>
        l.lineId === action.lineId ? { ...l, qty: Math.min(10, action.qty) } : l
      );

    case "remove":
      return state.filter((l) => l.lineId !== action.lineId);

    case "clear":
      return [];
  }
}

interface CartContextValue {
  lines: CartLine[];
  totals: CartTotals;
  coupon: Coupon | null;
  /** False until localStorage has been read, so the badge doesn't flash 0. */
  ready: boolean;
  drawerOpen: boolean;
  addItem: (product: Product, opts?: { color?: string; qty?: number }) => void;
  setQty: (lineId: string, qty: number) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
  applyCoupon: (coupon: Coupon | null) => void;
  openDrawer: () => void;
  closeDrawer: () => void;

  /* Wishlist rides along in the same provider. It shares the cart's storage
     lifecycle and every surface that shows a heart also shows a cart button,
     so a second provider would only add a wrapper without adding isolation. */
  wishlist: string[];
  toggleWishlist: (slug: string) => void;
  isWishlisted: (slug: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, []);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* Hydrate once on mount. This has to happen in an effect rather than in the
     reducer's initialiser: localStorage doesn't exist during the server render,
     and reading it at init would throw during SSR and mismatch on hydration. */
  useEffect(() => {
    try {
      const rawCart = window.localStorage.getItem(STORAGE_KEY);
      if (rawCart) {
        const parsed = JSON.parse(rawCart);
        if (Array.isArray(parsed)) dispatch({ type: "hydrate", lines: parsed });
      }

      const rawWishlist = window.localStorage.getItem(WISHLIST_KEY);
      if (rawWishlist) {
        const parsed = JSON.parse(rawWishlist);
        if (Array.isArray(parsed)) setWishlist(parsed);
      }
    } catch {
      /* Corrupt or blocked storage shouldn't take the storefront down — an
         empty cart is a recoverable state, a crashed layout is not. */
    }
    setReady(true);
  }, []);

  /* Persist. Guarded on `ready` so the initial empty state can't overwrite a
     saved cart before hydration has had a chance to run. */
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* Quota or private mode — the in-memory cart still works this session. */
    }
  }, [lines, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    } catch {
      /* See above. */
    }
  }, [wishlist, ready]);

  /* Lock the page behind the drawer. Without this the body scrolls under an
     open panel on iOS and the shopper loses their place in the grid. */
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const addItem = useCallback(
    (product: Product, opts?: { color?: string; qty?: number }) => {
      const colorName = opts?.color ?? product.colors[0]?.name ?? "Default";
      const colorHex =
        product.colors.find((c) => c.name === colorName)?.hex ?? product.swatch;

      dispatch({
        type: "add",
        line: {
          lineId: makeLineId(product.slug, colorName),
          slug: product.slug,
          name: product.name,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          color: colorName,
          colorHex,
          image: PRODUCT_IMAGES[product.slug],
          category: product.category,
          qty: opts?.qty ?? 1,
          addedAt: Date.now(),
        },
      });

      setDrawerOpen(true);
    },
    []
  );

  const setQty = useCallback(
    (lineId: string, qty: number) => dispatch({ type: "setQty", lineId, qty }),
    []
  );

  const removeItem = useCallback(
    (lineId: string) => dispatch({ type: "remove", lineId }),
    []
  );

  const clearCart = useCallback(() => {
    dispatch({ type: "clear" });
    setCoupon(null);
  }, []);

  const toggleWishlist = useCallback((slug: string) => {
    setWishlist((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  const isWishlisted = useCallback(
    (slug: string) => wishlist.includes(slug),
    [wishlist]
  );

  /* Drop a coupon the basket no longer qualifies for. Leaving a stale code
     applied would show a discount in the summary the order isn't entitled to,
     which is worse than quietly removing it. */
  useEffect(() => {
    if (!coupon) return;
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    if (subtotal === 0 || (coupon.minSubtotal && subtotal < coupon.minSubtotal)) {
      setCoupon(null);
    }
  }, [lines, coupon]);

  const totals = useMemo(() => calculateTotals(lines, coupon), [lines, coupon]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      totals,
      coupon,
      ready,
      drawerOpen,
      addItem,
      setQty,
      removeItem,
      clearCart,
      applyCoupon: setCoupon,
      openDrawer,
      closeDrawer,
      wishlist,
      toggleWishlist,
      isWishlisted,
    }),
    [
      lines,
      totals,
      coupon,
      ready,
      drawerOpen,
      addItem,
      setQty,
      removeItem,
      clearCart,
      openDrawer,
      closeDrawer,
      wishlist,
      toggleWishlist,
      isWishlisted,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
