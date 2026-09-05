export type CategorySlug =
  | "office-chairs"
  | "office-tables"
  | "work-stations"
  | "soft-sofas"
  | "leisure-lounges"
  | "tele-pods"
  | "work-wellness"
  | "office-storage";

export interface Category {
  slug: CategorySlug;
  name: string;
  tagline: string;
  subcategories?: string[];
}

/**
 * A nav grouping over `CategorySlug`.
 *
 * Groups hold slugs rather than `Category` objects so the grouping stays a
 * pure index into `CATEGORIES` — names, taglines and series live in exactly
 * one place, and a category can never drift between the strip and the nav.
 * The union type means a typo in a slug is a compile error, and dropping a
 * category from `CategorySlug` will surface every group that referenced it.
 */
export interface CategoryGroup {
  /** Stable key, also used as the open/closed identity in the header. */
  id: string;
  /** Nav label. A verb, not a product noun — see CATEGORY_GROUPS. */
  label: string;
  slugs: CategorySlug[];
}

export interface SpecRow {
  label: string;
  value: string;
}

export interface ProductFAQ {
  question: string;
  answer: string;
}

export interface Download {
  label: string;
  type: "brochure" | "manual" | "warranty";
  size: string;
}

export interface Benefit {
  title: string;
  description: string;
}

export interface Product {
  name: string;
  slug: string;
  category: CategorySlug;
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  /** One-line hook used on cards. */
  tagline: string;
  /** Longer overview paragraph used on the detail page. */
  description: string;
  /** Accent color used for the generated product "render" placeholder. */
  swatch: string;
  colors: { name: string; hex: string }[];
  /** Short capability badges shown on the product card. */
  badges: string[];
  features: { title: string; description: string }[];
  benefits: Benefit[];
  materials: string[];
  dimensions: SpecRow[];
  specifications: SpecRow[];
  usage: string;
  warranty: string;
  care: string[];
  faqs: ProductFAQ[];
  downloads: Download[];
  relatedSlugs: string[];
  featured?: boolean;
  isNew?: boolean;

  /* ----------------------------------------------------------------------
     Retail fields. All optional so the existing catalogue keeps type-checking
     untouched — the storefront falls back to sensible defaults per product
     rather than requiring every record to be re-authored at once.
  ---------------------------------------------------------------------- */

  /** Stock keeping unit shown on the cart line and order summary. */
  sku?: string;
  /** Units on hand. `undefined` is treated as in stock. 0 disables buying. */
  stock?: number;
  /** Merchandising flags driving the homepage rails. */
  bestSeller?: boolean;
  /** Free delivery threshold override, in paise-free rupees. */
  deliveryDays?: number;
}

/* -------------------------------------------------------------------------
   Cart

   A line is identified by slug + colour, not slug alone: the same chair in two
   colourways is two lines, and merging them would silently change what the
   shopper ordered. `lineId` encodes that pair so every reducer can stay a
   simple lookup.
------------------------------------------------------------------------- */

export interface CartLine {
  /** `${slug}::${color}` — stable identity for a configured product. */
  lineId: string;
  slug: string;
  name: string;
  /** Unit price actually charged, after any product-level discount. */
  price: number;
  /** Manufacturer's price, used to show the saving. */
  compareAtPrice?: number;
  color: string;
  colorHex: string;
  image?: string;
  category: CategorySlug;
  qty: number;
  /** Snapshot so the cart survives a catalogue price change mid-session. */
  addedAt: number;
}

export interface CartTotals {
  /** Sum of line prices before any order-level discount. */
  subtotal: number;
  /** Total the shopper saves against MRP. */
  savings: number;
  /** Delivery charge — zero above the free-shipping threshold. */
  shipping: number;
  /** Coupon reduction, if one is applied. */
  couponDiscount: number;
  total: number;
  itemCount: number;
}

export interface Coupon {
  code: string;
  label: string;
  /** Percentage off the subtotal. */
  percent: number;
  /** Cap on the rupee value of the discount. */
  maxDiscount?: number;
  /** Minimum subtotal before the code is valid. */
  minSubtotal?: number;
}
