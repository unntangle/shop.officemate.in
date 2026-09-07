"use server";

import { attachCustomer, destroySession, getSession } from "@/lib/session";
import type { Address } from "@/types";
import { createCustomerWithProfile } from "@/lib/shopify/customer-storefront";
import { deleteOrders, getOrders, type StoredOrder } from "@/lib/order-store";
import {
  deleteAddress,
  deleteProfile,
  findPhoneByEmail,
  getProfile,
  saveProfile as persistProfile,
  upsertAddress,
} from "@/lib/profile-store";

/**
 * Auth, for client components.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * IDENTITY IS OUR OWN PHONE OTP. Shopify's hosted login is not used.
 *
 * The flow: LoginModal → /api/auth/otp/request → WhatsApp → verify → a signed
 * httpOnly session cookie, and a Shopify customer created on first sign-in so
 * the admin sees the person and orders attach to them at checkout.
 *
 * ⚠ ORDER HISTORY CANNOT BE READ, and this is a platform limit rather than
 * unfinished work. Reading a customer's orders needs a customer access token,
 * and this store runs new customer accounts — passwordless — so no API will
 * issue one for a session Shopify did not authenticate itself. The orders
 * panel therefore has nothing to show and says so honestly.
 *
 * THE WAYS TO CHANGE THAT, in rough order of effort:
 *
 *   1. Order webhooks. Shopify can POST `orders/create` to us; we store the
 *      order against the phone in the profile store and render it. Real work,
 *      but it is the only route that keeps this login AND shows orders.
 *   2. Shopify's hosted login. Everything works, at the cost of this modal.
 *      The code for it is still in lib/shopify/customer-auth.ts and the three
 *      routes under app/api/auth/shopify/.
 *   3. Shopify Plus and Multipass, which allows custom auth with SSO.
 *
 * Profile and addresses come from lib/profile-store.ts — our own store, not
 * Shopify's. Read the header there before changing anything: it is a second
 * source of truth and the drift is deliberate, not an oversight.
 * ─────────────────────────────────────────────────────────────────────────
 */

export interface AuthState {
  signedIn: boolean;
  phone?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  /** True once a Shopify customer record is linked to this session. */
  linked: boolean;
  profileComplete: boolean;
}

const SIGNED_OUT: AuthState = {
  signedIn: false,
  linked: false,
  profileComplete: false,
};

export async function getAuthState(): Promise<AuthState> {
  const session = await getSession();
  if (!session) return SIGNED_OUT;

  const profile = await getProfile(session.phone);

  return {
    signedIn: true,
    phone: session.phone,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    linked: Boolean(session.customerId),
    /* Both, because the setup screen asks for both. A name alone is not
       enough to put on an invoice. */
    profileComplete: Boolean(profile.firstName && profile.email),
  };
}

export async function saveProfileAction(fields: {
  firstName?: string;
  lastName?: string;
  email?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "You're signed out. Sign in and try again." };
  }

  /**
   * One email, one account.
   *
   * ───────────────────────────────────────────────────────────────────────
   * CHECKED BEFORE SAVING, and reported to the person rather than logged.
   *
   * Without this, a second phone number could register an email that already
   * belongs to someone. Shopify would reject the customer with TAKEN, our
   * code would swallow it as a warning, and setup would report success — so
   * the person sees "Saved", no Shopify customer is ever created for them,
   * and their orders would attach to the OTHER account at checkout, because
   * Shopify matches customers by email.
   *
   * That is the worst class of bug: it looks like it worked, and the damage
   * lands on a different person's order history weeks later.
   *
   * Comparing against the current phone matters — re-saving your own profile
   * must not trip on your own email.
   */
  const emailOwner = fields.email
    ? await findPhoneByEmail(fields.email)
    : null;

  if (emailOwner && emailOwner !== session.phone) {
    return {
      ok: false,
      error:
        "That email is already linked to another account. Sign in with that " +
        "number, or use a different email.",
    };
  }

  try {
    const profile = await persistProfile(session.phone, fields);

    /**
     * Create the Shopify customer NOW, with real details, if there isn't one.
     *
     * This is the moment the record can be created correctly — we finally
     * have a name and a genuine email. Creating earlier (at sign-in) produced
     * a nameless customer with a synthetic address that could never be fixed,
     * because correcting it needs a customer token this store cannot issue.
     *
     * Only when `customerId` is absent, so editing a profile later does not
     * try to create a second record. Note the corollary and its cost: once
     * created, a later name or email change lives only in our store and does
     * NOT reach Shopify. See lib/profile-store.ts.
     */
    if (!session.customerId && profile.firstName && profile.email) {
      try {
        const customer = await createCustomerWithProfile({
          phone: session.phone,
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
        });

        if (customer) {
          await attachCustomer(customer.id);
          await persistProfile(session.phone, { customerId: customer.id });
        }
      } catch (err) {
        /* Setup must still succeed. The person has given us their details and
           they are saved; a Shopify outage or a duplicate email is not their
           problem, and checkout will create the customer regardless. */
        console.error("[auth] could not create Shopify customer:", err);
      }
    }

    return { ok: true };
  } catch (err) {
    console.error("[auth] profile save failed:", err);
    return { ok: false, error: "Couldn't save your details. Please try again." };
  }
}

/**
 * Order history.
 *
 * Read from OUR store, not from Shopify — see lib/order-store.ts. Orders
 * arrive by webhook as they are placed, because a passwordless store will not
 * issue the customer token needed to pull them.
 *
 * An empty list therefore means one of three things, and they are worth
 * distinguishing when something looks wrong: no orders yet, the webhook is
 * not registered, or an order could not be matched to this account. The
 * webhook logs the third case.
 */
export async function fetchOrders(): Promise<StoredOrder[]> {
  const session = await getSession();
  if (!session) return [];
  return getOrders(session.phone);
}

export async function fetchAddresses(): Promise<Address[]> {
  const session = await getSession();
  if (!session) return [];
  return (await getProfile(session.phone)).addresses;
}

export async function saveAddressAction(
  address: Address
): Promise<{ ok: boolean; error?: string; addresses?: Address[] }> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "You're signed out. Sign in and try again." };
  }

  try {
    const profile = await upsertAddress(session.phone, address);
    return { ok: true, addresses: profile.addresses };
  } catch (err) {
    console.error("[auth] address save failed:", err);
    return { ok: false, error: "Couldn't save that address." };
  }
}

export async function removeAddressAction(
  id: string
): Promise<{ ok: boolean; error?: string; addresses?: Address[] }> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "You're signed out. Sign in and try again." };
  }

  try {
    const profile = await deleteAddress(session.phone, id);
    return { ok: true, addresses: profile.addresses };
  } catch (err) {
    console.error("[auth] address delete failed:", err);
    return { ok: false, error: "Couldn't remove that address." };
  }
}

export async function signOutAction() {
  await destroySession();
}

/**
 * Close the account.
 *
 * Erases the profile and addresses this app holds, then ends the session.
 *
 * ⚠ THE SHOPIFY CUSTOMER AND ANY ORDERS REMAIN, because deleting them needs
 * the Admin API and this build has no Admin token. That is also the
 * defensible outcome: order records are financial documents and are normally
 * retained after an account closes. The UI states this plainly — promising a
 * total erasure we cannot perform would be worse than the limitation itself.
 *
 * Signing up again with the same number gives a fresh, empty profile. It will
 * relink to the SAME Shopify customer at checkout, because Shopify matches on
 * email — so past orders reappear against them in the admin, which is
 * correct.
 */
export async function deleteAccountAction(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "You're already signed out." };
  }

  try {
    await deleteProfile(session.phone);
    /* Orders go too. Leaving them would resurrect a closed customer's history
       the moment someone signed up on the same number. */
    await deleteOrders(session.phone);
    await destroySession();
    return { ok: true };
  } catch (err) {
    console.error("[auth] account deletion failed:", err);
    /* The session is deliberately LEFT INTACT on failure. Ending it while the
       data survives would strand someone signed out of an account that still
       exists, with no way back in to try again. */
    return { ok: false, error: "Couldn't close your account. Please try again." };
  }
}
