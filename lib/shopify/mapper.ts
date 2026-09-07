import type { CategorySlug, Product, ProductVariant, SpecRow } from "@/types";
import type { ShopItem } from "@/lib/catalog";
import { CATEGORIES } from "@/constants/categories";
import { PRODUCTS, PRODUCT_IMAGES } from "@/constants/products";

/**
 * Shopify → ShopItem.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * SHOPIFY FIRST, LOCAL RECORD AS FALLBACK, FIELD BY FIELD.
 *
 * Not "Shopify if configured, otherwise local" — that would be all or
 * nothing, and would mean every one of the sixteen metafields had to exist
 * and be populated on every product before the site could switch over.
 * Instead each field independently prefers Shopify and falls back to the
 * matching record in constants/products.ts, matched BY HANDLE.
 *
 * So the migration goes: create a product in Shopify and it takes over name,
 * price, images and variants immediately, while its specs and FAQs keep
 * coming from the local file. Add the `specifications` metafield and that
 * one field switches source. Nothing is ever half-broken.
 *
 * THE FALLBACK IS TEMPORARY AND SHOULD BE DELETED. Once every product is in
 * Shopify with its content, `localFor` and the imports from
 * constants/products.ts come out, and this file reads Shopify only. Leaving
 * it in permanently recreates the two-sources problem that produced the
 * invented pricing we removed from lib/catalog.ts.
 * ─────────────────────────────────────────────────────────────────────────
 */

/* ------------------------------------------------------------ raw shapes */

interface RawMetafield {
  key: string;
  value: string;
  type: string;
}

interface RawVariant {
  id: string;
  title: string;
  sku?: string | null;
  availableForSale: boolean;
  quantityAvailable?: number | null;
  selectedOptions: { name: string; value: string }[];
  price: { amount: string };
  compareAtPrice?: { amount: string } | null;
  metafield?: { value: string } | null;
}

export interface RawProduct {
  id: string;
  handle: string;
  title: string;
  productType: string;
  description: string;
  descriptionHtml: string;
  availableForSale: boolean;
  totalInventory?: number | null;
  featuredImage?: { url: string; altText?: string | null } | null;
  images: { edges: { node: { url: string; altText?: string | null } }[] };
  priceRange: { minVariantPrice: { amount: string } };
  compareAtPriceRange: { minVariantPrice: { amount: string } };
  collections: { edges: { node: { handle: string; title: string } }[] };
  variants: { edges: { node: RawVariant }[] };
  metafields: (RawMetafield | null)[];
}

/* --------------------------------------------------------------- helpers */

const VALID_CATEGORIES = new Set(CATEGORIES.map((c) => c.slug));

/** The local record for a handle, or undefined. See the note above. */
const localFor = (handle: string) => PRODUCTS.find((p) => p.slug === handle);

/**
 * Metafields as a lookup.
 *
 * The API returns a sparse array aligned to the requested identifiers, with
 * `null` in the slots that have no definition or no value — so this filters
 * before keying rather than assuming positions.
 */
function metaMap(fields: (RawMetafield | null)[]): Map<string, RawMetafield> {
  const map = new Map<string, RawMetafield>();
  for (const f of fields) if (f?.value) map.set(f.key, f);
  return map;
}

const text = (m: Map<string, RawMetafield>, key: string): string | undefined =>
  m.get(key)?.value;

const num = (m: Map<string, RawMetafield>, key: string): number | undefined => {
  const raw = m.get(key)?.value;
  if (raw === undefined) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

/**
 * A `list.*` metafield, which Shopify returns as a JSON-encoded array string
 * rather than as a real array.
 */
function list(m: Map<string, RawMetafield>, key: string): string[] | undefined {
  const raw = m.get(key)?.value;
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * A JSON metafield.
 *
 * Returns undefined on malformed JSON rather than throwing. A client pasting
 * a broken array into an admin text box should cost one empty section, not a
 * 500 on every page that renders the product.
 */
function json<T>(m: Map<string, RawMetafield>, key: string): T | undefined {
  const raw = m.get(key)?.value;
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[shopify] metafield custom.${key} is not valid JSON`);
    }
    return undefined;
  }
}

/**
 * Which of our categories this product belongs to.
 *
 * Matched on COLLECTION HANDLE against `CategorySlug`. That is the whole
 * reason the collections have to be created with handles like
 * `office-chairs` — it removes any mapping table, and a mismatch is visible
 * immediately rather than silently filing a product in the wrong place.
 *
 * `frontpage` and any marketing collection are skipped because they are not
 * in `CategorySlug`. A product in none of the eight lands in `office-chairs`
 * so it is at least reachable, and says so in dev.
 */
function categoryOf(raw: RawProduct, fallback?: CategorySlug): CategorySlug {
  for (const { node } of raw.collections.edges) {
    if (VALID_CATEGORIES.has(node.handle as CategorySlug)) {
      return node.handle as CategorySlug;
    }
  }
  if (fallback) return fallback;
  if (process.env.NODE_ENV === "development") {
    console.warn(
      `[shopify] "${raw.handle}" is in no collection matching a CategorySlug. ` +
        `Add it to one of: ${[...VALID_CATEGORIES].join(", ")}`
    );
  }
  return "office-chairs";
}

/**
 * Colourways, from variants.
 *
 * The option must be named `Color`. Shopify option values are plain strings,
 * so the hex comes from a per-variant `custom.swatch` metafield; without one
 * the dot falls back to a neutral grey rather than disappearing, since a
 * colour picker with invisible options is worse than an approximate one.
 */
function colorsOf(raw: RawProduct, fallback?: Product["colors"]) {
  const seen = new Map<string, string>();

  for (const { node } of raw.variants.edges) {
    const opt = node.selectedOptions.find(
      (o) => o.name.toLowerCase() === "color" || o.name.toLowerCase() === "colour"
    );
    if (!opt) continue;
    if (!seen.has(opt.value)) {
      seen.set(opt.value, node.metafield?.value ?? "#C9CCD1");
    }
  }

  if (seen.size === 0) return fallback ?? [];
  return Array.from(seen, ([name, hex]) => ({ name, hex }));
}

/**
 * Buyable variants, with the IDs the Cart API needs.
 *
 * Built from the same pass as `colorsOf` but kept as a separate field — see
 * the note on `Product.variants`. One is what a shopper looks at, the other
 * is what Shopify charges for.
 *
 * A product with no `Color` option still yields one variant (Shopify creates
 * a "Default Title" variant for every product), so single-finish products are
 * purchasable too.
 */
function variantsOf(raw: RawProduct): ProductVariant[] {
  return raw.variants.edges.map(({ node }) => {
    const opt = node.selectedOptions.find(
      (o) => o.name.toLowerCase() === "color" || o.name.toLowerCase() === "colour"
    );
    const compareAt = node.compareAtPrice
      ? Number(node.compareAtPrice.amount)
      : undefined;
    const price = Number(node.price.amount);

    return {
      id: node.id,
      /* Falls back to the variant title, which is "Default Title" on a
         product with no options. Never blank — the cart line prints this. */
      color: opt?.value ?? node.title,
      hex: node.metafield?.value ?? "#C9CCD1",
      price,
      /* Same rule as the product-level compare-at: never show a strike-through
         that is not above the price. */
      compareAtPrice: compareAt && compareAt > price ? compareAt : undefined,
      available: node.availableForSale,
      sku: node.sku ?? undefined,
    };
  });
}

/* ------------------------------------------------------------- the mapper */

export function toShopItem(raw: RawProduct): ShopItem {
  const local = localFor(raw.handle);
  const m = metaMap(raw.metafields);

  const price = Number(raw.priceRange.minVariantPrice.amount);
  const compareAt = Number(raw.compareAtPriceRange.minVariantPrice.amount);

  /**
   * Compare-at price.
   *
   * ⚠ NO LOCAL FALLBACK, DELIBERATELY, UNLIKE EVERY OTHER FIELD HERE.
   *
   * Price and compare-at are not independent — the discount badge is derived
   * from the pair. Taking the price from Shopify and the compare-at from
   * constants/products.ts produces a number that was never true of either
   * source: a ₹10,000 Shopify price beside a ₹25,999 local MRP renders as
   * "61% OFF", a saving nobody has ever offered.
   *
   * A fabricated discount is a consumer-protection problem, not a display
   * glitch, so the two values must come from the same place or the
   * strike-through must not appear at all.
   *
   * Shopify also reports compare-at as 0 (or null) when unset, hence the
   * `> price` guard: a strike-through at ₹0 is worse than none.
   */
  const shopifyCompareAt = compareAt > price ? compareAt : undefined;

  /**
   * The series.
   *
   * `productType` is the agreed home for it — see the note in
   * types/index.ts. A product with no type falls back to the local record,
   * then to "Featured", which surfaces in the series rail as a circle named
   * "Featured" and is the visible signal that Product type was left blank.
   */
  const subcategory = raw.productType || local?.subcategory || "Featured";

  const images = raw.images.edges.map((e) => e.node.url);
  /* Hero first, then the rest, de-duplicated. Shopify usually repeats the
     featured image inside `images`, and a duplicate makes the card's hover
     carousel appear to stall on the first shot. */
  const hero = raw.featuredImage?.url ?? images[0];
  const gallery = hero
    ? [hero, ...images.filter((u) => u !== hero)]
    : images;

  const image = hero ?? PRODUCT_IMAGES[raw.handle];

  /* Assembled to the existing `Product` shape so every component that already
     reads it — BuyBox, the detail page, the cards — keeps working untouched.
     Each field prefers Shopify, then the local record, then an empty value. */
  const product: Product = {
    name: raw.title,
    slug: raw.handle,
    category: categoryOf(raw, local?.category),
    subcategory,
    price,
    /* See the note on `shopifyCompareAt` above — no local fallback here. */
    compareAtPrice: shopifyCompareAt,
    rating: num(m, "rating") ?? local?.rating ?? 0,
    reviewCount: num(m, "review_count") ?? local?.reviewCount ?? 0,
    tagline: text(m, "tagline") ?? local?.tagline ?? "",
    /* Plain text, not descriptionHtml — the detail page renders it as a
       paragraph, and injecting admin-authored HTML there is both a layout
       risk and an XSS one. */
    description: raw.description || local?.description || "",
    swatch: text(m, "swatch") ?? local?.swatch ?? "#2B2B2E",
    colors: colorsOf(raw, local?.colors),
    variants: variantsOf(raw),
    badges: list(m, "badges") ?? local?.badges ?? [],
    features: json(m, "features") ?? local?.features ?? [],
    benefits: json(m, "benefits") ?? local?.benefits ?? [],
    materials: list(m, "materials") ?? local?.materials ?? [],
    dimensions: json<SpecRow[]>(m, "dimensions") ?? local?.dimensions ?? [],
    specifications:
      json<SpecRow[]>(m, "specifications") ?? local?.specifications ?? [],
    usage: text(m, "usage") ?? local?.usage ?? "",
    warranty: text(m, "warranty") ?? local?.warranty ?? "",
    care: list(m, "care") ?? local?.care ?? [],
    faqs: json(m, "faqs") ?? local?.faqs ?? [],
    downloads: json(m, "downloads") ?? local?.downloads ?? [],
    /* Related products stay local for now. Doing it properly needs a
       `list.product_reference` metafield, and resolving those references
       means a second query — not worth it until the catalogue is entered. */
    relatedSlugs: local?.relatedSlugs ?? [],
    sku: raw.variants.edges[0]?.node.sku ?? undefined,
    /* `availableForSale` is the honest signal. `totalInventory` is null unless
       the inventory scope is granted, and treating null as zero would mark the
       whole catalogue out of stock. */
    stock: raw.availableForSale ? (raw.totalInventory ?? undefined) : 0,
    deliveryDays: num(m, "delivery_days") ?? local?.deliveryDays,
  };

  return {
    name: product.name,
    slug: product.slug,
    category: product.category,
    subcategory,
    image,
    /* Shopify media only. NO local fallback: a product whose photography has
       moved to Shopify must not keep showing the old local shots alongside
       the new ones, and mixing the two produces a carousel of the same chair
       in two different finishes. */
    images: gallery,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    rating: product.rating,
    reviewCount: product.reviewCount,
    /* Always false: everything here has a real Shopify price. The flag stays
       on the type for genuinely quote-only products — see lib/catalog.ts. */
    pricingIsEstimated: false,
    product,
  };
}
