import { cookies } from "next/headers";

/**
 * Customer Account API — OAuth.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THIS REPLACES THE DEMO OTP FLOW. Identity moves to Shopify: the customer
 * signs in on a Shopify-hosted page, and we receive a token that reads their
 * real orders, addresses and profile. AuthProvider's `localStorage` profile
 * becomes a cache of that, not the source.
 *
 * The reason it has to be Shopify's login page and cannot be our modal: the
 * session Shopify issues is what carries through to CHECKOUT. A custom form
 * can collect a phone number, but it cannot produce that session, so the
 * shopper would identify themselves twice and the order would attach to
 * whichever email they typed at checkout rather than to their account.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * ENDPOINTS ARE DISCOVERED, NOT HARDCODED. Shopify publishes an OpenID
 * configuration per shop, and its own docs now say to read it rather than
 * building URLs by hand — the authorization host has changed before and the
 * shop-id form differs between stores. One fetch, cached for the process.
 *
 * CONFIDENTIAL CLIENT, NOT PUBLIC. A Headless-channel client is confidential:
 * it authenticates with a client secret and receives a REFRESH token, so a
 * session survives beyond the access token's short life. Public clients use
 * PKCE, get no refresh token, and have to re-run the whole flow silently.
 * Since this runs entirely in Next route handlers, the secret is safe here
 * and the confidential flow is both simpler and better behaved.
 *
 * ⚠ CALLBACK URLS MUST BE HTTPS, INCLUDING IN DEVELOPMENT. Shopify rejects
 * `http://localhost:3000/...` when registering a web client. Run dev over TLS
 * (`next dev --experimental-https`) and register
 * `https://localhost:3000/api/auth/shopify/callback`, or use a tunnel. This
 * catches everyone once; it is not a misconfiguration on your side.
 */

const CLIENT_ID = process.env.SHOPIFY_CUSTOMER_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CUSTOMER_CLIENT_SECRET;
const SHOP_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;

/**
 * Scopes.
 *
 * `openid` and `email` identify the customer; `customer-account-api:full` is
 * what actually grants order, address and profile reads. Without the last one
 * the flow succeeds and every query comes back empty, which is a confusing
 * way to discover a missing scope.
 */
const SCOPES = "openid email customer-account-api:full";

const ACCESS_COOKIE = "officemate_customer_token";
const REFRESH_COOKIE = "officemate_customer_refresh";
const STATE_COOKIE = "officemate_oauth_state";

export const customerAuthConfigured = Boolean(
  CLIENT_ID && CLIENT_SECRET && SHOP_DOMAIN
);

interface Discovery {
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint: string;
}

let discoveryCache: Discovery | null = null;

/**
 * The shop's OpenID configuration.
 *
 * Cached in module scope for the life of the server process. It changes
 * roughly never, and re-fetching it on every sign-in adds a round trip to the
 * one flow where latency is most visible.
 */
export async function discover(): Promise<Discovery> {
  if (discoveryCache) return discoveryCache;

  const res = await fetch(
    `https://${SHOP_DOMAIN}/.well-known/openid-configuration`,
    { cache: "force-cache" }
  );
  if (!res.ok) {
    throw new Error(
      `Could not read OpenID configuration from ${SHOP_DOMAIN} (${res.status}). ` +
        `Check the store domain and that new customer accounts are enabled.`
    );
  }

  discoveryCache = (await res.json()) as Discovery;
  return discoveryCache;
}

/**
 * Build the URL that starts the flow.
 *
 * `state` is a random value stored in an httpOnly cookie and checked on the
 * way back. It is not optional politeness — without it, an attacker can hand
 * someone a callback URL carrying their own authorization code and log the
 * victim into the attacker's account.
 */
export async function buildAuthorizeUrl(origin: string) {
  const { authorization_endpoint } = await discover();

  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();

  (await cookies()).set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    /* Ten minutes. Long enough to read an email and type a code, short
       enough that an abandoned attempt cannot be replayed later. */
    maxAge: 600,
    path: "/",
  });

  const url = new URL(authorization_endpoint);
  url.searchParams.set("client_id", CLIENT_ID as string);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", `${origin}/api/auth/shopify/callback`);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);

  return url.toString();
}

export async function consumeState(received: string | null) {
  const jar = await cookies();
  const expected = jar.get(STATE_COOKIE)?.value;
  jar.delete(STATE_COOKIE);
  return Boolean(expected && received && expected === received);
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

/** Exchange the authorization code for tokens, and store them. */
export async function exchangeCode(code: string, origin: string) {
  const { token_endpoint } = await discover();

  const res = await fetch(token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID as string,
      client_secret: CLIENT_SECRET as string,
      redirect_uri: `${origin}/api/auth/shopify/callback`,
      code,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Token exchange failed (${res.status}). The usual cause is a redirect_uri ` +
        `that does not exactly match a registered callback URL.`
    );
  }

  const token = (await res.json()) as TokenResponse;
  await storeTokens(token);
  return token;
}

async function storeTokens(token: TokenResponse) {
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";

  jar.set(ACCESS_COOKIE, token.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    /* 60s short of Shopify's own expiry, so a request cannot be issued with a
       token that expires while it is in flight. */
    maxAge: Math.max(60, token.expires_in - 60),
    path: "/",
  });

  if (token.refresh_token) {
    jar.set(REFRESH_COOKIE, token.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }
}

/**
 * A usable access token, refreshing if the short-lived one has lapsed.
 *
 * Returns null rather than throwing when there is no session — signed out is
 * an ordinary state, and callers render a sign-in prompt rather than an error.
 */
export async function getAccessToken(): Promise<string | null> {
  if (!customerAuthConfigured) return null;

  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  if (access) return access;

  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (!refresh) return null;

  try {
    const { token_endpoint } = await discover();
    const res = await fetch(token_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: CLIENT_ID as string,
        client_secret: CLIENT_SECRET as string,
        refresh_token: refresh,
      }),
    });
    if (!res.ok) {
      /* A rejected refresh token is a dead session, not a transient fault.
         Clearing it stops every subsequent request retrying the same failure. */
      await clearSession();
      return null;
    }
    const token = (await res.json()) as TokenResponse;
    await storeTokens(token);
    return token.access_token;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

/**
 * Shopify's logout URL.
 *
 * Ending our cookies alone leaves the customer signed in AT SHOPIFY, so the
 * next sign-in skips the login screen entirely and looks like the logout
 * silently failed. The session has to be ended on both sides.
 */
export async function buildLogoutUrl(origin: string) {
  const { end_session_endpoint } = await discover();
  const url = new URL(end_session_endpoint);
  url.searchParams.set("post_logout_redirect_uri", origin);
  return url.toString();
}
