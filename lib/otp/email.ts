/**
 * Email delivery for the setup verification code.
 *
 * Resend over plain fetch — no SDK, no dependency. One POST.
 *
 * WHY EMAIL IS EASY WHERE SMS WAS NOT: no DLT registration, no TRAI, no Meta
 * business verification. An API key and a verified sending domain, and it
 * works the same day. That is why the account setup screen can verify an
 * email today while the phone OTP still waits on Meta.
 */

const API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM ?? "Officemate <onboarding@resend.dev>";

export const emailConfigured = Boolean(API_KEY);

export type SendResult =
  | { ok: true; logged: boolean }
  | { ok: false; error: string };

/**
 * Send a verification code.
 *
 * WHEN NOT CONFIGURED the code goes to the SERVER TERMINAL and the send
 * reports success, so the whole flow is testable before a Resend account
 * exists — the same arrangement as the WhatsApp sender, and for the same
 * reason: a verification step that cannot be exercised locally is a
 * verification step nobody tests.
 *
 * `allowSimulated` is decided by the caller, exactly as in lib/otp/whatsapp.ts
 * — this module has no business knowing about environments or allowlists.
 */
export async function sendOtpEmail(
  email: string,
  code: string,
  allowSimulated = false
): Promise<SendResult> {
  if (!emailConfigured) {
    if (!allowSimulated) {
      return {
        ok: false,
        error: "Email is not configured. Set RESEND_API_KEY.",
      };
    }

    console.log(
      `\n  ┌──────────────────────────────────────────────\n` +
        `  │  EMAIL CODE for ${email}:  ${code}\n` +
        `  │  Resend not configured — development only\n` +
        `  └──────────────────────────────────────────────\n`
    );
    return { ok: true, logged: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        subject: `${code} is your Officemate verification code`,
        /* The code is in the SUBJECT as well as the body. Most mail clients
           show the subject in the notification, so it can be read without
           opening anything — which is most of what makes an emailed code
           tolerable next to an SMS. */
        html: `
          <div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <p style="margin:0 0 24px;font-size:15px;color:#2D2D2D">
              Use this code to confirm your email address:
            </p>
            <p style="margin:0 0 24px;font-size:32px;font-weight:700;letter-spacing:8px;color:#111">
              ${code}
            </p>
            <p style="margin:0;font-size:13px;line-height:1.6;color:#6B6B6B">
              It expires in five minutes. If you didn't ask for it, you can
              ignore this email — nothing has changed on your account.
            </p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[email] send failed ${res.status}: ${body}`);
      return { ok: false, error: `Email provider returned ${res.status}` };
    }

    return { ok: true, logged: false };
  } catch (err) {
    console.error("[email] send threw", err);
    return { ok: false, error: "Could not reach the email provider." };
  }
}
