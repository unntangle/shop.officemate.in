import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { recordOrder, type StoredOrder } from "@/lib/order-store";
import { findPhoneByEmail, getProfile } from "@/lib/profile-store";

/**
 * Shopify `orders/create` webhook.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THIS IS HOW ORDER HISTORY REACHES THE ACCOUNT DASHBOARD.
 *
 * We cannot PULL a customer's orders — that needs a customer access token,
 * and a passwordless store will not issue one to a session it did not
 * authenticate. So Shopify pushes each order here as it is placed, and we
 * store a copy against the customer's phone number.
 *
 * ⚠ THE HMAC CHECK IS NOT OPTIONAL. This endpoint is public and unguessable
 * only by obscurity; without verification anyone could POST fabricated orders
 * into a stranger's history. The signature proves the payload came from
 * Shopify and was not altered.
 * ─────────────────────────────────────────────────────────────────────────
 */

const SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;

/**
 * Verify Shopify's signature over the RAW body.
 *
 * The body must be read as text and hashed byte-for-byte — parsing it to JSON
 * and re-serialising changes key order and whitespace, and the signature then
 * never matches. That is the single most common reason a Shopify webhook
 * "randomly" fails verification.
 */
function verify(rawBody: string, signature: string | null): boolean {
  if (!SECRET || !signature) return false;

  const digest = createHmac("sha256", SECRET)
    .update(rawBody, "utf8")
    .digest("base64");

  const a = Buffer.from(digest);
  const b = Buffer.from(signature);

  /* Constant-time, length-checked first because timingSafeEqual throws on a
     length mismatch rather than returning false. */
  return a.length === b.length && timingSafeEqual(a, b);
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Ten digits, matching how phones are keyed throughout this codebase. */
const normalisePhone = (value?: string | null): string | null => {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
};

/**
 * Work out whose account this order belongs to.
 *
 * PHONE FIRST, because that is the account key. Email second, through the
 * index, because a shopper may give a different number at checkout than the
 * one they signed in with — but the email is usually the same, and it is what
 * Shopify itself matches customers on.
 *
 * Several places are checked because Shopify puts contact details in
 * different fields depending on how the order was placed.
 */
async function resolvePhone(order: any): Promise<string | null> {
  const candidates = [
    order?.customer?.phone,
    order?.phone,
    order?.shipping_address?.phone,
    order?.billing_address?.phone,
  ];

  for (const candidate of candidates) {
    const phone = normalisePhone(candidate);
    /* Only accept a phone we actually have a profile for. An unknown number
       would create an orders bucket nobody can ever read. */
    if (phone && (await getProfile(phone)).email) return phone;
  }

  const email = (order?.email ?? order?.customer?.email ?? "")
    .trim()
    .toLowerCase();
  if (email) {
    const byEmail = await findPhoneByEmail(email);
    if (byEmail) return byEmail;
  }

  return null;
}

function toStoredOrder(order: any): StoredOrder {
  return {
    id: String(order.id),
    name: order.name ?? `#${order.order_number}`,
    processedAt: order.processed_at ?? order.created_at,
    financialStatus: order.financial_status ?? undefined,
    fulfillmentStatus: order.fulfillment_status ?? undefined,
    total: Number(order.current_total_price ?? order.total_price ?? 0),
    currency: order.currency ?? "INR",
    lines: (order.line_items ?? []).map((item: any) => ({
      title: item.title,
      /* Skipped when it is Shopify's placeholder for a product with no
         options — printing "Default Title" under every line is noise. */
      variantTitle:
        item.variant_title && item.variant_title !== "Default Title"
          ? item.variant_title
          : undefined,
      quantity: item.quantity,
      price: Number(item.price ?? 0),
    })),
  };
}

export async function POST(request: NextRequest) {
  if (!SECRET) {
    console.error(
      "[webhook] SHOPIFY_WEBHOOK_SECRET is not set — rejecting. Set it in " +
        ".env.local and in Vercel, or orders will never reach the dashboard."
    );
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const raw = await request.text();
  const signature = request.headers.get("x-shopify-hmac-sha256");

  if (!verify(raw, signature)) {
    console.warn("[webhook] rejected: signature mismatch");
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let order: any;
  try {
    order = JSON.parse(raw);
  } catch {
    /* 200 on a malformed body. Shopify retries non-2xx responses, and a
       payload we cannot parse will never parse — retrying it forever helps
       nobody. */
    console.error("[webhook] body was not valid JSON");
    return NextResponse.json({ ok: true });
  }

  try {
    const phone = await resolvePhone(order);

    if (!phone) {
      /* Logged, not dropped silently. A guest checkout with no matching
         account is completely normal — but so is "my order isn't showing",
         and this log is the only way to answer that question later. */
      console.warn(
        `[webhook] order ${order.name ?? order.id} could not be matched to an ` +
          `account (email: ${order.email ?? "none"}, phone: ${order.phone ?? "none"})`
      );
      return NextResponse.json({ ok: true });
    }

    await recordOrder(phone, toStoredOrder(order));
    console.log(`[webhook] recorded ${order.name} for +91 ${phone}`);
  } catch (err) {
    /* Still 200. Shopify retries on failure, and a bug in our storage layer
       would otherwise have it retrying the same broken write for hours. The
       log is where this gets noticed. */
    console.error("[webhook] failed to record order:", err);
  }

  return NextResponse.json({ ok: true });
}
