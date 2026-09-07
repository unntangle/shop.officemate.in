/**
 * Does the Storefront API still expose customer mutations?
 *
 *     npm run shopify:probe-customer
 *
 * WHY THIS EXISTS. The Admin API route is closed — a Dev Dashboard app issues
 * its token through OAuth, and there is no `shpat_` to copy. The remaining
 * way to create a Shopify customer from our own OTP login is the Storefront
 * API's `customerCreate`, using the public token we already have.
 *
 * But Shopify has been retiring exactly these mutations:
 * `customerAccessTokenCreate` was REMOVED in 2025-04, and the customer-scoped
 * Storefront mutations were deprecated in favour of the Customer Account API.
 * `customerCreate` may have gone with them.
 *
 * Guessing costs an afternoon. This asks the schema directly, against the
 * exact API version the app is configured for, and prints every customer
 * mutation that actually exists.
 */

const DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
const VERSION = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2026-01";

if (!DOMAIN || !TOKEN) {
  console.error(
    "\n  ✗ Storefront credentials are missing from .env.local.\n"
  );
  process.exitCode = 1;
} else {
  const res = await fetch(
    `https://${DOMAIN}/api/${VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": TOKEN,
      },
      /* Introspection rather than a trial mutation: it answers the question
         without creating a junk customer record that would then need
         deleting. */
      body: JSON.stringify({
        query: `{
          __schema {
            mutationType { fields { name isDeprecated deprecationReason } }
          }
        }`,
      }),
    }
  );

  if (!res.ok) {
    console.error(`\n  ✗ HTTP ${res.status} ${res.statusText}\n`);
    process.exitCode = 1;
  } else {
    const body = await res.json();

    if (body.errors) {
      console.error(
        `\n  ✗ ${body.errors.map((e) => e.message).join("; ")}\n` +
          "    Introspection may be disabled on this API version.\n"
      );
      process.exitCode = 1;
    } else {
      const fields = body.data.__schema.mutationType.fields;
      const customerFields = fields.filter((f) =>
        f.name.toLowerCase().includes("customer")
      );

      console.log(`\n  Storefront API ${VERSION} — customer mutations\n`);

      if (customerFields.length === 0) {
        console.log(
          "  ✗ NONE. Every customer mutation has been removed from this\n" +
            "    version. Creating a Shopify customer from our own login is\n" +
            "    not possible on the Storefront API.\n"
        );
      } else {
        for (const f of customerFields) {
          const flag = f.isDeprecated ? "  ⚠ DEPRECATED" : "";
          console.log(`    · ${f.name}${flag}`);
          if (f.deprecationReason) {
            console.log(`        ${f.deprecationReason}`);
          }
        }
        console.log("");
      }

      /* The cart mutation that attaches a buyer to an order. Even without
         customer creation, this is what prefills checkout and ties the order
         to the right person — so it is worth knowing either way. */
      const buyerIdentity = fields.find(
        (f) => f.name === "cartBuyerIdentityUpdate"
      );
      console.log(
        `  cartBuyerIdentityUpdate  ${buyerIdentity ? "✓ available" : "✗ missing"}\n`
      );
    }
  }
}
