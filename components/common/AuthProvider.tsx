"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { LoginModal } from "@/components/common/LoginModal";

/**
 * Who the visitor claims to be, and the one modal that asks.
 *
 * ⚠ THIS IS NOT A SESSION. It records that someone completed the OTP screen
 * in this browser, nothing more. There is no token, nothing is signed, and no
 * server has ever heard of this person. See LoginModal for the full note.
 *
 * WHAT MUST NOT BE BUILT ON THIS. Anything that reveals real data — order
 * history from a server, a saved address, B2B pricing — because a
 * `localStorage` key is set by anybody who opens devtools. Everything gated
 * today lives in this same browser's storage, so hiding it protects nothing
 * and reveals nothing. It is a UI affordance, not a permission.
 *
 * When real auth lands, `signedIn` becomes "the server returned a valid
 * session" and `profile` comes from that session. This file is the only one
 * that changes.
 */

/** Deliberately not called "session" or "token" — it is neither. */
const STORAGE_KEY = "officemate.profile.v1";

export interface Address {
  /** Stable key for editing and removal. `crypto.randomUUID` where available. */
  id: string;
  /** "Home", "Office" — free text, shown as the card's title. */
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Profile {
  /** Ten digits, no country code. Set by the OTP step. */
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  /** True once the emailed code has been entered. */
  emailVerified?: boolean;
  /**
   * Saved delivery addresses.
   *
   * These live in localStorage alongside the cart and the wishlist, and never
   * leave the browser — there is no endpoint to send them to. That is what
   * makes storing them acceptable under demo auth: the sign-in flow is not
   * protecting them, but nothing else can reach them either.
   *
   * THE MOMENT THEY SYNC TO A SERVER, this stops being true and real auth has
   * to land first. An address is personal data, and a localStorage flag is not
   * a credential.
   */
  addresses?: Address[];
}

interface AuthContextValue {
  profile: Profile | null;
  /** Phone verified. Enough to browse an account area. */
  signedIn: boolean;
  /** Name and a verified email on file — the setup flow is finished. */
  profileComplete: boolean;
  /** False until localStorage is read, so gated UI does not flash. */
  ready: boolean;
  openLogin: () => void;
  /** Merges into the stored profile. Partial by design — setup saves in steps. */
  saveProfile: (patch: Partial<Profile>) => void;
  /** Adds a new address, or replaces the one with a matching `id`. */
  saveAddress: (address: Address) => void;
  removeAddress: (id: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  /* Read after mount, never during render. Touching localStorage while
     rendering makes the server and client markup disagree, and React throws
     out the whole subtree rather than patching it. `ready` is what lets
     consumers render nothing until the real answer is known, instead of
     rendering the signed-out state and flipping a frame later. */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setProfile(JSON.parse(raw) as Profile);
    } catch {
      /* Private mode, disabled storage, or a corrupt value from an older
         shape. Signed out is the safe default in every case. */
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: Profile | null) => {
    setProfile(next);
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Not fatal — state still holds for this page view. */
    }
  }, []);

  const openLogin = useCallback(() => setModalOpen(true), []);

  const saveProfile = useCallback(
    (patch: Partial<Profile>) => {
      persist({ ...(profile ?? { phone: "" }), ...patch } as Profile);
    },
    [profile, persist]
  );

  /* Called by the modal once the phone code matches. The modal has no success
     screen — it hands off here and this closes it and navigates. */
  const onVerified = useCallback(
    (phone: string) => {
      const existing = profile?.phone === phone ? profile : null;
      const next: Profile = existing ?? { phone };
      persist(next);
      setModalOpen(false);

      /* Straight to the account area either way — setup if this is a new
         account, the dashboard if it is a return visit.

         ONE TRADE-OFF WORTH KNOWING. Someone who tapped a wishlist heart to
         sign in now gets taken away from the grid they were shopping. That is
         the cost of "verifying lands you in your account", and it is the
         behaviour that was asked for. If it turns out to hurt, the fix is to
         pass an intent into `openLogin` — navigate when the modal was opened
         from the header, stay put when it was opened by a heart. */
      router.push(
        next.firstName && next.emailVerified ? "/account" : "/account/setup"
      );
    },
    [profile, persist, router]
  );

  const signOut = useCallback(() => {
    persist(null);
    router.push("/");
  }, [persist, router]);

  const saveAddress = useCallback(
    (address: Address) => {
      const current = profile?.addresses ?? [];
      const exists = current.some((a) => a.id === address.id);
      /* Replace in place rather than remove-and-append, so editing an address
         does not move it to the bottom of the list under the person's cursor. */
      const addresses = exists
        ? current.map((a) => (a.id === address.id ? address : a))
        : [...current, address];
      saveProfile({ addresses });
    },
    [profile, saveProfile]
  );

  const removeAddress = useCallback(
    (id: string) => {
      saveProfile({ addresses: (profile?.addresses ?? []).filter((a) => a.id !== id) });
    },
    [profile, saveProfile]
  );

  const value = useMemo(
    () => ({
      profile,
      signedIn: Boolean(profile?.phone),
      profileComplete: Boolean(profile?.firstName && profile?.emailVerified),
      ready,
      openLogin,
      saveProfile,
      saveAddress,
      removeAddress,
      signOut,
    }),
    [profile, ready, openLogin, saveProfile, saveAddress, removeAddress, signOut]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* One modal for the whole app, rendered here rather than in the header.
          The heart on a product card has to be able to open it too, and a
          second copy inside the grid would mean two dialogs fighting over the
          body scroll lock. */}
      <LoginModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onVerified={onVerified}
      />
    </AuthContext.Provider>
  );
}
