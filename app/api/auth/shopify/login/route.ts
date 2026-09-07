import { NextResponse, type NextRequest } from "next/server";
import {
  buildAuthorizeUrl,
  customerAuthConfigured,
} from "@/lib/shopify/customer-auth";

/**
 * Start sign-in.
 *
 * A route handler rather than a server action, because this has to be a
 * top-level browser NAVIGATION. Shopify's authorization endpoint refuses to
 * load in an iframe and cannot be fetched cross-origin, so the browser itself
 * must travel there — which also rules out doing this from inside the modal.
 *
 * `origin` comes from the incoming request rather than a configured constant,
 * so the same code works on localhost, a Vercel preview and production
 * without a per-environment variable. The trade-off is that every origin has
 * to be registered as a callback URL in the Shopify admin.
 */
export async function GET(request: NextRequest) {
  if (!customerAuthConfigured) {
    /* Not an error page. Customer accounts are optional configuration, and a
       storefront with none should send people home rather than show a stack
       trace for a feature that was never switched on. */
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const origin = request.nextUrl.origin;
    return NextResponse.redirect(await buildAuthorizeUrl(origin));
  } catch (err) {
    console.error("[auth] could not start sign-in", err);
    return NextResponse.redirect(new URL("/?auth=unavailable", request.url));
  }
}
