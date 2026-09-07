/**
 * Shopify Storefront API client.
 *
 * A fetch wrapper, deliberately — not a GraphQL library. The storefront makes
 * two or three queries in total; a client library would add a dependency, a
 * cache layer and a code-generation step to save perhaps thirty lines.
 *
 * ⚠ SERVER ONLY. Never import this from a `"use client"` file. It reads
 * environment variables and is called from lib/catalog.server.ts, which feeds
 * client components through CatalogProvider.
 */

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
/**
 * Server-side Storefront token.
 *
 * PREFERRED WHEN PRESENT, because every call in this codebase is made from a
 * route handler or a server action — never from the browser. A private token
 * carries the same scopes without being published in the client bundle, and
 * some stores refuse customer WRITES on a public token regardless of the
 * scope checkbox, which shows up as reads working and `customerUpdate`
 * failing with "access denied".
 *
 * ⚠ DESPITE THE `shpat_` PREFIX THIS IS NOT THE ADMIN TOKEN. It is the
 * Storefront private token from Headless → Credentials, it uses a different
 * header, and it talks to a different API. Do not put it in a NEXT_PUBLIC_
 * variable and do not send it from a browser — Shopify rejects private-token
 * requests that carry an Origin header.
 */
const privateToken = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
const version = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2026-01";

/**
 * Whether Shopify is configured at all.
 *
 * The storefront must keep working before the store is populated, so this is
 * the switch: no credentials means lib/catalog.server.ts serves the local
 * catalogue instead. That keeps `npm run dev` working on a fresh clone with
 * no .env.local, and means a missing variable in production degrades to the
 * old behaviour rather than to an error page.
 */
export const shopifyConfigured = Boolean(domain && (token || privateToken));

export class ShopifyError extends Error {}

/**
 * Run a Storefront API query.
 *
 * CACHED IN PRODUCTION, NEVER IN DEVELOPMENT.
 *
 * The catalogue changes when someone edits a product, not per request, so
 * serving it from the Next data cache turns most page loads into zero network
 * calls. Five minutes is a deliberate middle: long enough that a burst of
 * traffic costs one Shopify call, short enough that a price correction is
 * live before anyone rings up about it.
 *
 * ⚠ THAT SAME CACHE IS A TRAP WHILE BUILDING THE CATALOGUE. Change stock or a
 * price in Shopify, reload, and the OLD value comes back for up to five
 * minutes — which reads exactly like "the integration is broken". You go and
 * check the mapper, the scopes and the token, and every one of them is fine.
 *
 * So in development the cache is off and every request hits Shopify. Dev
 * traffic is one person pressing reload, so it costs nothing and the feedback
 * is immediate.
 *
 * `variables` is typed loosely because callers pass literal objects and the
 * shape is dictated by each query.
 */
export async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
  revalidateSeconds = 300
): Promise<T> {
  if (!shopifyConfigured) {
    throw new ShopifyError(
      "Shopify is not configured. Set NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN and " +
        "NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN in .env.local."
    );
  }

  /* See the note above: no caching at all in dev, five minutes in prod. */
  const isDev = process.env.NODE_ENV === "development";

  /* One token or the other, never both — Shopify rejects a request carrying
     both headers. The private one wins when present because every call here
     is server-side. */
  const authHeader: Record<string, string> = privateToken
    ? { "Shopify-Storefront-Private-Token": privateToken }
    : { "X-Shopify-Storefront-Access-Token": token as string };

  const res = await fetch(`https://${domain}/api/${version}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
    },
    body: JSON.stringify({ query, variables }),
    ...(isDev
      ? { cache: "no-store" as const }
      : { next: { revalidate: revalidateSeconds } }),
  });

  if (!res.ok) {
    /* The status carries the diagnosis: 401/403 is the wrong token, 404 is
       the wrong domain or API version. `npm run shopify:check` explains both
       in detail, so point at it rather than repeating the guidance here. */
    throw new ShopifyError(
      `Storefront API returned ${res.status} ${res.statusText}. ` +
        `Run \`npm run shopify:check\` to diagnose.`
    );
  }

  const body = (await res.json()) as {
    data?: T;
    errors?: { message: string }[];
  };

  if (body.errors?.length) {
    /* GraphQL errors arrive with HTTP 200, so this is not redundant with the
       check above. An "access denied" here is a missing Storefront API scope,
       not a bad token. */
    throw new ShopifyError(
      `Storefront API errors: ${body.errors.map((e) => e.message).join("; ")}`
    );
  }

  if (!body.data) throw new ShopifyError("Storefront API returned no data.");

  return body.data;
}
