/**
 * Delete a local account.
 *
 *     npm run account:delete -- 7070707070
 *
 * Removes everything THIS APP stores about a phone number: the profile and
 * addresses in the profile store, any live OTP code, and the rate-limit
 * counters. Useful constantly while testing sign-up, because a half-created
 * account otherwise has to be cleared by hand or by restarting the dev
 * server.
 *
 * ⚠ IT DOES NOT TOUCH SHOPIFY. If a customer record was created for this
 * person — which happens when setup completed — delete it in the Shopify
 * admin too, or the next sign-up with the same email or phone fails with a
 * TAKEN error and the account cannot be recreated.
 *
 * ⚠ NOR DOES IT CLEAR THE BROWSER SESSION. The session cookie is signed and
 * self-contained, so deleting the profile leaves a signed-in visitor with no
 * profile — which sends them to setup, not to an error. Sign out in the
 * browser, or delete the `officemate_session` cookie, to finish the job.
 *
 * ⚠ AND IT ONLY WORKS AGAINST THE STORE THIS PROCESS CAN SEE. With no Upstash
 * credentials the profile store is an in-memory Map inside `next dev`, which
 * this separate Node process cannot reach — there is nothing to delete and
 * restarting the dev server clears it anyway. It is genuinely useful only
 * once UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set.
 */

const URL_ = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const phone = (process.argv[2] ?? "").replace(/\D/g, "").slice(-10);

if (!phone) {
  console.error("\n  Usage: npm run account:delete -- 7070707070\n");
  process.exitCode = 1;
} else if (!URL_ || !TOKEN) {
  console.log(
    `\n  No Upstash credentials in .env.local, so the profile store is\n` +
      `  in-memory inside the dev server. There is nothing for this script to\n` +
      `  delete.\n\n` +
      `  To clear the account:\n` +
      `    1. Restart \`npm run dev\`  (wipes the in-memory store)\n` +
      `    2. Delete the \`officemate_session\` cookie in DevTools\n` +
      `    3. Delete the customer in Shopify admin, if one was created\n`
  );
} else {
  const keys = [
    `profile:${phone}`,
    `otp:code:${phone}`,
    `otp:rate:phone:${phone}`,
  ];

  const res = await fetch(URL_, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["DEL", ...keys]),
  });

  if (!res.ok) {
    console.error(`\n  ✗ Upstash returned ${res.status}\n`);
    process.exitCode = 1;
  } else {
    const { result } = await res.json();
    console.log(
      `\n  ✓ Deleted ${result} key(s) for +91 ${phone}\n\n` +
        `  Still to do by hand:\n` +
        `    · Delete the customer in Shopify admin, if one exists\n` +
        `    · Sign out in the browser (the session cookie is self-contained)\n`
    );
  }
}
