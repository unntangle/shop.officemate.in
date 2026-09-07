import { shopifyFetch, shopifyConfigured } from "@/lib/shopify/client";
import type { Address } from "@/types";

/**
 * Customers, via the STOREFRONT API.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THIS IS THE BRIDGE between our own phone-OTP login and Shopify's customer
 * records. A verified phone becomes a real Shopify customer, so the account
 * dashboard reads genuine orders and addresses, and the admin sees a customer
 * at signup rather than only after a first order.
 *
 * WHY THE STOREFRONT API AND NOT THE ADMIN API. The Admin route needs a
 * `shpat_` token, and Shopify retired admin-created custom apps on 1 January
 * 2026. A Dev Dashboard app issues its token through the OAuth install
 * handshake instead, and there is no token to copy from the dashboard — so
 * getting one would mean implementing OAuth for a single store we own. The
 * Storefront API does the same job with the public token we already have.
 *
 * ⚠ THESE MUTATIONS BELONG TO LEGACY CUSTOMER ACCOUNTS, WHICH ARE DEPRECATED.
 * Shopify deprecated them in February 2026 with a sunset date still to be
 * announced. They are present and undeprecated in 2026-01 — verified against
 * this store's own schema with `npm run shopify:probe-customer`, not assumed.
 * Re-run that probe before any API version bump. When they do go, the
 * replacement is the Customer Account API and Shopify's hosted login page,
 * which is a UX change, not just a code change. Plan it; do not be surprised
 * by it.
 *
 * ⚠ EVERY FUNCTION HERE MUST BE CALLED ONLY AFTER OTP VERIFICATION. There is
 * no authorisation inside these calls. The gate is the verified session in
 * the route handler.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * A NOTE ON THE PASSWORD BELOW. Shopify requires one on every customer, and
 * our shoppers never see or use it — they authenticate by OTP. It is derived
 * deterministically from the phone and OTP_PEPPER so the same number always
 * yields the same password, which is what lets us fetch an access token for a
 * returning customer without storing anything.
 */

import { createHmac } from "node:crypto";

const PEPPER = process.env.OTP_PEPPER ?? "";

/** Shopify stores Indian mobiles in E.164; this codebase stores ten digits. */
const e164 = (phone: string) => `+91${phone}`;

/**
 * The customer's Shopify password.
 *
 * DERIVED, NEVER STORED, AND NEVER SHOWN. It exists only because Shopify's
 * customer model demands one. Deriving it from the pepper means:
 *
 *   - the same number always produces the same password, so a returning
 *     customer can be logged in without us keeping a password table;
 *   - it is unguessable without the pepper, which never leaves the server;
 *   - rotating the pepper invalidates every derived password at once, which
 *     is a real consequence — see the note in .env.local about not changing
 *     it once live.
 *
 * The `Aa1!` suffix satisfies Shopify's complexity rule, which rejects a
 * plain hex string.
 */
const derivePassword = (phone: string) =>
  createHmac("sha256", PEPPER).update(`customer:${phone}`).digest("hex").slice(0, 32) +
  "Aa1!";

export const customerApiConfigured = shopifyConfigured && PEPPER.length >= 16;

export interface ShopCustomer {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  /** Storefront customer access token, for reads and updates. */
  accessToken?: string;
}

const CUSTOMER_FIELDS = `
  id
  firstName
  lastName
  email
  phone
`;

/* eslint-disable @typescript-eslint/no-explicit-any */
const toCustomer = (c: any, accessToken?: string): ShopCustomer => ({
  id: c.id,
  firstName: c.firstName ?? undefined,
  lastName: c.lastName ?? undefined,
  email: c.email ?? undefined,
  phone: c.phone ?? undefined,
  accessToken,
});

/**
 * A customer access token for a number we have already verified.
 *
 * Returns null when no customer exists yet — the caller creates one. It does
 * NOT distinguish "no such customer" from "wrong password", because with a
 * derived password the second cannot happen unless the pepper changed.
 */
async function login(phone: string): Promise<string | null> {
  const data = await shopifyFetch<{ customerAccessTokenCreate: any }>(
    `mutation Login($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken { accessToken expiresAt }
        customerUserErrors { code message }
      }
    }`,
    {
      input: { email: pseudoEmail(phone), password: derivePassword(phone) },
    },
    /* Never cached: this is an authentication call. */
    0
  );

  return (
    data.customerAccessTokenCreate?.customerAccessToken?.accessToken ?? null
  );
}

/**
 * The email Shopify records for a phone-only signup.
 *
 * ⚠ SHOPIFY REQUIRES A UNIQUE EMAIL on every customer, and our shoppers sign
 * up with a phone number alone. So a placeholder is unavoidable — but it is
 * chosen to be obviously synthetic rather than plausible, so nobody in the
 * admin mistakes it for a real address and emails it.
 *
 * The setup screen collects the real address immediately afterwards and
 * `updateCustomer` replaces this. A record still carrying an @phone.officemate
 * address is one that never completed setup, which is useful to be able to
 * see at a glance.
 */
const pseudoEmail = (phone: string) => `${phone}@phone.officemate.invalid`;

/**
 * Find or create the customer for a verified phone.
 *
 * Login first, because a returning customer must keep their order history
 * rather than accumulating a record per sign-in.
 */
export async function findOrCreateCustomer(
  phone: string
): Promise<ShopCustomer> {
  const existingToken = await login(phone);
  if (existingToken) {
    const customer = await getCustomer(existingToken);
    if (customer) return customer;
  }

  const created = await shopifyFetch<{ customerCreate: any }>(
    `mutation CreateCustomer($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer { ${CUSTOMER_FIELDS} }
        customerUserErrors { code field message }
      }
    }`,
    {
      input: {
        email: pseudoEmail(phone),
        phone: e164(phone),
        password: derivePassword(phone),
        /* No marketing consent by default. Opting someone into email at
           signup because they logged in is not consent, and in India it is
           also a poor way to treat a first interaction. */
        acceptsMarketing: false,
      },
    },
    0
  );

  const errors = created.customerCreate?.customerUserErrors ?? [];

  if (errors.length > 0) {
    /* TAKEN means the record exists but login failed — which with a derived
       password means the pepper changed since it was created. Surface it
       clearly rather than looping. */
    if (errors.some((e: any) => e.code === "TAKEN")) {
      throw new Error(
        `A Shopify customer already exists for ${phone} but the derived ` +
          `password no longer matches. OTP_PEPPER has probably changed since ` +
          `the record was created.`
      );
    }
    throw new Error(
      `customerCreate failed: ${errors.map((e: any) => e.message).join("; ")}`
    );
  }

  const token = await login(phone);
  return toCustomer(created.customerCreate.customer, token ?? undefined);
}

/**
 * Create the Shopify customer with the details from setup.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * CALLED AT SETUP COMPLETION, NOT AT SIGN-IN, and the timing is the whole
 * point.
 *
 * Creating at sign-in meant creating from a phone number alone — Shopify
 * demands a unique email, so the record got a synthetic
 * `@phone.officemate.invalid` placeholder and no name. Fixing it afterwards
 * needs `customerUpdate`, which needs a customer access token, which a
 * passwordless store will not issue to a session it did not authenticate. So
 * the placeholder was permanent: the admin showed a nameless customer with a
 * fake address forever.
 *
 * Waiting until the person has given us a name and a real email means the
 * record is CORRECT THE FIRST TIME, and never needs updating.
 *
 * The cost: someone who signs in and abandons setup has no Shopify customer.
 * That is the right trade — we have nothing to record about them, and if they
 * later check out, Shopify creates the customer from the checkout details
 * anyway.
 * ─────────────────────────────────────────────────────────────────────────
 */
export async function createCustomerWithProfile(fields: {
  phone: string;
  firstName?: string;
  lastName?: string;
  email: string;
}): Promise<ShopCustomer | null> {
  const data = await shopifyFetch<{ customerCreate: any }>(
    `mutation CreateCustomer($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer { ${CUSTOMER_FIELDS} }
        customerUserErrors { code field message }
      }
    }`,
    {
      input: {
        email: fields.email,
        phone: e164(fields.phone),
        firstName: fields.firstName,
        lastName: fields.lastName || undefined,
        /* Required by Shopify and never used by anyone. Sign-in is our OTP;
           this password exists only because the mutation demands one. */
        password: derivePassword(fields.phone),
        /* No marketing consent by default. Opting someone in because they
           completed a profile is not consent. */
        acceptsMarketing: false,
      },
    },
    0
  );

  const errors = data.customerCreate?.customerUserErrors ?? [];

  if (errors.length > 0) {
    /* TAKEN means a customer already exists on that email or phone — most
       often from a previous checkout, which is a GOOD outcome: the order
       history is already attached to it. Returning null lets the caller carry
       on rather than blocking setup over a record that exists. */
    if (errors.some((e: any) => e.code === "TAKEN")) {
      console.warn(
        `[shopify] customer already exists for ${fields.email} or ${fields.phone}`
      );
      return null;
    }
    throw new Error(
      `customerCreate failed: ${errors.map((e: any) => e.message).join("; ")}`
    );
  }

  return toCustomer(data.customerCreate.customer);
}

/** The customer behind an access token. */
export async function getCustomer(
  accessToken: string
): Promise<ShopCustomer | null> {
  const data = await shopifyFetch<{ customer: any }>(
    `query Customer($token: String!) {
      customer(customerAccessToken: $token) { ${CUSTOMER_FIELDS} }
    }`,
    { token: accessToken },
    0
  );

  return data.customer ? toCustomer(data.customer, accessToken) : null;
}

/**
 * Update the profile fields the account page owns.
 *
 * ⚠ SHOPIFY INVALIDATES THE ACCESS TOKEN WHEN THE EMAIL CHANGES, and returns
 * a replacement in `customerAccessToken` on the mutation payload. Ignoring it
 * leaves the session holding a dead token: the save appears to work, and the
 * NEXT request fails with "Requires valid customer access token" — which
 * looks like an unrelated bug an hour later.
 *
 * So the new token is returned to the caller, which must write it back into
 * the session. `saveProfileAction` does exactly that.
 */
export async function updateCustomer(
  accessToken: string,
  fields: { firstName?: string; lastName?: string; email?: string }
): Promise<{ customer: ShopCustomer; newToken?: string }> {
  const data = await shopifyFetch<{ customerUpdate: any }>(
    `mutation UpdateCustomer($token: String!, $customer: CustomerUpdateInput!) {
      customerUpdate(customerAccessToken: $token, customer: $customer) {
        customer { ${CUSTOMER_FIELDS} }
        customerAccessToken { accessToken expiresAt }
        customerUserErrors { code message }
      }
    }`,
    { token: accessToken, customer: fields },
    0
  );

  const errors = data.customerUpdate?.customerUserErrors ?? [];
  if (errors.length > 0) {
    throw new Error(
      `customerUpdate failed: ${errors.map((e: any) => e.message).join("; ")}`
    );
  }

  const newToken: string | undefined =
    data.customerUpdate?.customerAccessToken?.accessToken ?? undefined;

  return {
    customer: toCustomer(data.customerUpdate.customer, newToken ?? accessToken),
    newToken,
  };
}

export interface ShopOrder {
  id: string;
  name: string;
  processedAt: string;
  financialStatus?: string;
  fulfillmentStatus?: string;
  total: number;
  currency: string;
  lines: { title: string; quantity: number; image?: string; price: number }[];
}

/** A customer's orders, newest first. */
export async function getOrders(accessToken: string): Promise<ShopOrder[]> {
  const data = await shopifyFetch<{ customer: any }>(
    `query Orders($token: String!) {
      customer(customerAccessToken: $token) {
        orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
          edges {
            node {
              id
              orderNumber
              processedAt
              financialStatus
              fulfillmentStatus
              totalPrice { amount currencyCode }
              lineItems(first: 20) {
                edges {
                  node {
                    title
                    quantity
                    variant {
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
    }`,
    { token: accessToken },
    0
  );

  const edges = data.customer?.orders?.edges ?? [];

  return edges.map(({ node }: any) => ({
    id: node.id,
    name: `#${node.orderNumber}`,
    processedAt: node.processedAt,
    financialStatus: node.financialStatus ?? undefined,
    fulfillmentStatus: node.fulfillmentStatus ?? undefined,
    total: Number(node.totalPrice?.amount ?? 0),
    currency: node.totalPrice?.currencyCode ?? "INR",
    lines: (node.lineItems?.edges ?? []).map((e: any) => ({
      title: e.node.title,
      quantity: e.node.quantity,
      image: e.node.variant?.image?.url,
      price: Number(e.node.variant?.price?.amount ?? 0),
    })),
  }));
}

/* ---------------------------------------------------------------- addresses

   Field names match Shopify's exactly — see the note on `Address` in
   types/index.ts — so there is no mapper here, only a whitelist of the fields
   Shopify's MailingAddressInput accepts. `id` and `isDefault` are ours and
   must not be sent: `id` identifies the record and `isDefault` is a pointer
   on the CUSTOMER, set by its own mutation.
*/

const ADDRESS_FIELDS = `
  id
  firstName
  lastName
  company
  address1
  address2
  city
  province
  zip
  country
  phone
`;

const toAddressInput = (a: Address) => ({
  firstName: a.firstName || undefined,
  lastName: a.lastName || undefined,
  company: a.company || undefined,
  address1: a.address1,
  address2: a.address2 || undefined,
  city: a.city,
  province: a.province || undefined,
  zip: a.zip,
  country: a.country || "India",
  phone: a.phone || undefined,
});

const fromNode = (n: any, defaultId?: string): Address => ({
  id: n.id,
  firstName: n.firstName ?? undefined,
  lastName: n.lastName ?? undefined,
  company: n.company ?? undefined,
  address1: n.address1 ?? "",
  address2: n.address2 ?? undefined,
  city: n.city ?? "",
  province: n.province ?? undefined,
  zip: n.zip ?? "",
  country: n.country ?? "India",
  phone: n.phone ?? undefined,
  isDefault: Boolean(defaultId && n.id === defaultId),
});

/**
 * Saved addresses, with the default flagged.
 *
 * `defaultAddress` is fetched in the SAME query rather than separately,
 * because the flag is derived by comparing ids — two round trips would leave
 * a window where the list is known and the default is not, and the UI would
 * render every address as non-default for a frame.
 */
export async function getAddresses(accessToken: string): Promise<Address[]> {
  const data = await shopifyFetch<{ customer: any }>(
    `query Addresses($token: String!) {
      customer(customerAccessToken: $token) {
        defaultAddress { id }
        addresses(first: 20) { edges { node { ${ADDRESS_FIELDS} } } }
      }
    }`,
    { token: accessToken },
    0
  );

  const defaultId = data.customer?.defaultAddress?.id;
  return (data.customer?.addresses?.edges ?? []).map((e: any) =>
    fromNode(e.node, defaultId)
  );
}

/**
 * Create or update, chosen by whether the id is Shopify's.
 *
 * An id that does not start with `gid://` was generated locally for a draft
 * that has never been saved, so it identifies nothing server-side and must
 * create rather than update — passing it to `customerAddressUpdate` would
 * fail with an opaque "address not found".
 */
export async function saveAddress(
  accessToken: string,
  address: Address
): Promise<Address> {
  const isNew = !address.id.startsWith("gid://");
  const input = toAddressInput(address);

  const data = isNew
    ? await shopifyFetch<any>(
        `mutation CreateAddress($token: String!, $address: MailingAddressInput!) {
          customerAddressCreate(customerAccessToken: $token, address: $address) {
            customerAddress { ${ADDRESS_FIELDS} }
            customerUserErrors { field message }
          }
        }`,
        { token: accessToken, address: input },
        0
      )
    : await shopifyFetch<any>(
        `mutation UpdateAddress($token: String!, $id: ID!, $address: MailingAddressInput!) {
          customerAddressUpdate(customerAccessToken: $token, id: $id, address: $address) {
            customerAddress { ${ADDRESS_FIELDS} }
            customerUserErrors { field message }
          }
        }`,
        { token: accessToken, id: address.id, address: input },
        0
      );

  const payload = isNew ? data.customerAddressCreate : data.customerAddressUpdate;
  const errors = payload?.customerUserErrors ?? [];

  if (errors.length > 0) {
    throw new Error(errors.map((e: any) => e.message).join("; "));
  }

  const saved: Address = fromNode(payload.customerAddress);

  /* Default is a SEPARATE mutation because Shopify stores it as a pointer on
     the customer, not a flag on the address. Done after the save so a brand
     new address has an id to point at. */
  if (address.isDefault) {
    await setDefaultAddress(accessToken, saved.id);
    saved.isDefault = true;
  }

  return saved;
}

export async function setDefaultAddress(accessToken: string, id: string) {
  const data = await shopifyFetch<any>(
    `mutation SetDefault($token: String!, $id: ID!) {
      customerDefaultAddressUpdate(customerAccessToken: $token, addressId: $id) {
        customerUserErrors { field message }
      }
    }`,
    { token: accessToken, id },
    0
  );

  const errors = data.customerDefaultAddressUpdate?.customerUserErrors ?? [];
  if (errors.length > 0) {
    throw new Error(errors.map((e: any) => e.message).join("; "));
  }
}

export async function deleteAddress(accessToken: string, id: string) {
  const data = await shopifyFetch<any>(
    `mutation DeleteAddress($token: String!, $id: ID!) {
      customerAddressDelete(customerAccessToken: $token, id: $id) {
        deletedCustomerAddressId
        customerUserErrors { field message }
      }
    }`,
    { token: accessToken, id },
    0
  );

  const errors = data.customerAddressDelete?.customerUserErrors ?? [];
  if (errors.length > 0) {
    throw new Error(errors.map((e: any) => e.message).join("; "));
  }
}
