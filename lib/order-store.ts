import { otpStore } from "@/lib/otp/store";

/**
 * Order history, kept by us.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY WE STORE ORDERS AT ALL, when Shopify already has them.
 *
 * Reading a customer's orders back from Shopify needs a customer access
 * token. This store runs new customer accounts — passwordless — so no API
 * will issue one for a session Shopify did not authenticate itself, and sign
 * in here is our own phone OTP. Multipass would bridge that, and it is
 * Plus-only.
 *
 * So Shopify PUSHES instead: the `orders/create` webhook fires on every
 * order, and we keep a copy against the customer's phone number. The account
 * dashboard reads from here.
 *
 * ⚠ THIS IS A CACHE, NOT THE RECORD. Shopify remains authoritative for
 * anything to do with money, tax or fulfilment. What is stored here is enough
 * to render a history list, and nothing here should ever be used to decide
 * whether someone paid.
 *
 * MATCHING IS BY PHONE, falling back to email. An order placed at checkout
 * carries whatever contact details were typed there, which may not be the
 * ones on the account — so an order can arrive that we cannot attribute. That
 * is logged rather than dropped silently, because "my order isn't showing" is
 * a support call and the log is the only way to answer it.
 * ─────────────────────────────────────────────────────────────────────────
 */

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Newest first. Capped, because a history list is not an archive. */
const MAX_ORDERS = 50;

const key = (phone: string) => `orders:${phone}`;

export interface StoredOrder {
  /** Shopify's numeric order id, as a string. */
  id: string;
  /** Human-facing number, e.g. "#1001". */
  name: string;
  processedAt: string;
  financialStatus?: string;
  fulfillmentStatus?: string;
  total: number;
  currency: string;
  lines: {
    title: string;
    variantTitle?: string;
    quantity: number;
    price: number;
    image?: string;
  }[];
}

export async function getOrders(phone: string): Promise<StoredOrder[]> {
  try {
    const raw = await otpStore.get(key(phone));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Record an order against a phone number.
 *
 * IDEMPOTENT BY ORDER ID. Shopify retries a webhook that does not return 200
 * quickly enough, and it can deliver the same event more than once by design
 * — so without this a slow response would duplicate every order in someone's
 * history. Replacing rather than skipping also means a redelivery carrying
 * updated status overwrites the stale copy.
 */
export async function recordOrder(
  phone: string,
  order: StoredOrder
): Promise<void> {
  const current = await getOrders(phone);
  const without = current.filter((o) => o.id !== order.id);
  const next = [order, ...without].slice(0, MAX_ORDERS);
  await otpStore.set(key(phone), JSON.stringify(next), TEN_YEARS);
}

/** Removed along with the profile when an account is closed. */
export async function deleteOrders(phone: string): Promise<void> {
  await otpStore.delete(key(phone));
}
