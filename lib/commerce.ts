import type { CartLine, CartTotals, Coupon, Product } from "@/types";

/* -------------------------------------------------------------------------
   Storefront rules.

   These constants are the commercial policy of the shop, and they belong in
   one place: a free-shipping threshold that disagrees between the cart badge,
   the product page and the checkout summary is the classic way to lose an
   order at the last step.
------------------------------------------------------------------------- */

/** Orders at or above this subtotal ship free. */
export const FREE_SHIPPING_THRESHOLD = 15000;

/** Flat delivery charge below the threshold. */
export const SHIPPING_FLAT = 499;

/** Fallback lead time when a product doesn't declare its own. */
export const DEFAULT_DELIVERY_DAYS = 5;

/** Codes accepted at checkout. Demo data — wire to a backend before launch. */
export const COUPONS: Coupon[] = [
  {
    code: "OMFIRST10",
    label: "10% off your first order",
    percent: 10,
    maxDiscount: 3000,
  },
  {
    code: "DESKUP15",
    label: "15% off orders above ₹40,000",
    percent: 15,
    maxDiscount: 8000,
    minSubtotal: 40000,
  },
  {
    code: "BULK20",
    label: "20% off orders above ₹1,00,000",
    percent: 20,
    maxDiscount: 30000,
    minSubtotal: 100000,
  },
];

/** Percentage saved against MRP, rounded down so we never overstate a deal. */
export function discountPercent(price: number, compareAt?: number): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.floor(((compareAt - price) / compareAt) * 100);
}

/** Compact INR for tight spaces — cards, badges, the cart pill. */
export function formatINR(value: number): string {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

/** Stable identity for a configured product. See CartLine.lineId. */
export function makeLineId(slug: string, color: string): string {
  return `${slug}::${color}`;
}

/** True when the product can be added to the cart right now. */
export function isPurchasable(product: Product): boolean {
  return product.stock === undefined || product.stock > 0;
}

/**
 * Low-stock urgency copy.
 *
 * Deliberately silent above five units. "Only 47 left" is not urgency, it is
 * noise, and shoppers have learned to discount the pattern entirely when it
 * appears on everything.
 */
export function stockNotice(product: Product): string | null {
  if (product.stock === undefined) return null;
  if (product.stock === 0) return "Out of stock";
  if (product.stock <= 5) return `Only ${product.stock} left`;
  return null;
}

/** Validate a code against the current subtotal. Returns the reason on failure. */
export function resolveCoupon(
  code: string,
  subtotal: number
): { coupon: Coupon; discount: number } | { error: string } {
  const normalised = code.trim().toUpperCase();
  const coupon = COUPONS.find((c) => c.code === normalised);

  if (!coupon) return { error: "That code isn't valid." };

  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
    return {
      error: `Add ${formatINR(coupon.minSubtotal - subtotal)} more to use ${coupon.code}.`,
    };
  }

  const raw = Math.round((subtotal * coupon.percent) / 100);
  const discount = coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;

  return { coupon, discount };
}

/**
 * Order maths, in one function.
 *
 * Order of operations matters and is easy to get wrong: the coupon applies to
 * the subtotal, and shipping is decided on the *pre-coupon* subtotal. Deciding
 * it after would let a discount code silently drag an order back below the
 * free-shipping line and hand the shopper a delivery charge they didn't have
 * a moment earlier.
 */
export function calculateTotals(
  lines: CartLine[],
  coupon?: Coupon | null
): CartTotals {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);

  const savings = lines.reduce(
    (sum, l) =>
      sum + (l.compareAtPrice ? (l.compareAtPrice - l.price) * l.qty : 0),
    0
  );

  const itemCount = lines.reduce((sum, l) => sum + l.qty, 0);

  let couponDiscount = 0;
  if (coupon && subtotal > 0) {
    const raw = Math.round((subtotal * coupon.percent) / 100);
    couponDiscount = coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
  }

  const shipping =
    subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;

  return {
    subtotal,
    savings,
    shipping,
    couponDiscount,
    total: Math.max(0, subtotal - couponDiscount + shipping),
    itemCount,
  };
}

/** How much more the shopper needs to spend to unlock free delivery. */
export function amountToFreeShipping(subtotal: number): number {
  return Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
}

/** Estimated delivery window, expressed as a date range string. */
export function deliveryEstimate(days = DEFAULT_DELIVERY_DAYS): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  const from = new Date();
  from.setDate(from.getDate() + days);

  const to = new Date();
  to.setDate(to.getDate() + days + 2);

  return `${fmt(from)} – ${fmt(to)}`;
}
