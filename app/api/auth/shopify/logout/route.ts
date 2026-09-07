import { NextResponse, type NextRequest } from "next/server";
import {
  buildLogoutUrl,
  clearSession,
  customerAuthConfigured,
} from "@/lib/shopify/customer-auth";

/**
 * Sign out.
 *
 * BOTH SIDES, and that is the whole point of redirecting rather than just
 * deleting cookies. Clearing ours alone leaves the customer signed in AT
 * SHOPIFY, so the next sign-in skips the login screen and drops them straight
 * back into the same account — which reads as "log out did nothing", and on a
 * shared machine means the next person inherits the session.
 */
export async function GET(request: NextRequest) {
  await clearSession();

  if (!customerAuthConfigured) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    return NextResponse.redirect(await buildLogoutUrl(request.nextUrl.origin));
  } catch (err) {
    /* Our cookies are already gone, so the local session has ended either
       way. Failing to reach Shopify's logout is worth logging, not worth
       stranding the customer on an error page. */
    console.error("[auth] could not reach Shopify logout", err);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
