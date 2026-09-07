import { NextResponse, type NextRequest } from "next/server";
import { verifyCode } from "@/lib/otp/service";
import { attachCustomer, getSession } from "@/lib/session";
import { createCustomerWithProfile } from "@/lib/shopify/customer-storefront";
import { findPhoneByEmail, saveProfile } from "@/lib/profile-store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CODE_RE = /^\d{6}$/;

/**
 * Verify the email code and complete setup.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE PROFILE IS SAVED HERE, NOT BEFORE. That ordering is the whole point.
 *
 * The name and email are held in the browser until the code checks out. Save
 * them earlier and an unverified address is on the account — and since the
 * Shopify customer is created from that address, an unverified typo becomes a
 * permanent Shopify record we cannot correct on a passwordless store.
 *
 * So: verify, then persist, then create the Shopify customer. A failed code
 * leaves nothing behind.
 * ─────────────────────────────────────────────────────────────────────────
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "You're signed out. Sign in and try again." },
      { status: 401 }
    );
  }

  let email: string;
  let code: string;
  let firstName: string;
  let lastName: string;

  try {
    const body = (await request.json()) as {
      email?: string;
      code?: string;
      firstName?: string;
      lastName?: string;
    };
    email = (body.email ?? "").trim().toLowerCase();
    code = (body.code ?? "").replace(/\D/g, "");
    firstName = (body.firstName ?? "").trim();
    lastName = (body.lastName ?? "").trim();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  if (!EMAIL_RE.test(email) || !CODE_RE.test(code) || firstName.length < 2) {
    return NextResponse.json(
      { ok: false, error: "That code doesn't match. Try again." },
      { status: 400 }
    );
  }

  /* Re-checked here as well as at request time. The two calls are seconds
     apart, but someone else could claim the address in between, and this is
     the point where it would become permanent. */
  const owner = await findPhoneByEmail(email);
  if (owner && owner !== session.phone) {
    return NextResponse.json(
      {
        ok: false,
        error: "That email is already linked to another account.",
      },
      { status: 409 }
    );
  }

  const result = await verifyCode(email, code);

  if (!result.ok) {
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

  const profile = await saveProfile(session.phone, {
    firstName,
    lastName,
    email,
  });

  /* The Shopify customer is created here, once, with a name and an email that
     have both been verified. See createCustomerWithProfile for why creating
     it any earlier produced a record that could never be corrected. */
  if (!session.customerId) {
    try {
      const customer = await createCustomerWithProfile({
        phone: session.phone,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email,
      });

      if (customer) {
        await attachCustomer(customer.id);
        await saveProfile(session.phone, { customerId: customer.id });
      } else {
        /**
         * `null` means Shopify already had a customer on this email, so ours
         * was NOT created and the admin still shows whatever name that record
         * was made with.
         *
         * ⚠ THIS CANNOT BE REPAIRED FROM HERE. `customerUpdate` requires a
         * customer access token, and a passwordless store will not issue one
         * to a session Shopify did not authenticate. `customerDelete` needs
         * the Admin API, which this build has no token for. So the Shopify
         * name is frozen at whatever it was first created with.
         *
         * It self-corrects at CHECKOUT — Shopify writes the name from the
         * checkout form onto the customer — so the mismatch only persists for
         * someone who has signed up and never ordered.
         *
         * Logged loudly rather than swallowed, because the previous version
         * of this was a quiet warning and the divergence was found by
         * comparing two screens by hand.
         */
        console.warn(
          `[shopify] NAME NOT SYNCED. A customer already exists for ${email}, ` +
            `so "${profile.firstName} ${profile.lastName ?? ""}".trim() was ` +
            `saved locally but NOT written to Shopify. The admin still shows ` +
            `the original name. Delete the customer in Shopify admin to ` +
            `recreate it, or let checkout overwrite it.`
        );
      }
    } catch (err) {
      /* Setup still succeeds. The details are verified and saved; a Shopify
         outage is not the customer's problem, and checkout creates the
         customer regardless. */
      console.error("[email-otp] could not create Shopify customer:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
