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

/**
 * A buyable variant — one colourway of one product.
 *
 * `id` IS THE WHOLE POINT. It is Shopify's global variant ID
 * (`gid://shopify/ProductVariant/…`) and the only thing Shopify's Cart API
 * accepts. A cart line built from a slug and a colour name cannot be sent
 * anywhere; a line carrying this can.
 *
 * Optional on `Product` because a product served from the LOCAL catalogue has
 * no variant IDs — there is no Shopify record behind it. That is not a gap to
 * paper over: a product with no variants genuinely cannot be purchased, and
 * the buy button should say so rather than fail at checkout.
 */
export interface ProductVariant {
  /** Shopify global ID. Required by every Cart API mutation. */
  id: string;
  /** Colourway name, matching `Product.colors[].name`. */
  color: string;
  hex: string;
  price: number;
  compareAtPrice?: number;
  available: boolean;
  sku?: string;
}

export interface Product {
  name: string;
  slug: string;
  category: CategorySlug;
  /**
   * The series this product belongs to, e.g. "Executive Series".
   *
   * MUST be one of `Category.subcategories` for its `category` in
   * constants/categories.ts — that array is what renders the series rail and
   * the filter drawer, and a value not in it produces a product reachable
   * only under "All".
   *
   * It used to come from constants/chairs.ts, which merged a series onto each
   * product by slug. Those mock models are gone, so the series lives on the
   * product itself now. Maps to `product_type` in Shopify.
   */
  subcategory?: string;
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
  /**
   * Buyable variants, from Shopify. Empty for locally-sourced products.
   *
   * `colors` and this describe the same colourways from two different
   * sources: `colors` is for DISPLAY (the swatch dots), `variants` is for
   * PURCHASE. They are kept separate because a local product can have colours
   * with nothing to buy, and conflating them would put an Add to cart button
   * on something with no variant to add.
   */
  variants?: ProductVariant[];
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
  /**
   * Shopify variant ID for this line.
   *
   * REQUIRED FOR CHECKOUT. Shopify's Cart API identifies a line by variant,
   * not by slug and colour, so a line without this can be displayed and
   * totalled locally but can never be sent to Shopify or paid for.
   *
   * Optional only so that carts saved before the Shopify migration still
   * deserialise instead of throwing. A line missing it should be treated as
   * unbuyable and dropped at checkout rather than silently skipped.
   */
  variantId?: string;
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

/* -------------------------------------------------------------------------
   Addresses

   FIELD NAMES MATCH SHOPIFY'S `MailingAddress`, deliberately and exactly.

   This used to be a local shape — `line1`, `state`, `pincode`, `name` — which
   read more naturally for an Indian address form but meant every save and
   every read crossed a translation layer. Translation layers between two
   near-identical shapes are where fields quietly go missing: someone adds
   `company` to the form, forgets the mapper, and it never reaches Shopify
   while the UI happily shows it.

   So the storefront speaks Shopify's language and the form labels do the
   localising instead. `address1` is labelled "Flat, building, street",
   `province` is labelled "State", `zip` is labelled "PIN code". The customer
   sees Indian terms; the code sees one vocabulary end to end.

   `province` and `country` take FULL NAMES, not ISO codes — Shopify's
   Storefront API accepts "Tamil Nadu" and "India" and resolves them itself.
   That avoids maintaining a state-code table, and avoids the failure where an
   unrecognised state silently saves a blank province.
------------------------------------------------------------------------- */

export interface Address {
  /**
   * Shopify's MailingAddress GID once saved.
   *
   * A locally-generated id before the first sync, so the form can track a
   * draft that does not exist server-side yet. Anything not starting with
   * `gid://` has never reached Shopify.
   */
  id: string;
  firstName?: string;
  lastName?: string;
  /** Shown on the label for B2B deliveries; Shopify prints it on the parcel. */
  company?: string;
  /** Flat, building, street. */
  address1: string;
  /** Area, landmark. */
  address2?: string;
  city: string;
  /** Full state name, e.g. "Tamil Nadu". */
  province?: string;
  /** PIN code. */
  zip: string;
  /** Full country name. Defaults to "India" — the only market served today. */
  country: string;
  phone?: string;
  /**
   * Whether this is the customer's default.
   *
   * Shopify tracks this as a pointer ON THE CUSTOMER (`defaultAddress`), not
   * as a flag on each address, so it is set with
   * `customerDefaultAddressUpdate` rather than by writing the address. Only
   * ever one can be true; the UI must not let two be marked.
   */
  isDefault?: boolean;
}
