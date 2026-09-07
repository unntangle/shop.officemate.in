/**
 * Shopify Admin API client.
 *
 * ⚠ SERVER ONLY, AND MORE DANGEROUS THAN THE STOREFRONT TOKEN.
 *
 * The Storefront token is public by design and exposes a deliberately narrow,
 * read-mostly surface. This one carries `read_customers`, `write_customers`
 * and `read_orders` across the ENTIRE store — every customer, every order,
 * not just the person browsing. It must never appear in a client bundle, a
 * `NEXT_PUBLIC_` variable, or a response body.
 *
 * Every caller of this module runs in a route handler, behind a verified
 * session. Nothing here should ever be reachable from a page component.
 */

const DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const VERSION = process.env.SHOPIFY_ADMIN_API_VERSION ?? "2026-07";

export const adminConfigured = Boolean(DOMAIN && TOKEN);

export class AdminApiError extends Error {}

export async function adminFetch<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  if (!adminConfigured) {
    throw new AdminApiError(
      "Admin API is not configured. Set SHOPIFY_ADMIN_TOKEN in .env.local."
    );
  }

  const res = await fetch(
    `https://${DOMAIN}/admin/api/${VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN as string,
      },
      body: JSON.stringify({ query, variables }),
      /* Never cached. Every call here is about one specific person, and a
         cached customer lookup could serve one shopper another's record. */
      cache: "no-store",
    }
  );

  if (res.status === 401 || res.status === 403) {
    throw new AdminApiError(
      "Admin API rejected the token. Check SHOPIFY_ADMIN_TOKEN and that the " +
        "app has read_customers, write_customers and read_orders."
    );
  }

  if (!res.ok) {
    throw new AdminApiError(`Admin API returned ${res.status} ${res.statusText}`);
  }

  const body = (await res.json()) as {
    data?: T;
    errors?: { message: string }[];
  };

  if (body.errors?.length) {
    throw new AdminApiError(
      body.errors.map((e) => e.message).join("; ")
    );
  }

  if (!body.data) throw new AdminApiError("Admin API returned no data.");
  return body.data;
}
