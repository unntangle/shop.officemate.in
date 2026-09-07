import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * The signed-in session.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * A SIGNED, httpOnly COOKIE — NOT localStorage.
 *
 * The old flow kept a profile object in localStorage and treated its presence
 * as proof of identity. That was defensible while it guarded a wishlist in
 * the visitor's own browser. It is not defensible now: this session will
 * unlock a Shopify customer record — order history, saved addresses, phone
 * and email — and anything the browser can write, a visitor can forge by
 * typing into devtools.
 *
 * So the payload is signed with an HMAC the browser never sees, and marked
 * httpOnly so page scripts cannot read it either. A tampered cookie fails the
 * signature check and is treated as signed out.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * THE KEY IS DERIVED FROM OTP_PEPPER, not stored separately.
 *
 * Reusing a secret for two purposes is normally a mistake, because a flaw in
 * one use can compromise the other. It is safe here because the pepper is
 * never used directly: an HMAC with a fixed label produces a key that cannot
 * be worked backwards, and a different label yields an unrelated key. That is
 * standard domain separation, and it avoids a second environment variable
 * that would inevitably be set in one place and forgotten in another —
 * which fails as "signed out on production only", the sort of bug that eats a
 * day.
 */

const PEPPER = process.env.OTP_PEPPER ?? "";

const SESSION_COOKIE = "officemate_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

const key = () => createHmac("sha256", PEPPER).update("session-v1").digest();

export interface Session {
  /** Verified 10-digit Indian mobile, without country code. */
  phone: string;
  /** Shopify customer GID, once linked. */
  customerId?: string;
  /**
   * Storefront customer access token.
   *
   * Held in the SIGNED, httpOnly session cookie rather than anywhere the page
   * can reach, because it reads and writes that customer's orders, addresses
   * and profile. It is derived fresh on each sign-in, so losing it costs a
   * re-login and nothing more.
   *
   * Shopify expires these after about 60 days; the session cookie is 30, so
   * the cookie always dies first and the token cannot outlive it.
   */
  customerToken?: string;
  issuedAt: number;
}

const b64 = (buf: Buffer) => buf.toString("base64url");

function sign(payload: string) {
  return b64(createHmac("sha256", key()).update(payload).digest());
}

/**
 * Start a session. Called ONLY after a code has verified.
 *
 * Any other caller is a bug: this function is the single point where an
 * unauthenticated visitor becomes an authenticated one.
 */
export async function createSession(session: Omit<Session, "issuedAt">) {
  const payload = b64(
    Buffer.from(JSON.stringify({ ...session, issuedAt: Date.now() }))
  );

  (await cookies()).set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

/**
 * The current session, or null.
 *
 * Returns null for anything suspicious rather than throwing — a forged or
 * stale cookie should render a signed-out page, not an error.
 */
export async function getSession(): Promise<Session | null> {
  if (!PEPPER) return null;

  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);

  /* Constant-time, and length-checked first because timingSafeEqual throws on
     a length mismatch rather than returning false. */
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return null;
  }

  try {
    return JSON.parse(
      Buffer.from(payload, "base64url").toString()
    ) as Session;
  } catch {
    return null;
  }
}

/** Attach the Shopify customer to an existing session, keeping it signed. */
export async function attachCustomer(
  customerId: string,
  customerToken?: string
) {
  const current = await getSession();
  if (!current) return;
  await createSession({ phone: current.phone, customerId, customerToken });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}
