import { getAccessToken } from "@/lib/shopify/customer-auth";
import { discover } from "@/lib/shopify/customer-auth";

/**
 * Customer Account API — reading the signed-in customer.
 *
 * This is what makes the account dashboard real. Orders, addresses and
 * profile come from Shopify, so the admin and the storefront are finally
 * looking at one record rather than two that quietly diverge.
 *
 * ⚠ SERVER ONLY. The access token is in an httpOnly cookie and must stay
 * there; every function here runs on the server and returns plain data.
 */

const API_VERSION = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2026-01";

/**
 * The Customer Account GraphQL endpoint.
 *
 * DERIVED FROM THE SHOP ID IN THE DISCOVERED AUTHORIZATION ENDPOINT, which
 * looks like `https://shopify.com/authentication/82559664366/oauth/authorize`.
 * The OpenID document covers authentication URLs but not this one, and the
 * shop ID is not the myshopify domain — pulling it out of a URL we already
 * fetched avoids hardcoding a number that differs per store and would need a
 * separate env var nobody would remember to set.
 */
async function endpoint(): Promise<string> {
  const { authorization_endpoint } = await discover();
  const shopId = authorization_endpoint.match(/authentication\/(\d+)\//)?.[1];

  if (!shopId) {
    throw new Error(
      `Could not read the shop ID from "${authorization_endpoint}". ` +
        `Shopify may have changed the authorization URL format.`
    );
  }

  return `https://shopify.com/${shopId}/account/customer/api/${API_VERSION}/graphql`;
}

/**
 * Run a query as the signed-in customer.
 *
 * Returns null when nobody is signed in — an ordinary state that should
 * render a sign-in prompt, not an error.
 *
 * NOTE THE AUTHORIZATION HEADER HAS NO "Bearer" PREFIX. The Customer Account
 * API takes the raw token, unlike almost every other OAuth API. If this ever
 * starts returning 401 against a token that was just issued, that prefix is
 * the first thing to check.
 */
async function customerFetch<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const res = await fetch(await endpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ query, variables }),
    /* Never cached. This is one specific person's orders and addresses;
       caching it risks serving one customer's data to another. */
    cache: "no-store",
  });

  if (res.status === 401) return null;

  if (!res.ok) {
    console.error(`[customer] API returned ${res.status} ${res.statusText}`);
    return null;
  }

  const body = (await res.json()) as {
    data?: T;
    errors?: { message: string }[];
  };

  if (body.errors?.length) {
    console.error(
      `[customer] ${body.errors.map((e) => e.message).join("; ")}`
    );
    return null;
  }

  return body.data ?? null;
}

/* ------------------------------------------------------------------ shapes */

export interface CustomerAddress {
  id: string;
  firstName?: string;
  lastName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  zip?: string;
  country?: string;
  phone?: string;
}

export interface CustomerOrderLine {
  title: string;
  quantity: number;
  image?: string;
  price: number;
}

export interface CustomerOrder {
  id: string;
  /** Human-facing order number, e.g. "#1001". */
  name: string;
  processedAt: string;
  financialStatus?: string;
  fulfillmentStatus?: string;
  total: number;
  currency: string;
  lines: CustomerOrderLine[];
}

export interface CustomerProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  defaultAddressId?: string;
  addresses: CustomerAddress[];
}

/* ----------------------------------------------------------------- queries */

const ADDRESS_FIELDS = `
  id
  firstName
  lastName
  address1
  address2
  city
  territoryCode
  zoneCode
  zip
  phoneNumber
`;

/* eslint-disable @typescript-eslint/no-explicit-any */
function toAddress(node: any): CustomerAddress {
  return {
    id: node.id,
    firstName: node.firstName ?? undefined,
    lastName: node.lastName ?? undefined,
    address1: node.address1 ?? undefined,
    address2: node.address2 ?? undefined,
    city: node.city ?? undefined,
    /* `zoneCode` is the state ("TN"), `territoryCode` the country ("IN").
       Shopify dropped the long-form `province` and `country` fields in the
       newer Customer Account API versions. */
    province: node.zoneCode ?? undefined,
    zip: node.zip ?? undefined,
    country: node.territoryCode ?? undefined,
    phone: node.phoneNumber ?? undefined,
  };
}

/** Profile plus saved addresses, or null when signed out. */
export async function getCustomer(): Promise<CustomerProfile | null> {
  const data = await customerFetch<{ customer: any }>(`
    query Customer {
      customer {
        id
        firstName
        lastName
        emailAddress { emailAddress }
        phoneNumber { phoneNumber }
        defaultAddress { id }
        addresses(first: 20) { edges { node { ${ADDRESS_FIELDS} } } }
      }
    }
  `);

  const c = data?.customer;
  if (!c) return null;

  return {
    id: c.id,
    firstName: c.firstName ?? undefined,
    lastName: c.lastName ?? undefined,
    email: c.emailAddress?.emailAddress ?? undefined,
    phone: c.phoneNumber?.phoneNumber ?? undefined,
    defaultAddressId: c.defaultAddress?.id ?? undefined,
    addresses: (c.addresses?.edges ?? []).map((e: any) => toAddress(e.node)),
  };
}

/**
 * Order history, newest first.
 *
 * Twenty orders without pagination. This is a dashboard panel, not an
 * archive, and nobody scrolls past twenty — add a cursor if that changes.
 */
export async function getCustomerOrders(): Promise<CustomerOrder[]> {
  const data = await customerFetch<{ customer: any }>(`
    query Orders {
      customer {
        orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
          edges {
            node {
              id
              name
              processedAt
              financialStatus
              fulfillments(first: 1) { edges { node { status } } }
              totalPrice { amount currencyCode }
              lineItems(first: 20) {
                edges {
                  node {
                    title
                    quantity
                    image { url }
                    price { amount }
                  }
                }
              }
            }
          }
        }
      }
    }
  `);

  const edges = data?.customer?.orders?.edges ?? [];

  return edges.map(({ node }: any) => ({
    id: node.id,
    name: node.name,
    processedAt: node.processedAt,
    financialStatus: node.financialStatus ?? undefined,
    /* An order with no fulfillment yet simply has none — that is "processing",
       not an error, and the UI reads the absence rather than a status string
       Shopify would not have sent. */
    fulfillmentStatus:
      node.fulfillments?.edges?.[0]?.node?.status ?? undefined,
    total: Number(node.totalPrice?.amount ?? 0),
    currency: node.totalPrice?.currencyCode ?? "INR",
    lines: (node.lineItems?.edges ?? []).map((e: any) => ({
      title: e.node.title,
      quantity: e.node.quantity,
      image: e.node.image?.url,
      price: Number(e.node.price?.amount ?? 0),
    })),
  }));
}

/** True when a customer session exists. Cheap check for gating UI. */
export async function isSignedIn(): Promise<boolean> {
  return (await getAccessToken()) !== null;
}

/**
 * Update the customer's name.
 *
 * EMAIL IS DELIBERATELY NOT UPDATABLE HERE. On new customer accounts the
 * email IS the identity — it is what the sign-in code was sent to — so
 * changing it is an identity change that Shopify handles on its own account
 * pages with its own re-verification. Offering an email field in our profile
 * form would either fail or silently orphan the session.
 *
 * That is also why the setup screen now only asks for a name: Shopify already
 * has a verified email by the time anyone reaches it.
 */
export async function updateCustomerName(fields: {
  firstName?: string;
  lastName?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const data = await customerFetch<{ customerUpdate: any }>(
    `mutation UpdateCustomer($input: CustomerUpdateInput!) {
      customerUpdate(input: $input) {
        customer { id firstName lastName }
        userErrors { field message }
      }
    }`,
    { input: fields }
  );

  if (!data) return { ok: false, error: "You're signed out. Sign in again." };

  const errors = data.customerUpdate?.userErrors ?? [];
  if (errors.length > 0) {
    return {
      ok: false,
      error: errors.map((e: any) => e.message).join("; "),
    };
  }

  return { ok: true };
}
