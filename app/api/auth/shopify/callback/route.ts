import { NextResponse, type NextRequest } from "next/server";
import { consumeState, exchangeCode } from "@/lib/shopify/customer-auth";

/**
 * Return leg of the OAuth flow.
 *
 * Shopify sends the customer back here with `code` and `state`. We verify the
 * state, swap the code for tokens, and land them in their account.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  /* Shopify reports refusals in the query string, not as an HTTP error. The
     common one is `login_required`, which simply means the customer backed
     out of the login screen — that is a decision, not a failure, so it goes
     home quietly rather than to an error page. */
  const error = params.get("error");
  if (error) {
    if (error !== "login_required" && error !== "access_denied") {
      console.error("[auth] authorization failed", error, params.get("error_description"));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  const code = params.get("code");
  const state = params.get("state");

  /* CSRF check. Without it, an attacker can hand someone a callback URL
     carrying their own authorization code and sign the victim into the
     attacker's account — where anything the victim then saves, including an
     address, belongs to the attacker. */
  if (!code || !(await consumeState(state))) {
    console.warn("[auth] callback rejected: missing code or state mismatch");
    return NextResponse.redirect(new URL("/?auth=failed", request.url));
  }

  try {
    await exchangeCode(code, request.nextUrl.origin);
  } catch (err) {
    console.error("[auth] token exchange failed", err);
    return NextResponse.redirect(new URL("/?auth=failed", request.url));
  }

  /* Straight to the account area, matching where the old OTP flow landed
     people. `redirect` here is a fresh navigation, so the cookies just set
     are present on the next request. */
  return NextResponse.redirect(new URL("/account", request.url));
}
