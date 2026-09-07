import { adminFetch } from "@/lib/shopify/admin";

/**
 * Customers, via the Admin API.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THIS IS THE BRIDGE between your own phone-OTP login and Shopify's customer
 * records. A verified phone number becomes a real Shopify customer, so the
 * account dashboard reads genuine orders and addresses, and the admin sees a
 * customer the moment they sign up rather than only after their first order.
 *
 * It exists because the Customer Account API could not be used: it requires
 * Shopify's own hosted login page, and the brief was to keep the existing
 * modal. The trade-off, worth remembering: Shopify does NOT consider these
 * customers logged in, so checkout will still ask them to identify themselves
 * unless the cart's `buyerIdentity` is prefilled — see lib/shopify/cart.ts.
 *
 * ⚠ EVERY FUNCTION HERE MUST BE CALLED ONLY AFTER OTP VERIFICATION. There is
 * no authorisation inside these calls — `getCustomerByPhone` will happily
 * return anyone's record for any number. The gate is the verified session,
 * and it lives in the route handler.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** Shopify stores Indian mobiles in E.164; this codebase stores ten digits. */
const e164 = (phone: string) => `+91${phone}`;

export interface AdminCustomer {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

const CUSTOMER_FIELDS = `
  id
  firstName
  lastName
  email
  phone
`;

/* eslint-disable @typescript-eslint/no-explicit-any */
const toCustomer = (c: any): AdminCustomer => ({
  id: c.id,
  firstName: c.firstName ?? undefined,
  lastName: c.lastName ?? undefined,
  email: c.email ?? undefined,
  phone: c.phone ?? undefined,
});

/**
 * Find a customer by phone.
 *
 * The search query is quoted because a `+` is a reserved character in
 * Shopify's search syntax — unquoted, `phone:+919876543210` is parsed as a
 * prefix operator and silently matches nothing, which reads as "the customer
 * does not exist" and results in a duplicate being created on every sign-in.
 */
export async function getCustomerByPhone(
  phone: string
): Promise<AdminCustomer | null> {
  const data = await adminFetch<{ customers: { edges: { node: any }[] } }>(
    `query FindCustomer($query: String!) {
      customers(first: 1, query: $query) {
        edges { node { ${CUSTOMER_FIELDS} } }
      }
    }`,
    { query: `phone:"${e164(phone)}"` }
  );

  const node = data.customers.edges[0]?.node;
  return node ? toCustomer(node) : null;
}

/**
 * Find the customer for a verified phone, creating one if needed.
 *
 * Called once per sign-in. The lookup comes first so a returning customer
 * keeps their order history rather than accumulating a new record each time.
 */
export async function findOrCreateCustomer(
  phone: string
): Promise<AdminCustomer> {
  const existing = await getCustomerByPhone(phone);
  if (existing) return existing;

  const data = await adminFetch<{
    customerCreate: { customer: any; userErrors: { field: string[]; message: string }[] };
  }>(
    `mutation CreateCustomer($input: CustomerInput!) {
      customerCreate(input: $input) {
        customer { ${CUSTOMER_FIELDS} }
        userErrors { field message }
      }
    }`,
    {
      input: {
        phone: e164(phone),
        /* No email at creation. Shopify allows a phone-only customer, and the
           setup screen collects the email immediately afterwards — inventing
           a placeholder here would put a fake address on a real record and
           into any email Shopify sends. */
      },
    }
  );

  const { customer, userErrors } = data.customerCreate;

  if (userErrors?.length) {
    /* A "phone has already been taken" error here means the search above
       missed a record that does exist — almost always a formatting mismatch.
       Retrying the lookup is better than failing the sign-in. */
    const retry = await getCustomerByPhone(phone);
    if (retry) return retry;

    throw new Error(
      `customerCreate failed: ${userErrors.map((e) => e.message).join("; ")}`
    );
  }

  return toCustomer(customer);
}

/** Update the profile fields the account page owns. */
export async function updateCustomer(
  customerId: string,
  fields: { firstName?: string; lastName?: string; email?: string }
): Promise<AdminCustomer> {
  const data = await adminFetch<{
    customerUpdate: { customer: any; userErrors: { message: string }[] };
  }>(
    `mutation UpdateCustomer($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer { ${CUSTOMER_FIELDS} }
        userErrors { field message }
      }
    }`,
    { input: { id: customerId, ...fields } }
  );

  const { customer, userErrors } = data.customerUpdate;
  if (userErrors?.length) {
    throw new Error(
      `customerUpdate failed: ${userErrors.map((e) => e.message).join("; ")}`
    );
  }
  return toCustomer(customer);
}

export interface AdminOrder {
  id: string;
  name: string;
  processedAt: string;
  financialStatus?: string;
  fulfillmentStatus?: string;
  total: number;
  currency: string;
  lines: { title: string; quantity: number; image?: string; price: number }[];
}

/**
 * A customer's orders, newest first.
 *
 * Queried by customer ID rather than by the `customer.orders` connection so
 * the sort key can be applied — and because it fails loudly if the ID is
 * wrong, instead of returning an empty list that looks like "no orders yet".
 */
export async function getOrdersForCustomer(
  customerId: string
): Promise<AdminOrder[]> {
  const data = await adminFetch<{ customer: any }>(
    `query CustomerOrders($id: ID!) {
      customer(id: $id) {
        orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
          edges {
            node {
              id
              name
              processedAt
              displayFinancialStatus
              displayFulfillmentStatus
              currentTotalPriceSet { shopMoney { amount currencyCode } }
              lineItems(first: 20) {
                edges {
                  node {
                    title
                    quantity
                    image { url }
                    originalUnitPriceSet { shopMoney { amount } }
                  }
                }
              }
            }
          }
        }
      }
    }`,
    { id: customerId }
  );

  const edges = data.customer?.orders?.edges ?? [];

  return edges.map(({ node }: any) => ({
    id: node.id,
    name: node.name,
    processedAt: node.processedAt,
    financialStatus: node.displayFinancialStatus ?? undefined,
    fulfillmentStatus: node.displayFulfillmentStatus ?? undefined,
    total: Number(node.currentTotalPriceSet?.shopMoney?.amount ?? 0),
    currency: node.currentTotalPriceSet?.shopMoney?.currencyCode ?? "INR",
    lines: (node.lineItems?.edges ?? []).map((e: any) => ({
      title: e.node.title,
      quantity: e.node.quantity,
      image: e.node.image?.url,
      price: Number(e.node.originalUnitPriceSet?.shopMoney?.amount ?? 0),
    })),
  }));
}
