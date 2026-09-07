/**
 * Shopify Storefront API connectivity check.
 *
 *     npm run shopify:check
 *
 * WHY THIS EXISTS. The credentials are pasted, the scopes are set, and there
 * is no way to tell whether any of it is right — because the store is empty,
 * so "no products" looks identical to "wrong token", "wrong domain" and
 * "wrong API version". This separates those cases before any adapter is
 * written against them.
 *
 * It asks for `shop { name }`, which every store answers regardless of
 * catalogue, then counts products and collections so you can watch the
 * catalogue fill up as you build it.
 *
 * A 404 IS AMBIGUOUS — wrong store handle and wrong API version both produce
 * one, and they need opposite fixes. So on a 404 this probes the bare domain
 * (a real store answers; an unknown handle 404s) and then tries other API
 * versions, and reports which of the two is actually wrong.
 *
 * Node 24 (see package.json engines) has fetch and --env-file built in, so
 * this needs no dependencies.
 */

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
const version = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2026-01";

/* Newest first. Shopify publishes quarterly and supports each for about a
   year, so the working one is usually near the top. */
const CANDIDATE_VERSIONS = [
  "2026-07",
  "2026-04",
  "2026-01",
  "2025-10",
  "2025-07",
];

/**
 * `process.exitCode` rather than `process.exit()`.
 *
 * `process.exit()` tears the process down while stdout still has buffered
 * writes, and on Windows that surfaces as
 * "Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)" — a libuv crash
 * printed after the real error, which looks far more alarming than the thing
 * it is reporting. Setting the code and returning lets Node drain and exit
 * cleanly.
 */
class CheckFailed extends Error {}
const fail = (msg) => {
  throw new CheckFailed(msg);
};

const QUERY = `{
  shop { name primaryDomain { url } }
  products(first: 250) { edges { node { handle productType } } }
  collections(first: 250) { edges { node { handle title } } }
}`;

const endpointFor = (v) => `https://${domain}/api/${v}/graphql.json`;

const ask = (v) =>
  fetch(endpointFor(v), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query: QUERY }),
  });

/** Does a store exist at this handle at all? Unknown handles 404. */
async function storeExists() {
  try {
    const res = await fetch(`https://${domain}/`, { redirect: "follow" });
    return res.status !== 404;
  } catch {
    return false;
  }
}

async function main() {
  if (!domain) fail("NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN is not set in .env.local");
  if (!token) fail("NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN is not set in .env.local");

  /* Format mistakes that produce confusing errors later: a scheme resolves to
     a nonsense URL, and a trailing slash gives a double slash that Shopify
     answers with a 404 rather than an explanation. */
  if (/^https?:\/\//.test(domain))
    fail(`Drop the https:// — the domain should read "your-store.myshopify.com", not "${domain}"`);
  if (domain.endsWith("/")) fail(`Drop the trailing slash from the domain: "${domain}"`);
  if (!domain.includes(".")) fail(`That is a store handle, not a domain. Use "${domain}.myshopify.com"`);

  console.log(`\n  Endpoint  ${endpointFor(version)}`);

  let res;
  try {
    res = await ask(version);
  } catch (err) {
    fail(`Could not reach Shopify. Check the domain spelling and your connection.\n    ${err.message}`);
  }

  if (res.status === 401 || res.status === 403)
    fail("Shopify rejected the token (401/403). Check you copied the STOREFRONT API token, not the Admin API token.");
  if (res.status === 429 || res.status === 430)
    fail("Rate limited. Wait a moment and run it again.");

  /* The ambiguous one. Work out WHICH half is wrong rather than making the
     reader guess between two very different fixes. */
  if (res.status === 404) {
    console.log("  … 404. Working out whether it is the domain or the version.\n");

    if (!(await storeExists())) {
      fail(
        `No Shopify store answers at "${domain}".\n\n` +
          `    The handle is wrong. Find the real one in your Shopify admin URL:\n` +
          `      admin.shopify.com/store/THIS-PART\n\n` +
          `    Then set NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=THIS-PART.myshopify.com\n` +
          `    Note it is often not the brand name — Shopify appends digits when\n` +
          `    a handle is already taken.`
      );
    }

    console.log(`  ✓ A store does exist at ${domain} — so the domain is fine.`);
    console.log(`  … Trying other API versions.\n`);

    for (const v of CANDIDATE_VERSIONS) {
      if (v === version) continue;
      const probe = await ask(v);
      if (probe.ok) {
        fail(
          `API version "${version}" is not valid for this store, but "${v}" is.\n\n` +
            `    Set this in .env.local:\n` +
            `      SHOPIFY_STOREFRONT_API_VERSION=${v}`
        );
      }
    }

    fail(
      `The store exists but no API version answered.\n\n` +
        `    That usually means the Headless channel (or a custom app with\n` +
        `    Storefront API access) has not been created yet, so there is no\n` +
        `    Storefront endpoint to talk to. Check:\n` +
        `      Settings → Apps and sales channels → Headless`
    );
  }

  if (!res.ok) fail(`Unexpected HTTP ${res.status} ${res.statusText}`);

  const body = await res.json();

  if (body.errors?.length) {
    console.error("\n  ✗ Shopify returned errors:");
    for (const e of body.errors) console.error(`    • ${e.message}`);
    console.error(
      "\n    An 'access denied' here is a missing scope, not a bad token —\n" +
        "    check Storefront API permissions in the Headless channel.\n"
    );
    process.exitCode = 1;
    return;
  }

  const shop = body.data?.shop;
  const products = body.data?.products?.edges ?? [];
  const collections = body.data?.collections?.edges ?? [];

  console.log(`  ✓ Connected to "${shop?.name}" (${shop?.primaryDomain?.url})`);

  console.log(`\n  Collections  ${collections.length}`);
  for (const { node } of collections) console.log(`    · ${node.title}  (${node.handle})`);

  console.log(`\n  Products     ${products.length}`);

  /* Handle AND product type per product, not just a type tally.

     Both are load-bearing and both fail silently. The handle is the URL —
     get it wrong and /products/zenpro 404s after the migration. The product
     type is the series, which drives the circle rail and the filter drawer;
     a product with none is reachable only under "All".

     Shopify shows neither on the product list page, so without printing them
     here you would not discover either mistake until the storefront was
     already reading from Shopify. */
  for (const { node } of products) {
    const type = node.productType || "\u2717 NO PRODUCT TYPE SET";
    console.log(`    · ${node.handle.padEnd(24)} ${type}`);
  }

  const untyped = products.filter(({ node }) => !node.productType).length;
  if (untyped > 0) {
    console.log(
      `\n  ⚠ ${untyped} product${untyped === 1 ? " has" : "s have"} no Product type.\n` +
        `    Set it to the SERIES name — "Executive Series", "Task Series" —\n` +
        `    matching Category.subcategories in constants/categories.ts exactly.\n` +
        `\n    In Shopify: open the product → Product organization (right side)\n` +
        `    → the free-text "Product type" box. NOT "Category", which is\n` +
        `    Shopify's own taxonomy and a different field entirely.`
    );
  }

  if (products.length === 0) {
    console.log(
      "\n  Store is empty — expected for now. The credentials work;\n" +
        "  there is simply nothing to fetch yet.\n"
    );
  } else {
    console.log("");
  }
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
