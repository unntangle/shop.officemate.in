"use server";

import { cookies } from "next/headers";
import { shopifyFetch, shopifyConfigured } from "@/lib/shopify/client";

/**
 * The Shopify cart.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS AT ALL, given the local cart already works.
 *
 * Only a Shopify cart produces a `checkoutUrl`, and that URL *is* checkout —
 * payment, tax, shipping rates, order creation, confirmation emails, PCI
 * scope. There is no API that accepts a locally-assembled basket and charges
 * for it. So without a server-side cart there is no way to take money, no
 * matter how correct the local one looks.
 *
 * Two things stop being our problem as a result. Prices are recalculated by
 * Shopify on every mutation, so a tampered `localStorage` price cannot
 * produce a cheap order — a risk app/checkout/page.tsx flags in its own
 * header. And discount codes become Shopify's, replacing the hardcoded
 * COUPONS array in lib/commerce.ts.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * SERVER ACTIONS, NOT CLIENT FETCHES. The Storefront token is public and
 * could technically be called from the browser, but routing through the
 * server keeps one code path for every Shopify call, keeps the cart ID in an
 * httpOnly cookie the page script cannot read, and means the day any of this
 * needs a private token, nothing above has to change.
 *
 * THE CART ID LIVES IN A COOKIE, NOT IN localStorage. It is the only piece of
 * cart state we hold — the lines, quantities and totals all come back from
 * Shopify on every call. Storing lines locally as well would recreate exactly
 * the two-sources-of-truth problem this migration removes.
 */

const CART_COOKIE = "officemate_cart_id";

/* Shopify keeps an abandoned cart for about ten days; matching that means the
   cookie cannot outlive the cart it points at and leave someone with a basket
   that silently fails on the next mutation. */
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 10;

const CART_FRAGMENT = `
  id
  checkoutUrl
  totalQuantity
  cost {
    subtotalAmount { amount currencyCode }
    totalAmount { amount currencyCode }
    totalTaxAmount { amount }
  }
  discountCodes { code applicable }
  lines(first: 100) {
    edges {
      node {
        id
        quantity
        cost { totalAmount { amount } }
        merchandise {
          ... on ProductVariant {
            id
            title
            sku
            availableForSale
            price { amount }
            compareAtPrice { amount }
            selectedOptions { name value }
            image { url }
            product { handle title }
          }
        }
      }
    }
  }
`;

/** Shape returned to the client. Deliberately flat — the provider renders it. */
export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotal: number;
  total: number;
  tax: number;
  discountCodes: { code: string; applicable: boolean }[];
  lines: {
    /** Shopify's CART LINE id, not the variant id. Needed to update/remove. */
    id: string;
    variantId: string;
    handle: string;
    name: string;
    color: string;
    image?: string;
    price: number;
    compareAtPrice?: number;
    quantity: number;
    available: boolean;
  }[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalise(cart: any): ShopifyCart {
  return {
    id: cart.id,
    checkoutUrl: cart.checkoutUrl,
    totalQuantity: cart.totalQuantity ?? 0,
    subtotal: Number(cart.cost?.subtotalAmount?.amount ?? 0),
    total: Number(cart.cost?.totalAmount?.amount ?? 0),
    tax: Number(cart.cost?.totalTaxAmount?.amount ?? 0),
    discountCodes: cart.discountCodes ?? [],
    lines: (cart.lines?.edges ?? []).map(({ node }: any) => {
      const v = node.merchandise;
      const opt = v.selectedOptions?.find(
        (o: any) =>
          o.name.toLowerCase() === "color" || o.name.toLowerCase() === "colour"
      );
      const compareAt = v.compareAtPrice
        ? Number(v.compareAtPrice.amount)
        : undefined;
      const price = Number(v.price.amount);

      return {
        id: node.id,
        variantId: v.id,
        handle: v.product.handle,
        name: v.product.title,
        color: opt?.value ?? v.title,
        image: v.image?.url,
        price,
        compareAtPrice: compareAt && compareAt > price ? compareAt : undefined,
        quantity: node.quantity,
        available: v.availableForSale,
      };
    }),
  };
}

/**
 * Shopify returns mutation failures in `userErrors` with HTTP 200 and a null
 * cart, so this is not covered by the client's error handling.
 */
function assertNoUserErrors(payload: any, op: string) {
  const errors = payload?.userErrors ?? [];
  if (errors.length > 0) {
    throw new Error(
      `${op}: ${errors.map((e: any) => e.message).join("; ")}`
    );
  }
}

async function readCartId() {
  return (await cookies()).get(CART_COOKIE)?.value ?? null;
}

async function writeCartId(id: string) {
  (await cookies()).set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: CART_COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * The current cart, or null.
 *
 * Returns null rather than throwing when the cookie points at a cart Shopify
 * no longer has — an expired or completed cart is an ordinary state, not an
 * error, and the next add simply creates a fresh one.
 */
export async function getCart(): Promise<ShopifyCart | null> {
  if (!shopifyConfigured) return null;
  const id = await readCartId();
  if (!id) return null;

  try {
    const data = await shopifyFetch<{ cart: any }>(
      `query Cart($id: ID!) { cart(id: $id) { ${CART_FRAGMENT} } }`,
      { id }
    );
    return data.cart ? normalise(data.cart) : null;
  } catch {
    return null;
  }
}

/**
 * Add a variant, creating the cart on first use.
 *
 * Shopify merges a repeat add of the same variant into the existing line and
 * returns the combined quantity, so no client-side de-duplication is needed —
 * and none should be added, or the two would disagree.
 */
export async function addToCart(
  variantId: string,
  quantity = 1
): Promise<ShopifyCart | null> {
  if (!shopifyConfigured) return null;

  const existingId = await readCartId();
  const lines = [{ merchandiseId: variantId, quantity }];

  if (existingId) {
    const data = await shopifyFetch<{ cartLinesAdd: any }>(
      `mutation Add($id: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $id, lines: $lines) {
          cart { ${CART_FRAGMENT} }
          userErrors { field message }
        }
      }`,
      { id: existingId, lines }
    );

    /* A cart that has expired or been checked out returns no cart and no
       error. Falling through to create a new one is the right recovery — the
       alternative is a shopper whose Add button silently does nothing. */
    if (data.cartLinesAdd?.cart) {
      assertNoUserErrors(data.cartLinesAdd, "addToCart");
      return normalise(data.cartLinesAdd.cart);
    }
  }

  const created = await shopifyFetch<{ cartCreate: any }>(
    `mutation Create($lines: [CartLineInput!]) {
      cartCreate(input: { lines: $lines }) {
        cart { ${CART_FRAGMENT} }
        userErrors { field message }
      }
    }`,
    { lines }
  );

  assertNoUserErrors(created.cartCreate, "cartCreate");
  const cart = created.cartCreate.cart;
  await writeCartId(cart.id);
  return normalise(cart);
}

/** Set a line's quantity. Zero removes it, matching the local reducer. */
export async function updateCartLine(
  lineId: string,
  quantity: number
): Promise<ShopifyCart | null> {
  if (!shopifyConfigured) return null;
  const id = await readCartId();
  if (!id) return null;

  if (quantity <= 0) return removeCartLine(lineId);

  const data = await shopifyFetch<{ cartLinesUpdate: any }>(
    `mutation Update($id: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $id, lines: $lines) {
        cart { ${CART_FRAGMENT} }
        userErrors { field message }
      }
    }`,
    { id, lines: [{ id: lineId, quantity }] }
  );

  assertNoUserErrors(data.cartLinesUpdate, "updateCartLine");
  return data.cartLinesUpdate.cart
    ? normalise(data.cartLinesUpdate.cart)
    : null;
}

export async function removeCartLine(
  lineId: string
): Promise<ShopifyCart | null> {
  if (!shopifyConfigured) return null;
  const id = await readCartId();
  if (!id) return null;

  const data = await shopifyFetch<{ cartLinesRemove: any }>(
    `mutation Remove($id: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $id, lineIds: $lineIds) {
        cart { ${CART_FRAGMENT} }
        userErrors { field message }
      }
    }`,
    { id, lineIds: [lineId] }
  );

  assertNoUserErrors(data.cartLinesRemove, "removeCartLine");
  return data.cartLinesRemove.cart
    ? normalise(data.cartLinesRemove.cart)
    : null;
}

/**
 * Empty the cart.
 *
 * Removes every line in ONE mutation rather than looping `removeCartLine`.
 * A five-line cart would otherwise be five sequential round trips, each
 * returning a cart the next one immediately invalidates — and a failure
 * halfway leaves a partially emptied basket.
 *
 * The cart ITSELF is kept, not discarded. Shopify carts are cheap and the
 * cookie stays valid, so the next add reuses it instead of creating another.
 */
export async function clearCart(): Promise<ShopifyCart | null> {
  if (!shopifyConfigured) return null;
  const id = await readCartId();
  if (!id) return null;

  const current = await getCart();
  const lineIds = current?.lines.map((l) => l.id) ?? [];
  if (lineIds.length === 0) return current;

  const data = await shopifyFetch<{ cartLinesRemove: any }>(
    `mutation Clear($id: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $id, lineIds: $lineIds) {
        cart { ${CART_FRAGMENT} }
        userErrors { field message }
      }
    }`,
    { id, lineIds }
  );

  assertNoUserErrors(data.cartLinesRemove, "clearCart");
  return data.cartLinesRemove.cart
    ? normalise(data.cartLinesRemove.cart)
    : null;
}

/**
 * Add several variants at once.
 *
 * Used by the one-off migration of pre-Shopify localStorage carts, where a
 * whole basket has to be rebuilt in a single call — see CartProvider. Adding
 * them one at a time would fire a mutation per line and, on a cart that does
 * not exist yet, race to create several carts.
 */
export async function addManyToCart(
  items: { variantId: string; quantity: number }[]
): Promise<ShopifyCart | null> {
  if (!shopifyConfigured || items.length === 0) return null;

  const lines = items.map((i) => ({
    merchandiseId: i.variantId,
    quantity: i.quantity,
  }));

  const existingId = await readCartId();

  if (existingId) {
    const data = await shopifyFetch<{ cartLinesAdd: any }>(
      `mutation AddMany($id: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $id, lines: $lines) {
          cart { ${CART_FRAGMENT} }
          userErrors { field message }
        }
      }`,
      { id: existingId, lines }
    );
    if (data.cartLinesAdd?.cart) {
      assertNoUserErrors(data.cartLinesAdd, "addManyToCart");
      return normalise(data.cartLinesAdd.cart);
    }
  }

  const created = await shopifyFetch<{ cartCreate: any }>(
    `mutation CreateMany($lines: [CartLineInput!]) {
      cartCreate(input: { lines: $lines }) {
        cart { ${CART_FRAGMENT} }
        userErrors { field message }
      }
    }`,
    { lines }
  );

  assertNoUserErrors(created.cartCreate, "cartCreate");
  const cart = created.cartCreate.cart;
  await writeCartId(cart.id);
  return normalise(cart);
}

/**
 * Attach the signed-in customer to the cart.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THIS IS WHAT STOPS DUPLICATE CUSTOMER RECORDS.
 *
 * Shopify matches or creates a customer at checkout BY EMAIL. Without this,
 * someone signed in as one address who types another at checkout becomes a
 * second customer — and their order attaches to the wrong one. The account
 * dashboard then shows an order history missing the order they just placed,
 * which is the single most damaging thing an account area can get wrong.
 *
 * Setting `buyerIdentity` binds the cart to the known customer before the
 * hand-off, so the order lands on the right record and checkout arrives
 * prefilled rather than asking again for details we already hold.
 *
 * Failures are swallowed on purpose. A cart that cannot be tagged is still a
 * cart worth checking out — losing the sale to protect the tidiness of a
 * customer record would be the wrong trade.
 * ─────────────────────────────────────────────────────────────────────────
 */
export async function setCartBuyer(identity: {
  email?: string;
  phone?: string;
}): Promise<ShopifyCart | null> {
  if (!shopifyConfigured) return null;
  const id = await readCartId();
  if (!id) return null;

  /* Shopify rejects an empty buyerIdentity, and there is nothing to attach
     anyway when the shopper is not signed in. */
  if (!identity.email && !identity.phone) return null;

  try {
    const data = await shopifyFetch<{ cartBuyerIdentityUpdate: any }>(
      `mutation Buyer($id: ID!, $buyer: CartBuyerIdentityInput!) {
        cartBuyerIdentityUpdate(cartId: $id, buyerIdentity: $buyer) {
          cart { ${CART_FRAGMENT} }
          userErrors { field message }
        }
      }`,
      {
        id,
        buyer: {
          email: identity.email,
          phone: identity.phone,
          countryCode: "IN",
        },
      }
    );

    return data.cartBuyerIdentityUpdate?.cart
      ? normalise(data.cartBuyerIdentityUpdate.cart)
      : null;
  } catch (err) {
    console.error("[cart] could not attach buyer identity", err);
    return null;
  }
}

/**
 * Apply or clear a discount code.
 *
 * Shopify accepts an invalid code without erroring and reports it back with
 * `applicable: false`, so the caller must check that flag rather than assume
 * success. Passing an empty array clears any applied code.
 */
export async function applyDiscountCode(
  code: string | null
): Promise<ShopifyCart | null> {
  if (!shopifyConfigured) return null;
  const id = await readCartId();
  if (!id) return null;

  const data = await shopifyFetch<{ cartDiscountCodesUpdate: any }>(
    `mutation Discount($id: ID!, $codes: [String!]) {
      cartDiscountCodesUpdate(cartId: $id, discountCodes: $codes) {
        cart { ${CART_FRAGMENT} }
        userErrors { field message }
      }
    }`,
    { id, codes: code ? [code] : [] }
  );

  assertNoUserErrors(data.cartDiscountCodesUpdate, "applyDiscountCode");
  return data.cartDiscountCodesUpdate.cart
    ? normalise(data.cartDiscountCodesUpdate.cart)
    : null;
}
