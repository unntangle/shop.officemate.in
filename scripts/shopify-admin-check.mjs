/**
 * Shopify Admin API connectivity check.
 *
 *     npm run shopify:admin-check
 *
 * The Storefront check proved the catalogue connection. This proves the other
 * one — the token that creates customers from verified phone numbers.
 *
 * It separates the failures that look identical from the outside: no token
 * set, a token the API rejects, a token missing the scopes, and a token that
 * works. A sign-in that "succeeds but creates no customer" can be any of the
 * first three, and the app cannot tell you which because it deliberately
 * swallows the error rather than locking out someone who proved their phone.
 *
 * READ-ONLY. It queries the shop name and counts customers; it creates
 * nothing.
 */

const DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const VERSION = process.env.SHOPIFY_ADMIN_API_VERSION ?? "2026-07";

class CheckFailed extends Error {}
const fail = (msg) => {
  throw new CheckFailed(msg);
};

async function main() {
  if (!DOMAIN) fail("NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN is not set in .env.local");

  if (!TOKEN) {
    fail(
      "SHOPIFY_ADMIN_TOKEN is not set in .env.local.\n\n" +
        "    This is the most common cause of 'login works but no customer\n" +
        "    appears in Shopify'. Without it the app signs the person in and\n" +
        "    skips the Shopify step entirely.\n\n" +
        "    The variable must be named exactly SHOPIFY_ADMIN_TOKEN, and the\n" +
        "    dev server must be restarted after adding it — Next reads env\n" +
        "    files at boot only."
    );
  }

  const endpoint = `https://${DOMAIN}/admin/api/${VERSION}/graphql.json`;
  console.log(`\n  Endpoint  ${endpoint}`);

  let res;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN,
      },
      body: JSON.stringify({
        query: `{
          shop { name myshopifyDomain }
          customers(first: 5, sortKey: CREATED_AT, reverse: true) {
            edges { node { id phone email createdAt } }
          }
        }`,
      }),
    });
  } catch (err) {
    fail(`Could not reach Shopify.\n    ${err.message}`);
  }

  if (res.status === 401) {
    fail(
      "401 — Shopify rejected the token.\n\n" +
        "    Either it is not an Admin API token, or it has been revoked.\n" +
        "    App automation tokens are issued under App settings → App\n" +
        "    automation token. Note that a Customer Account API client SECRET\n" +
        "    is not an Admin token and will fail exactly like this."
    );
  }

  if (res.status === 403) {
    fail(
      "403 — the token is valid but lacks the required scopes.\n\n" +
        "    Needs read_customers, write_customers and read_orders. Scopes are\n" +
        "    set on the app VERSION, and a new version must be released before\n" +
        "    they take effect."
    );
  }

  if (!res.ok) fail(`Unexpected HTTP ${res.status} ${res.statusText}`);

  const body = await res.json();

  if (body.errors) {
    /* The Admin API reports a missing scope as a GraphQL error with HTTP 200,
       naming the field rather than the scope — so this is spelled out. */
    const messages = Array.isArray(body.errors)
      ? body.errors.map((e) => e.message).join("; ")
      : JSON.stringify(body.errors);
    fail(
      `Shopify returned errors:\n    ${messages}\n\n` +
        "    An 'access denied' naming a field is a missing scope, not a bad\n" +
        "    token. Check read_customers is on the released app version."
    );
  }

  const shop = body.data?.shop;
  const customers = body.data?.customers?.edges ?? [];

  console.log(`  ✓ Connected to "${shop?.name}" (${shop?.myshopifyDomain})`);
  console.log(`  ✓ read_customers works\n`);

  console.log(`  Most recent customers  ${customers.length}`);
  if (customers.length === 0) {
    console.log(
      "    (none yet — sign in through the site, then run this again)"
    );
  }
  for (const { node } of customers) {
    console.log(
      `    · ${(node.phone ?? node.email ?? "no contact").padEnd(20)} ${node.createdAt}`
    );
  }
  console.log("");
}

try {
  await main();
} catch (err) {
  if (err instanceof CheckFailed) {
    console.error(`\n  ✗ ${err.message}\n`);
    process.exitCode = 1;
  } else {
    throw err;
  }
}
