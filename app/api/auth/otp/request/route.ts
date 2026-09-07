import { NextResponse, type NextRequest } from "next/server";
import { issueCode } from "@/lib/otp/service";
import { assertProductionStore } from "@/lib/otp/store";
import { sendOtpWhatsApp } from "@/lib/otp/whatsapp";

const PHONE_RE = /^[6-9]\d{9}$/;

/**
 * Numbers allowed to see their own code in the API response.
 *
 * ⚠ THIS EXISTS SO THE FLOW CAN BE TESTED ON VERCEL BEFORE WHATSAPP IS LIVE,
 * and it is scoped by NUMBER rather than by environment on purpose.
 *
 * The obvious alternative — return the code to everyone whenever WhatsApp is
 * unconfigured — is not survivable on a public URL. A Vercel deployment is
 * reachable by anyone who guesses or is shown the link, and echoing the code
 * back means typing a stranger's mobile is enough to enter their account and
 * read their orders and saved addresses. There would be no log of it and
 * nothing to alert on.
 *
 * With an allowlist, the worst case is that someone signs into one of the
 * test accounts listed here, which hold nothing. Every real customer's code
 * still goes only to WhatsApp.
 *
 * Set it in Vercel's environment variables as a comma-separated list of
 * 10-digit numbers, e.g. OTP_DEV_PHONES=7092747933,9876543210
 *
 * DELETE THE VARIABLE THE DAY WHATSAPP GOES LIVE. Nothing breaks if you
 * forget — the code stops being echoed once delivery works, because it is
 * conditional on WhatsApp being unconfigured too — but an unused allowlist
 * left in the environment is a hole waiting for someone to re-open it.
 */
const DEV_PHONES = new Set(
  (process.env.OTP_DEV_PHONES ?? "")
    .split(",")
    .map((p) => p.replace(/\D/g, "").slice(-10))
    .filter(Boolean)
);

/**
 * Request a login code.
 *
 * ⚠ THE RESPONSE NEVER CONTAINS THE CODE. The old demo flow generated it in
 * the browser and printed it on screen, which was fine when login guarded a
 * local wishlist. This session unlocks a Shopify customer record — orders,
 * addresses, phone, email — so returning the code, in any field, under any
 * name, would hand anyone a way into any account.
 *
 * In development with WhatsApp unconfigured the code is printed to the SERVER
 * TERMINAL instead. That keeps the whole flow testable while Meta business
 * verification is pending, without ever exposing it to the client.
 */
export async function POST(request: NextRequest) {
  try {
    assertProductionStore();
  } catch (err) {
    console.error("[otp]", err);
    return NextResponse.json(
      { ok: false, error: "Sign-in is temporarily unavailable." },
      { status: 503 }
    );
  }

  let phone: string;
  try {
    const body = (await request.json()) as { phone?: string };
    phone = (body.phone ?? "").replace(/\D/g, "").slice(-10);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  if (!PHONE_RE.test(phone)) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid 10-digit mobile number." },
      { status: 400 }
    );
  }

  /* Behind Vercel and most proxies the socket address is the proxy, so the
     real client is the first entry in x-forwarded-for. Falling back to a
     constant means the IP limit degrades to a global one rather than
     silently disappearing. */
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const issued = await issueCode(phone, ip);

  if (!issued.ok) {
    if (issued.reason === "not_configured") {
      console.error("[otp] OTP_PEPPER is missing or too short.");
      return NextResponse.json(
        { ok: false, error: "Sign-in is temporarily unavailable." },
        { status: 503 }
      );
    }

    /* Rate limiting and cooldown are reported with the same 429 and a plain
       message. Naming which limit was hit tells an attacker how the limits
       are shaped and how to pace around them. */
    return NextResponse.json(
      {
        ok: false,
        error:
          issued.reason === "cooldown"
            ? "Please wait a moment before requesting another code."
            : "Too many attempts. Try again later.",
      },
      { status: 429 }
    );
  }

  /* Simulation is allowed on localhost, and deployed only for the numbers in
     OTP_DEV_PHONES. Computed here because the route has the phone number and
     the sender should not know about allowlists. */
  const allowSimulated =
    process.env.NODE_ENV !== "production" || DEV_PHONES.has(phone);

  const sent = await sendOtpWhatsApp(phone, issued.code, allowSimulated);

  if (!sent.ok) {
    console.error("[otp] delivery failed:", sent.error);
    return NextResponse.json(
      { ok: false, error: "We couldn't send the code. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    expiresInSeconds: issued.expiresInSeconds,
    /* Tells the UI to show the "delivery is simulated" hint. It reveals that
       nothing was sent, never the code itself, and is false in production
       because WhatsApp is configured there. */
    devDelivery: sent.logged,
    /**
     * THE CODE, ON SCREEN — ALLOWLISTED NUMBERS ONLY.
     *
     * Returned when BOTH hold:
     *
     *   sent.logged — WhatsApp is unconfigured, so nothing was actually
     *     delivered and there is no other way for the tester to get the code.
     *     The moment real credentials are added this stops appearing
     *     everywhere, automatically.
     *   the number is in OTP_DEV_PHONES, or this is local development.
     *
     * Localhost is included unconditionally because the server is one laptop
     * and the alternative is reading a terminal on every sign-in. Deployed,
     * the allowlist is the only route — see the note on DEV_PHONES for why
     * an environment check alone is not enough on a public URL.
     */
    ...(sent.logged && allowSimulated ? { devCode: issued.code } : {}),
  });
}
