import { NextResponse, type NextRequest } from "next/server";
import { verifyCode } from "@/lib/otp/service";
import { createSession } from "@/lib/session";

const PHONE_RE = /^[6-9]\d{9}$/;
const CODE_RE = /^\d{6}$/;

/**
 * Verify a code and start a session.
 *
 * THIS IS THE ONE PLACE an unauthenticated visitor becomes an authenticated
 * one. Order matters and is deliberate:
 *
 *   1. Verify the code. Nothing else happens until this passes.
 *   2. Find or create the Shopify customer for that number.
 *   3. Issue the signed session cookie.
 *
 * Creating the customer BEFORE verification would let anyone populate the
 * store's customer list by typing numbers they do not own. Issuing the
 * session before the customer lookup would leave a signed-in visitor with no
 * customer attached, and every downstream call guessing what that means.
 */
export async function POST(request: NextRequest) {
  let phone: string;
  let code: string;

  try {
    const body = (await request.json()) as { phone?: string; code?: string };
    phone = (body.phone ?? "").replace(/\D/g, "").slice(-10);
    code = (body.code ?? "").replace(/\D/g, "");
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  if (!PHONE_RE.test(phone) || !CODE_RE.test(code)) {
    return NextResponse.json(
      { ok: false, error: "That code doesn't match. Try again." },
      { status: 400 }
    );
  }

  const result = await verifyCode(phone, code);

  if (!result.ok) {
    /* 401 for every failure, and a message that does not distinguish a wrong
       code from an expired one. The difference is not useful to an honest
       customer — they request a new code either way — and telling an attacker
       whether a code is still live is a free hint. `too_many_attempts` is
       named because the customer genuinely needs to know their code is dead
       and a new one is required. */
    return NextResponse.json(
      {
        ok: false,
        error:
          result.reason === "too_many_attempts"
            ? "Too many attempts. Request a new code."
            : "That code doesn't match. Try again.",
      },
      { status: 401 }
    );
  }

  /**
   * NO SHOPIFY CUSTOMER IS CREATED HERE, deliberately.
   *
   * At this point all we know is a phone number, and Shopify requires a
   * unique EMAIL on every customer — so creating now means creating with a
   * synthetic placeholder and no name, which can never be corrected on a
   * passwordless store (see createCustomerWithProfile). The record would stay
   * nameless and fake-addressed in the admin forever.
   *
   * The customer is created instead when setup completes and we have a real
   * name and email. See `saveProfileAction` in lib/auth-actions.ts.
   */
  await createSession({ phone });

  return NextResponse.json({ ok: true });
}
