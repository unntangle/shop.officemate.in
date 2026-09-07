/**
 * Diagnose customer login and update, outside the app.
 *
 *     npm run shopify:probe-update 7092747933
 *
 * WHY. `customerUpdate` keeps failing with a message that names TWO possible
 * causes — a missing `unauthenticated_write_customers` scope, and an invalid
 * customer access token — without saying which one actually failed. The scope
 * is visibly ticked in the admin, so the token is the likely culprit, but
 * "likely" has already cost us one wrong fix.
 *
 * This runs the exact sequence the app runs, printing each step, so the
 * failure point is unambiguous:
 *
 *   1. Log in as the customer with the derived password.
 *   2. Read the customer back with that token.
 *   3. Attempt a harmless update (sets firstName to its current value).
 *
 * If step 1 fails, the derived password or the customer state is wrong and
 * the token was never valid. If step 2 works but step 3 does not, it really
 * is the scope. Those need completely different fixes.
 *
 * It also reports WHICH token header is in use, since a private token that is
 * silently absent would explain nothing having changed.
 */

import { createHmac } from "node:crypto";

const DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const PUBLIC_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
const PRIVATE_TOKEN = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
const VERSION = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2026-01";
const PEPPER = process.env.OTP_PEPPER ?? "";

const phone = (process.argv[2] ?? "").replace(/\D/g, "").slice(-10);

if (!phone) {
  console.error("\n  Usage: npm run shopify:probe-update -- 7092747933\n");
  process.exitCode = 1;
} else if (!DOMAIN || (!PUBLIC_TOKEN && !PRIVATE_TOKEN) || !PEPPER) {
  console.error(
    "\n  ✗ Missing config. Need NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN, a Storefront\n" +
      "    token, and OTP_PEPPER in .env.local.\n"
  );
  process.exitCode = 1;
} else {
  /* Must match lib/shopify/customer-storefront.ts EXACTLY, or the login below
     fails for a reason that has nothing to do with the bug being chased. */
  const password =
    createHmac("sha256", PEPPER)
      .update(`customer:${phone}`)
      .digest("hex")
      .slice(0, 32) + "Aa1!";
  const email = `${phone}@phone.officemate.invalid`;

  const usingPrivate = Boolean(PRIVATE_TOKEN);
  const authHeader = usingPrivate
    ? { "Shopify-Storefront-Private-Token": PRIVATE_TOKEN }
    : { "X-Shopify-Storefront-Access-Token": PUBLIC_TOKEN };

  const call = async (query, variables) => {
    const res = await fetch(
      `https://${DOMAIN}/api/${VERSION}/graphql.json`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ query, variables }),
      }
    );
    return { status: res.status, body: await res.json() };
  };

  console.log(`\n  Store    ${DOMAIN}  (API ${VERSION})`);
  console.log(
    `  Token    ${usingPrivate ? "PRIVATE (server-side)" : "PUBLIC"}\n`
  );
  console.log(`  Customer ${email}\n`);

  /* ---------------------------------------------------------- 1. log in */
  const login = await call(
    `mutation Login($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken { accessToken expiresAt }
        customerUserErrors { code field message }
      }
    }`,
    { input: { email, password } }
  );

  if (login.body.errors) {
    console.error(
      `  ✗ STEP 1 login — API error:\n    ${login.body.errors
        .map((e) => e.message)
        .join("\n    ")}\n`
    );
    process.exitCode = 1;
  } else {
    const payload = login.body.data.customerAccessTokenCreate;
    const userErrors = payload.customerUserErrors ?? [];

    if (!payload.customerAccessToken) {
      console.error("  ✗ STEP 1 login — no token returned.");
      for (const e of userErrors) {
        console.error(`      [${e.code}] ${e.message}`);
      }
      console.error(
        "\n    UNIDENTIFIED_CUSTOMER means the password does not match \u2014 almost\n" +
          "    always because OTP_PEPPER changed since the customer was created,\n" +
          "    since the password is derived from it.\n" +
          "\n    CUSTOMER_DISABLED means the account exists but was never\n" +
          "    activated. A customer created through the Storefront API can\n" +
          "    land in that state, and it cannot log in until activated.\n"
      );
      process.exitCode = 1;
    } else {
      const token = payload.customerAccessToken.accessToken;
      console.log(`  ✓ STEP 1 login    token issued, expires ${payload.customerAccessToken.expiresAt}`);

      /* ------------------------------------------------------- 2. read */
      const read = await call(
        `query C($t: String!) {
          customer(customerAccessToken: $t) { id firstName email }
        }`,
        { t: token }
      );

      if (read.body.errors || !read.body.data.customer) {
        console.error(
          `  ✗ STEP 2 read \u2014 ${
            read.body.errors?.map((e) => e.message).join("; ") ??
            "customer came back null"
          }\n`
        );
        process.exitCode = 1;
      } else {
        console.log(
          `  ✓ STEP 2 read     ${read.body.data.customer.email}`
        );

        /* ---------------------------------------------------- 3. update */
        const update = await call(
          `mutation U($t: String!, $c: CustomerUpdateInput!) {
            customerUpdate(customerAccessToken: $t, customer: $c) {
              customer { id firstName }
              customerAccessToken { accessToken }
              customerUserErrors { code field message }
            }
          }`,
          { t: token, c: { firstName: read.body.data.customer.firstName || "Test" } }
        );

        if (update.body.errors) {
          console.error(
            `\n  ✗ STEP 3 update \u2014 API error:\n    ${update.body.errors
              .map((e) => e.message)
              .join("\n    ")}`
          );
          console.error(
            "\n    Login and read BOTH worked with this same token, so the token\n" +
              "    is valid. That leaves the scope: `unauthenticated_write_customers`\n" +
              "    is not actually in effect on the token being used.\n" +
              (usingPrivate
                ? "    The PRIVATE token is in use \u2014 private tokens carry their own\n" +
                  "    permission set, granted when the token was created. Ticking the\n" +
                  "    scope afterwards does not retro-fit it: generate a NEW private\n" +
                  "    token from Headless \u2192 Credentials \u2192 Rotate, and use that.\n"
                : "    Re-check the Customers scopes under Headless \u2192 Storefront API\n" +
                  "    permissions, and make sure the change was SAVED.\n")
          );
          process.exitCode = 1;
        } else {
          const errs = update.body.data.customerUpdate.customerUserErrors ?? [];
          if (errs.length) {
            console.error(`\n  ✗ STEP 3 update \u2014 rejected:`);
            for (const e of errs) console.error(`      [${e.code}] ${e.message}`);
            process.exitCode = 1;
          } else {
            console.log(`  ✓ STEP 3 update   customerUpdate succeeded\n`);
            console.log(
              "  Everything works from here, so the failure is in how the app\n" +
                "  obtains or stores the token \u2014 not in Shopify's config.\n"
            );
          }
        }
      }
    }
  }
}
