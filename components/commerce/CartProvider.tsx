"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CartLine, CartTotals, Coupon, Product } from "@/types";
import { useCatalog } from "@/components/commerce/CatalogProvider";
import {
  addToCart,
  addManyToCart,
  applyDiscountCode,
  clearCart as clearShopifyCart,
  getCart,
  removeCartLine,
  updateCartLine,
  type ShopifyCart,
} from "@/lib/shopify/cart";

/**
 * The cart.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * SHOPIFY OWNS THIS NOW. The lines, quantities, prices and totals all live on
 * Shopify's servers and arrive fresh from every mutation. The only thing this
 * browser keeps is a cart ID, in an httpOnly cookie set by the server actions
 * in lib/shopify/cart.ts.
 *
 * It used to be a local reducer over `localStorage`, which worked and could
 * never take money: only a Shopify cart yields a `checkoutUrl`, and that URL
 * is the entire payment, tax and PCI story. There is no API that accepts a
 * locally-assembled basket and charges for it.
 *
 * Two classes of bug disappear with it. Prices are recalculated by Shopify on
 * every mutation, so an edited `localStorage` price cannot produce a cheap
 * order. And stock is checked server-side, so a sold-out variant fails at the
 * point of adding rather than at the point of paying.
 *
 * THE WISHLIST STAYS LOCAL, deliberately. It is not an order, Shopify has no
 * concept of it, and it should survive with no account and no network. It
 * keeps its own storage key and its own lifecycle.
 * ─────────────────────────────────────────────────────────────────────────
 */

const WISHLIST_KEY = "officemate.wishlist.v1";

/** The pre-Shopify cart. Read once, migrated, then deleted. See `migrate`. */
const LEGACY_CART_KEY = "officemate.cart.v1";

interface CartContextValue {
  lines: CartLine[];
  totals: CartTotals;
  coupon: Coupon | null;
  /** False until the first Shopify read returns, so the badge doesn't flash. */
  ready: boolean;
  /** True while a mutation is in flight — buttons should disable, not vanish. */
  busy: boolean;
  /** Shopify's hosted checkout. Null until the cart has something in it. */
  checkoutUrl: string | null;
  drawerOpen: boolean;
  addItem: (product: Product, opts?: { color?: string; qty?: number }) => void;
  setQty: (lineId: string, qty: number) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
  applyCoupon: (coupon: Coupon | null) => void;
  openDrawer: () => void;
  closeDrawer: () => void;

  wishlist: string[];
  toggleWishlist: (slug: string) => void;
  isWishlisted: (slug: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

const EMPTY_TOTALS: CartTotals = {
  subtotal: 0,
  savings: 0,
  shipping: 0,
  couponDiscount: 0,
  total: 0,
  itemCount: 0,
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const catalog = useCatalog();

  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* Guards the one-shot migration below against React 18 Strict Mode, which
     runs effects twice in development — without it a legacy basket would be
     added to the Shopify cart twice and every quantity would double. */
  const migrated = useRef(false);

  /**
   * Resolve a saved line to a Shopify variant.
   *
   * Matched on HANDLE plus COLOUR NAME, which is all the old format stored.
   * Returns undefined when the product is not in Shopify yet, or when the
   * colourway has been renamed — both are ordinary outcomes, not errors, and
   * the caller drops the line rather than guessing at a substitute. Adding
   * the wrong colour to someone's basket is worse than losing the line.
   */
  const resolveVariant = useCallback(
    (slug: string, color: string) => {
      const item = catalog.find((i) => i.slug === slug);
      return item?.product?.variants?.find(
        (v) => v.color.toLowerCase() === color.toLowerCase()
      );
    },
    [catalog]
  );

  /* ---------------------------------------------------------- first load */

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const existing = await getCart();
        if (!cancelled && existing) setCart(existing);

        /* One-off migration of a pre-Shopify basket.

           Only runs when there is no Shopify cart already: someone who has
           shopped since the migration has a real cart, and replaying stale
           localStorage lines into it would resurrect items they removed. */
        if (!migrated.current && !existing) {
          migrated.current = true;
          await migrateLegacyCart();
        }
      } catch {
        /* A cart that cannot be read is an empty cart, not a broken page. */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    try {
      const raw = window.localStorage.getItem(WISHLIST_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setWishlist(parsed);
      }
    } catch {
      /* Private mode or corrupt value. An empty wishlist is recoverable. */
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Rebuild a localStorage basket as a Shopify cart, then delete it.
   *
   * Lines that cannot be resolved are DROPPED SILENTLY rather than reported.
   * Most unresolvable lines are products not yet entered in Shopify, and a
   * banner reading "2 items were removed" invites someone to go looking for a
   * fault that is really just an unfinished catalogue.
   *
   * Runs at most once. The key is removed whether or not anything matched, so
   * a basket of entirely unavailable products cannot retry on every load.
   */
  async function migrateLegacyCart() {
    let saved: unknown;
    try {
      const raw = window.localStorage.getItem(LEGACY_CART_KEY);
      if (!raw) return;
      saved = JSON.parse(raw);
    } catch {
      window.localStorage.removeItem(LEGACY_CART_KEY);
      return;
    }

    window.localStorage.removeItem(LEGACY_CART_KEY);
    if (!Array.isArray(saved) || saved.length === 0) return;

    const items = saved
      .map((line: Partial<CartLine>) => {
        if (!line?.slug || !line?.color) return null;
        const variant = resolveVariant(line.slug, line.color);
        if (!variant || !variant.available) return null;
        return {
          variantId: variant.id,
          quantity: Math.min(10, Math.max(1, line.qty ?? 1)),
        };
      })
      .filter((i): i is { variantId: string; quantity: number } => i !== null);

    if (items.length === 0) return;

    try {
      const next = await addManyToCart(items);
      if (next) setCart(next);
    } catch {
      /* The basket is already cleared locally. Failing to restore it is a
         worse outcome than losing it, but not one worth blocking load for. */
    }
  }

  /* ------------------------------------------------------------- wishlist */

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    } catch {
      /* Quota or private mode — in-memory still works this session. */
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

  /* ------------------------------------------------------------- mutations */

  /**
   * Every mutation goes through here.
   *
   * `busy` is set for the duration so buttons can disable rather than let a
   * shopper queue three conflicting quantity changes against a cart that
   * answers out of order. The returned cart REPLACES local state wholesale —
   * Shopify is authoritative, and merging its answer with a local guess is
   * how the two drift apart.
   */
  const run = useCallback(
    async (op: () => Promise<ShopifyCart | null>) => {
      setBusy(true);
      try {
        const next = await op();
        if (next) setCart(next);
        return next;
      } catch (err) {
        console.error("[cart] mutation failed", err);
        return null;
      } finally {
        setBusy(false);
      }
    },
    []
  );

  const addItem = useCallback(
    (product: Product, opts?: { color?: string; qty?: number }) => {
      const colorName = opts?.color ?? product.colors[0]?.name;
      const variant =
        product.variants?.find(
          (v) => v.color.toLowerCase() === (colorName ?? "").toLowerCase()
        ) ?? product.variants?.[0];

      /* No variant means no Shopify record behind this product — it came from
         the local catalogue. It genuinely cannot be bought, so opening the
         drawer on an unchanged cart would be a lie. AddToCartButton disables
         itself in this case; this is the backstop. */
      if (!variant) {
        console.warn(
          `[cart] "${product.slug}" has no Shopify variant and cannot be added. ` +
            `Enter it in Shopify, or the button should be disabled.`
        );
        return;
      }

      setDrawerOpen(true);
      void run(() => addToCart(variant.id, opts?.qty ?? 1));
    },
    [run]
  );

  const setQty = useCallback(
    (lineId: string, qty: number) => {
      void run(() => updateCartLine(lineId, Math.min(10, qty)));
    },
    [run]
  );

  const removeItem = useCallback(
    (lineId: string) => {
      void run(() => removeCartLine(lineId));
    },
    [run]
  );

  const clearCart = useCallback(() => {
    setCoupon(null);
    void run(() => clearShopifyCart());
  }, [run]);

  /**
   * Discount codes.
   *
   * The local COUPONS array in lib/commerce.ts is now display only — Shopify
   * decides what is valid, what it is worth and whether the basket qualifies.
   * A code it rejects comes back with `applicable: false` rather than as an
   * error, so the local state is cleared on that flag and the shopper is not
   * shown a discount the order will not receive.
   */
  const applyCoupon = useCallback(
    (next: Coupon | null) => {
      setCoupon(next);
      void run(async () => {
        const updated = await applyDiscountCode(next?.code ?? null);
        if (
          next &&
          updated &&
          !updated.discountCodes.some((d) => d.code === next.code && d.applicable)
        ) {
          setCoupon(null);
        }
        return updated;
      });
    },
    [run]
  );

  const toggleWishlist = useCallback((slug: string) => {
    setWishlist((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  const isWishlisted = useCallback(
    (slug: string) => wishlist.includes(slug),
    [wishlist]
  );

  /* ---------------------------------------------------------- derived view */

  /**
   * Shopify's lines, in the `CartLine` shape the UI already reads.
   *
   * Mapped rather than passed through so CartDrawer, the cart page and
   * OrderSummary keep working untouched. Two fields have to come from the
   * catalogue because Shopify's cart does not carry them: the colour SWATCH
   * (the API returns "Graphite", not a hex) and the CATEGORY.
   *
   * `lineId` is Shopify's cart-line ID, NOT the old `slug::colour` string.
   * That is what `cartLinesUpdate` and `cartLinesRemove` take, and it is why
   * the quantity stepper and the bin icon keep working without changes.
   */
  const lines = useMemo<CartLine[]>(() => {
    if (!cart) return [];

    return cart.lines.map((l) => {
      const item = catalog.find((i) => i.slug === l.handle);
      const hex =
        item?.product?.colors.find((c) => c.name === l.color)?.hex ??
        item?.product?.swatch ??
        "#C9CCD1";

      return {
        lineId: l.id,
        variantId: l.variantId,
        slug: l.handle,
        name: l.name,
        price: l.price,
        compareAtPrice: l.compareAtPrice,
        color: l.color,
        colorHex: hex,
        image: l.image ?? item?.image,
        category: item?.category ?? "office-chairs",
        qty: l.quantity,
        addedAt: 0,
      };
    });
  }, [cart, catalog]);

  /**
   * Totals, from Shopify.
   *
   * `shipping` is always 0 here and that is not a claim of free delivery —
   * Shopify cannot rate shipping until it has an address, which it collects
   * at checkout. Every surface already says "Delivery calculated at
   * checkout"; this keeps that honest rather than printing a number we made
   * up.
   *
   * `savings` is still computed locally because it is presentational: the sum
   * of MRP minus price across the lines. `couponDiscount` is the gap between
   * what the lines cost and what Shopify says the subtotal is, which is where
   * an applied code shows up.
   */
  const totals = useMemo<CartTotals>(() => {
    if (!cart) return EMPTY_TOTALS;

    const gross = cart.lines.reduce((s, l) => s + l.price * l.quantity, 0);
    const savings = cart.lines.reduce(
      (s, l) =>
        s + (l.compareAtPrice ? (l.compareAtPrice - l.price) * l.quantity : 0),
      0
    );

    return {
      subtotal: gross,
      savings,
      shipping: 0,
      couponDiscount: Math.max(0, gross - cart.subtotal),
      total: cart.total,
      itemCount: cart.totalQuantity,
    };
  }, [cart]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      totals,
      coupon,
      ready,
      busy,
      checkoutUrl: cart?.checkoutUrl ?? null,
      drawerOpen,
      addItem,
      setQty,
      removeItem,
      clearCart,
      applyCoupon,
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
      busy,
      cart,
      drawerOpen,
      addItem,
      setQty,
      removeItem,
      clearCart,
      applyCoupon,
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
