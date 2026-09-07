import { NextResponse, type NextRequest } from "next/server";
import { issueCode } from "@/lib/otp/service";
import { assertProductionStore } from "@/lib/otp/store";
import { sendOtpEmail } from "@/lib/otp/email";
import { getSession } from "@/lib/session";
import { findPhoneByEmail } from "@/lib/profile-store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Send a code to verify an email during setup.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * REQUIRES AN EXISTING PHONE SESSION. This is not a second way to sign in —
 * it confirms an email belongs to someone who has ALREADY proved a phone
 * number. Without that check it would be an open endpoint for mailing codes
 * to arbitrary addresses, which is both an abuse vector and a way to get the
 * sending domain blacklisted.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The code is keyed by EMAIL rather than phone, so a person mid-setup can
 * hold a phone code and an email code at once without one overwriting the
 * other. `lib/otp/service.ts` takes an opaque identifier, which is what makes
 * that possible without changing it.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "You're signed out. Sign in and try again." },
      { status: 401 }
    );
  }

  try {
    assertProductionStore();
  } catch (err) {
    console.error("[email-otp]", err);
    return NextResponse.json(
      { ok: false, error: "Verification is temporarily unavailable." },
      { status: 503 }
    );
  }

  let email: string;
  try {
    const body = (await request.json()) as { email?: string };
    email = (body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid email address." },
      { status: 400 }
    );
  }

  /* Checked BEFORE sending, not after verifying. Mailing a code to an address
     that will be rejected on submission wastes the person's time and teaches
     them the form is broken. */
  const owner = await findPhoneByEmail(email);
  if (owner && owner !== session.phone) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "That email is already linked to another account. Sign in with " +
          "that number, or use a different email.",
      },
      { status: 409 }
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const issued = await issueCode(email, ip);

  if (!issued.ok) {
    if (issued.reason === "not_configured") {
      console.error("[email-otp] OTP_PEPPER is missing or too short.");
      return NextResponse.json(
        { ok: false, error: "Verification is temporarily unavailable." },
        { status: 503 }
      );
    }
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

  /* Simulation is allowed wherever the phone OTP allows it, so one dev setup
     covers both channels rather than needing Resend configured just to test
     a name form. */
  const allowSimulated = process.env.NODE_ENV !== "production";
  const sent = await sendOtpEmail(email, issued.code, allowSimulated);

  if (!sent.ok) {
    console.error("[email-otp] delivery failed:", sent.error);
    return NextResponse.json(
      { ok: false, error: "We couldn't send the code. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    expiresInSeconds: issued.expiresInSeconds,
    /* Same rule as the phone code: shown on screen only while delivery is
       simulated AND this is not production. See the note in
       app/api/auth/otp/request/route.ts. */
    ...(sent.logged && allowSimulated ? { devCode: issued.code } : {}),
  });
}
