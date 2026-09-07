import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { otpStore } from "@/lib/otp/store";

/**
 * OTP issue and verification.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THIS IS A SECURITY BOUNDARY, NOT A FORMALITY.
 *
 * It used to gate a wishlist held in the visitor's own browser, where a
 * bypass got an attacker access to their own data. It now gates a Shopify
 * customer record: order history, saved addresses, phone and email. Someone
 * who can guess or brute-force a code reads a stranger's home address.
 *
 * Four things follow, and none of them are optional:
 *
 *   1. THE CODE NEVER LEAVES THE SERVER. Only a hash is stored, and the
 *      response says nothing about it. The old flow returned the code to the
 *      browser to display — fine for a demo, fatal here.
 *   2. FIVE ATTEMPTS, THEN THE CODE IS BURNED. Six digits is a million
 *      combinations; at unlimited attempts that is minutes of scripted
 *      guessing, and the honest customer never notices.
 *   3. RATE LIMITED PER NUMBER AND PER IP. Per number alone lets one
 *      attacker walk a list of numbers; per IP alone lets a botnet target
 *      one. Both are needed, and they are also what stops this being a free
 *      WhatsApp message pump billed to the client.
 *   4. CONSTANT-TIME COMPARISON. A plain `===` on a hash leaks position
 *      information through timing. Cheap to do correctly.
 * ─────────────────────────────────────────────────────────────────────────
 */

const CODE_TTL_SECONDS = 5 * 60;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

/* Per hour. Deliberately generous for a real person and useless to a script:
   a genuine customer requests one or two codes, never eight. */
const MAX_REQUESTS_PER_PHONE = 5;
const MAX_REQUESTS_PER_IP = 20;
const RATE_WINDOW_SECONDS = 60 * 60;

/**
 * A server-side secret mixed into every hash.
 *
 * Without it, a stolen store dump is trivially reversible: there are only a
 * million possible codes, so an attacker precomputes every hash in seconds.
 * The pepper lives only in the environment, so a leaked Redis is not enough
 * on its own.
 */
const PEPPER = process.env.OTP_PEPPER ?? "";

export const otpConfigured = PEPPER.length >= 16;

const hash = (code: string, phone: string) =>
  createHash("sha256").update(`${code}:${phone}:${PEPPER}`).digest("hex");

const codeKey = (phone: string) => `otp:code:${phone}`;
const phoneRateKey = (phone: string) => `otp:rate:phone:${phone}`;
const ipRateKey = (ip: string) => `otp:rate:ip:${ip}`;

interface StoredCode {
  hash: string;
  attempts: number;
  issuedAt: number;
}

export type IssueResult =
  | { ok: true; code: string; expiresInSeconds: number }
  | { ok: false; reason: "rate_limited" | "cooldown" | "not_configured" };

/**
 * Issue a code.
 *
 * Returns the plaintext code to the CALLER — the route handler — which passes
 * it to the WhatsApp sender and must never put it in the HTTP response.
 * Returning it here rather than sending from inside keeps this module free of
 * any delivery concern, so the same logic serves the email fallback later.
 */
export async function issueCode(
  phone: string,
  ip: string
): Promise<IssueResult> {
  if (!otpConfigured) return { ok: false, reason: "not_configured" };

  /* Cooldown before rate limits, so a quick double-tap on "Resend" is not
     counted against the hourly allowance. */
  const existingRaw = await otpStore.get(codeKey(phone));
  if (existingRaw) {
    const existing = JSON.parse(existingRaw) as StoredCode;
    const age = (Date.now() - existing.issuedAt) / 1000;
    if (age < RESEND_COOLDOWN_SECONDS) return { ok: false, reason: "cooldown" };
  }

  const byPhone = await otpStore.increment(
    phoneRateKey(phone),
    RATE_WINDOW_SECONDS
  );
  const byIp = await otpStore.increment(ipRateKey(ip), RATE_WINDOW_SECONDS);

  if (byPhone > MAX_REQUESTS_PER_PHONE || byIp > MAX_REQUESTS_PER_IP) {
    return { ok: false, reason: "rate_limited" };
  }

  /* `randomInt`, not `Math.random()`. The latter is predictable enough that
     an attacker who watches a few codes can narrow the next one. */
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");

  const record: StoredCode = {
    hash: hash(code, phone),
    attempts: 0,
    issuedAt: Date.now(),
  };

  await otpStore.set(
    codeKey(phone),
    JSON.stringify(record),
    CODE_TTL_SECONDS
  );

  return { ok: true, code, expiresInSeconds: CODE_TTL_SECONDS };
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "expired" | "mismatch" | "too_many_attempts" };

/**
 * Check a code.
 *
 * A correct code is DELETED immediately on success, so it cannot be replayed
 * if the response is intercepted or the customer hits back.
 */
export async function verifyCode(
  phone: string,
  code: string
): Promise<VerifyResult> {
  const raw = await otpStore.get(codeKey(phone));

  /* No record covers both "expired" and "never issued". They are reported
     identically on purpose — distinguishing them would confirm to an attacker
     whether a given number has an account. */
  if (!raw) return { ok: false, reason: "expired" };

  const record = JSON.parse(raw) as StoredCode;

  if (record.attempts >= MAX_ATTEMPTS) {
    await otpStore.delete(codeKey(phone));
    return { ok: false, reason: "too_many_attempts" };
  }

  const candidate = Buffer.from(hash(code, phone), "hex");
  const expected = Buffer.from(record.hash, "hex");

  /* Lengths always match here (both SHA-256), but timingSafeEqual throws on a
     mismatch rather than returning false, so it is checked first. */
  const matches =
    candidate.length === expected.length &&
    timingSafeEqual(candidate, expected);

  if (!matches) {
    record.attempts += 1;
    /* Re-saved with the REMAINING lifetime, not a fresh TTL — otherwise a
       wrong guess would extend the window the code stays valid for. */
    const remaining = Math.max(
      1,
      CODE_TTL_SECONDS - Math.floor((Date.now() - record.issuedAt) / 1000)
    );
    await otpStore.set(codeKey(phone), JSON.stringify(record), remaining);

    return {
      ok: false,
      reason:
        record.attempts >= MAX_ATTEMPTS ? "too_many_attempts" : "mismatch",
    };
  }

  await otpStore.delete(codeKey(phone));
  return { ok: true };
}
