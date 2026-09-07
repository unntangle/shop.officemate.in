/**
 * Storefront API queries.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE METAFIELD CONTRACT
 *
 * Everything in `PRODUCT_METAFIELDS` below must exist as a metafield
 * DEFINITION in Shopify, in the `custom` namespace, with Storefront API
 * access enabled. Create them under:
 *
 *   Settings → Custom data → Products → Add definition
 *
 * A metafield that has no definition, or has one without Storefront access,
 * comes back as `null` rather than as an error. That is what makes this safe
 * to ship before any of them exist: the mapper falls back to the local
 * record in constants/products.ts, so nothing breaks while the content is
 * being migrated field by field.
 *
 * Types to use when creating each definition:
 *
 *   tagline          Single line text
 *   swatch           Colour
 *   badges           Single line text  (list)
 *   materials        Single line text  (list)
 *   care             Single line text  (list)
 *   usage            Multi-line text
 *   warranty         Single line text
 *   rating           Decimal
 *   review_count     Integer
 *   delivery_days    Integer
 *   features         JSON   [{ title, description }]
 *   benefits         JSON   [{ title, description }]
 *   dimensions       JSON   [{ label, value }]
 *   specifications   JSON   [{ label, value }]
 *   faqs             JSON   [{ question, answer }]
 *   downloads        JSON   [{ label, type, size }]
 *
 * ⚠ THE SIX JSON ONES ARE A COMPROMISE WORTH KNOWING ABOUT. Shopify renders a
 * JSON metafield in the admin as a raw code box, which is fine for you and
 * hostile to a non-technical client. The friendly alternative is a metaobject
 * definition per structure, which gives a proper form with named fields — at
 * the cost of six metaobject definitions plus an entry per row per product.
 *
 * Start with JSON to get the migration moving, and convert the ones the
 * client actually edits (most likely `faqs` and `specifications`) to
 * metaobjects later. The mapper reads the parsed value either way, so that
 * conversion touches this file and the mapper, not the storefront.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** Keys requested on every product. See the contract above. */
const PRODUCT_METAFIELD_KEYS = [
  "tagline",
  "swatch",
  "badges",
  "materials",
  "care",
  "usage",
  "warranty",
  "rating",
  "review_count",
  "delivery_days",
  "features",
  "benefits",
  "dimensions",
  "specifications",
  "faqs",
  "downloads",
] as const;

/* `identifiers` takes a fixed list, which is why the keys are declared once
   above rather than inline — the query and the mapper have to agree, and a
   typo in one produces a silently missing field rather than an error. */
const PRODUCT_METAFIELDS = `
  metafields(identifiers: [
    ${PRODUCT_METAFIELD_KEYS.map(
      (key) => `{ namespace: "custom", key: "${key}" }`
    ).join("\n    ")}
  ]) { key value type }
`;

/**
 * The product fragment.
 *
 * `variants(first: 100)` because colourways are variants — that is what makes
 * the colour filter on the listing page real rather than the half-working
 * thing it was against local data.
 *
 * Each variant carries its own `swatch` metafield for the hex, since Shopify
 * option values are plain strings: the option gives you "Graphite", not
 * #4A4A4A, and the picker needs the colour to draw a dot.
 *
 * `collections(first: 10)` supplies the category. The handle is matched
 * against `CategorySlug`, which is why collection handles must be created to
 * match — see the mapper.
 */
const PRODUCT_FRAGMENT = `
  id
  handle
  title
  productType
  description
  descriptionHtml
  availableForSale
  totalInventory
  featuredImage { url altText }
  images(first: 20) { edges { node { url altText } } }
  priceRange { minVariantPrice { amount currencyCode } }
  compareAtPriceRange { minVariantPrice { amount currencyCode } }
  collections(first: 10) { edges { node { handle title } } }
  variants(first: 100) {
    edges {
      node {
        id
        title
        sku
        availableForSale
        quantityAvailable
        selectedOptions { name value }
        price { amount }
        compareAtPrice { amount }
        metafield(namespace: "custom", key: "swatch") { value }
      }
    }
  }
  ${PRODUCT_METAFIELDS}
`;

/**
 * Every product, for the catalogue.
 *
 * 250 is the Storefront API's per-page ceiling. That is comfortably above the
 * current range, but a catalogue that grows past it will silently truncate —
 * the response is valid, just short. `pageInfo` is requested so the mapper can
 * warn rather than quietly drop products.
 */
export const ALL_PRODUCTS_QUERY = `
  query AllProducts($first: Int!) {
    products(first: $first) {
      pageInfo { hasNextPage }
      edges { node { ${PRODUCT_FRAGMENT} } }
    }
  }
`;

/** One product, for the detail page. */
export const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) { ${PRODUCT_FRAGMENT} }
  }
`;
