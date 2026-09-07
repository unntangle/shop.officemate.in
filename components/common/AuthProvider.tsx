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
import type { Address } from "@/types";
import { LoginModal } from "@/components/common/LoginModal";
import {
  deleteAccountAction,
  fetchAddresses,
  fetchOrders,
  getAuthState,
  removeAddressAction,
  saveAddressAction,
  saveProfileAction,
  signOutAction,
  type AuthState,
} from "@/lib/auth-actions";
import type { StoredOrder } from "@/lib/order-store";

/**
 * Who is signed in.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * OUR OWN PHONE OTP, in our own modal. Shopify's hosted login is not used.
 *
 * Nothing here can be forged from devtools: the modal posts to the OTP
 * endpoints, the server issues a SIGNED httpOnly session cookie, and this
 * provider only ever asks the server what that cookie means. It never sees
 * the cookie and holds no credential.
 *
 * ⚠ THERE IS NO ORDER HISTORY, and it is not coming without more work. See
 * the header of lib/auth-actions.ts for why, and for the three ways to change
 * it. Do not build anything that assumes `orders` will start returning rows.
 *
 * Profile and addresses come from OUR store, not Shopify's — see
 * lib/profile-store.ts. They are deliberately a second source of truth, which
 * is a real cost and was chosen knowingly.
 * ─────────────────────────────────────────────────────────────────────────
 */

interface AuthContextValue {
  auth: AuthState | null;
  signedIn: boolean;
  /** False until the first server check returns, so nothing flashes. */
  ready: boolean;
  profileComplete: boolean;

  saveProfile: (fields: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }) => Promise<{ ok: boolean; error?: string }>;

  addresses: Address[];
  orders: StoredOrder[];
  ordersLoading: boolean;
  saveAddress: (address: Address) => Promise<{ ok: boolean; error?: string }>;
  removeAddress: (id: string) => Promise<{ ok: boolean; error?: string }>;

  openLogin: () => void;
  signOut: () => void;
  deleteAccount: () => Promise<{ ok: boolean; error?: string }>;
  /** Runs `action` if signed in, otherwise opens the modal. */
  requireAuth: (action: () => void) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [auth, setAuth] = useState<AuthState | null>(null);
  const [ready, setReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const state = await getAuthState();
      setAuth(state.signedIn ? state : null);
      return state;
    } catch {
      setAuth(null);
      return null;
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!auth?.signedIn) {
      setAddresses([]);
      setOrders([]);
      return;
    }
    let cancelled = false;

    fetchAddresses().then((list) => {
      if (!cancelled) setAddresses(list);
    });

    setOrdersLoading(true);
    fetchOrders()
      .then((list) => {
        if (!cancelled) setOrders(list);
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [auth?.signedIn]);

  /**
   * Called by LoginModal once the SERVER has verified the code.
   *
   * The session cookie already exists by this point — the modal does not
   * create it and could not. This only re-reads what the server now says and
   * routes accordingly.
   */
  const onVerified = useCallback(async () => {
    const state = await refresh();
    setModalOpen(false);
    router.push(state?.profileComplete ? "/account" : "/account/setup");
  }, [refresh, router]);

  const saveProfile = useCallback(
    async (fields: {
      firstName?: string;
      lastName?: string;
      email?: string;
    }) => {
      const result = await saveProfileAction(fields);
      if (result.ok) await refresh();
      return result;
    },
    [refresh]
  );

  const saveAddress = useCallback(async (address: Address) => {
    const result = await saveAddressAction(address);
    if (result.ok && result.addresses) setAddresses(result.addresses);
    return { ok: result.ok, error: result.error };
  }, []);

  const removeAddress = useCallback(async (id: string) => {
    const result = await removeAddressAction(id);
    if (result.ok && result.addresses) setAddresses(result.addresses);
    return { ok: result.ok, error: result.error };
  }, []);

  const signOut = useCallback(async () => {
    await signOutAction();
    setAuth(null);
    setAddresses([]);
    router.push("/");
  }, [router]);

  const deleteAccount = useCallback(async () => {
    const result = await deleteAccountAction();
    if (result.ok) {
      setAuth(null);
      setAddresses([]);
      /* A full navigation, not router.push. The session cookie was cleared
         server-side, and a client-side transition would keep this provider's
         cached state around long enough for a protected page to render for a
         person who no longer has an account. */
      window.location.href = "/";
    }
    return result;
  }, []);

  const openLogin = useCallback(() => setModalOpen(true), []);

  const requireAuth = useCallback(
    (action: () => void) => {
      if (auth?.signedIn) action();
      else setModalOpen(true);
    },
    [auth?.signedIn]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      auth,
      signedIn: Boolean(auth?.signedIn),
      ready,
      profileComplete: Boolean(auth?.profileComplete),
      saveProfile,
      addresses,
      orders,
      ordersLoading,
      saveAddress,
      removeAddress,
      openLogin,
      signOut,
      deleteAccount,
      requireAuth,
    }),
    [
      auth,
      ready,
      saveProfile,
      addresses,
      orders,
      ordersLoading,
      saveAddress,
      removeAddress,
      openLogin,
      signOut,
      deleteAccount,
      requireAuth,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onVerified={onVerified}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
