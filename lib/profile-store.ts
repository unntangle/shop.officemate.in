import { otpStore } from "@/lib/otp/store";
import type { Address } from "@/types";

/**
 * Customer profile and addresses, stored by us.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS RATHER THAN LIVING IN SHOPIFY.
 *
 * Sign-in is a phone number verified by our own OTP. This store runs NEW
 * customer accounts, which are passwordless, so `customerAccessTokenCreate`
 * cannot issue a customer token for a phone-authenticated visitor — and
 * without that token the Storefront and Customer Account APIs will not return
 * a customer's profile, addresses or orders to us.
 *
 * Shopify still gets the customer record: `customerCreate` runs at first
 * sign-in, so the admin sees the person and their orders attach correctly at
 * checkout. What Shopify will not do is read any of it BACK to a session it
 * did not authenticate. So the account area reads from here instead.
 *
 * ⚠ THIS IS A SECOND SOURCE OF TRUTH, and that is a real cost, not a detail.
 * A name changed here does not change the name Shopify has; an address saved
 * here is not the address on the order. They will drift. It is accepted
 * deliberately because the alternative — Shopify's hosted login — was
 * rejected, and an account area that can show nothing is worse than one that
 * shows what we know.
 *
 * KEEP THE DRIFT NARROW. Write through to Shopify wherever an API allows it
 * without a customer token (`customerCreate` takes a name and email at
 * creation), and treat Shopify as authoritative for anything to do with
 * orders and money. This store is for what the customer typed into our UI.
 *
 * STORAGE is the same adapter the OTP codes use — memory on localhost,
 * Upstash Redis in production. Profiles are written with a ten-year TTL
 * rather than none, because Redis without expiry accumulates forever and
 * nobody ever goes back to prune it.
 * ─────────────────────────────────────────────────────────────────────────
 */

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

const key = (phone: string) => `profile:${phone}`;

/**
 * Reverse index: email → phone.
 *
 * WHY AN INDEX RATHER THAN A SEARCH. Profiles are stored one key per phone,
 * and neither Redis nor the in-memory adapter can search values without
 * scanning every key — which is fine at ten customers and unusable at ten
 * thousand. One extra key per email makes "is this email taken?" a single
 * lookup that stays fast forever.
 *
 * LOWERCASED, ALWAYS. Email is case-insensitive in practice and Shopify
 * lowercases it on its side, so `Gokul@x.com` and `gokul@x.com` must resolve
 * to the same entry. Indexing the raw string would let one person register
 * both and end up with two accounts and one inbox.
 */
const emailKey = (email: string) => `email:${email.trim().toLowerCase()}`;

export interface StoredProfile {
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  /** Shopify customer GID, so the two can be reconciled later. */
  customerId?: string;
  addresses: Address[];
}

const empty = (phone: string): StoredProfile => ({ phone, addresses: [] });

export async function getProfile(phone: string): Promise<StoredProfile> {
  try {
    const raw = await otpStore.get(key(phone));
    if (!raw) return empty(phone);
    const parsed = JSON.parse(raw) as StoredProfile;
    /* Defensive: a value written by an older shape must not crash the account
       page. Missing addresses become an empty list rather than undefined. */
    return { ...empty(phone), ...parsed, addresses: parsed.addresses ?? [] };
  } catch {
    return empty(phone);
  }
}

/**
 * Which phone number, if any, already claims this email.
 *
 * Returns null when the email is free. Callers compare against the CURRENT
 * phone before treating it as a conflict — someone re-saving their own
 * profile obviously still owns their own email.
 */
export async function findPhoneByEmail(
  email: string
): Promise<string | null> {
  if (!email.trim()) return null;
  try {
    return await otpStore.get(emailKey(email));
  } catch {
    return null;
  }
}

export async function saveProfile(
  phone: string,
  patch: Partial<Omit<StoredProfile, "phone">>
): Promise<StoredProfile> {
  const current = await getProfile(phone);
  const next: StoredProfile = { ...current, ...patch, phone };

  /* Emails are stored lowercased so the profile matches the index and matches
     what Shopify will hold. Doing it here rather than in the form means it
     cannot be bypassed by a caller that forgets. */
  if (next.email) next.email = next.email.trim().toLowerCase();

  await otpStore.set(key(phone), JSON.stringify(next), TEN_YEARS);

  /* Keep the index in step. The OLD entry is released first — without that,
     changing your email would leave the previous address permanently claimed
     by you, and nobody else could ever register it. */
  if (current.email && current.email !== next.email) {
    await otpStore.delete(emailKey(current.email));
  }
  if (next.email) {
    await otpStore.set(emailKey(next.email), phone, TEN_YEARS);
  }

  return next;
}

/**
 * Add or replace an address.
 *
 * Setting one as default clears the flag on every other, because two
 * defaults means checkout picks whichever it happens to find first.
 */
export async function upsertAddress(
  phone: string,
  address: Address
): Promise<StoredProfile> {
  const current = await getProfile(phone);

  const exists = current.addresses.some((a) => a.id === address.id);
  let addresses = exists
    ? current.addresses.map((a) => (a.id === address.id ? address : a))
    : [...current.addresses, address];

  if (address.isDefault) {
    addresses = addresses.map((a) => ({
      ...a,
      isDefault: a.id === address.id,
    }));
  }

  return saveProfile(phone, { addresses });
}

export async function deleteAddress(
  phone: string,
  id: string
): Promise<StoredProfile> {
  const current = await getProfile(phone);
  return saveProfile(phone, {
    addresses: current.addresses.filter((a) => a.id !== id),
  });
}

/**
 * Erase everything this app holds about a phone number.
 *
 * Removes the profile, the addresses and the email index entry — the index
 * MUST go too, or the address stays permanently claimed and nobody, including
 * the same person signing up again, can ever register it.
 *
 * ⚠ IT CANNOT TOUCH SHOPIFY. Deleting a Shopify customer needs the Admin API,
 * and this build has no Admin token. So the customer record and any orders
 * survive, which is also what you would want legally: order records are
 * financial documents and are normally retained regardless of an account
 * being closed. The UI must SAY this rather than imply a total erasure it
 * cannot perform.
 */
export async function deleteProfile(phone: string): Promise<void> {
  const current = await getProfile(phone);

  if (current.email) {
    await otpStore.delete(emailKey(current.email));
  }
  await otpStore.delete(key(phone));
}
