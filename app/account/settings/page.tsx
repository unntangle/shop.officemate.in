"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { useAuth } from "@/components/common/AuthProvider";
import { AccountSidebar } from "@/components/account/AccountSidebar";

/**
 * Saved addresses.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * READ-ONLY, AND HONESTLY SO.
 *
 * These come from the Shopify customer record through the Customer Account
 * API — including every address captured at checkout, which covers the case
 * that matters: almost nobody adds an address before their first order.
 *
 * ADDING AND EDITING IS NOT WIRED UP YET, and the page says so rather than
 * offering a form that fails. The Customer Account API can write addresses,
 * but its input requires ISO codes — `zoneCode: "TN"`, `territoryCode: "IN"`
 * — where the Storefront API accepted full names like "Tamil Nadu". So it
 * needs a lookup for all 36 states and union territories, plus validation
 * that rejects an unrecognised state loudly instead of silently saving a
 * blank province.
 *
 * That is a contained piece of work, and worth doing properly. In the
 * meantime a customer edits an address at checkout, where Shopify collects it
 * anyway, and it appears here afterwards.
 *
 * The previous version of this page had a full editor writing to
 * localStorage. It looked complete and was invisible to Shopify, to the
 * admin, and to checkout — a form that appeared to save and changed nothing
 * anyone could act on. A read-only list that tells the truth is better than
 * an editor that lies.
 * ─────────────────────────────────────────────────────────────────────────
 */

export default function AccountAddressesPage() {
  const router = useRouter();
  const { signedIn, profileComplete, ready, addresses } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (!signedIn) router.replace("/");
    else if (!profileComplete) router.replace("/account/setup");
  }, [ready, signedIn, profileComplete, router]);

  if (!ready || !signedIn || !profileComplete) {
    return (
      <div className="container py-16">
        <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <div className="h-96 animate-pulse rounded-2xl bg-surface" />
          <div className="h-96 animate-pulse rounded-2xl bg-surface" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface py-8 md:py-10">
      <div className="container">
        <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
          <AccountSidebar />

          <section className="rounded-2xl bg-white p-5 md:p-6">
            <h1 className="text-[1.25rem] font-bold tracking-[-0.02em] text-ink">
              Saved addresses
            </h1>
            <p className="mt-1 text-[0.82rem] leading-relaxed text-muted">
              Addresses you&apos;ve used at checkout. Your default is filled in
              first next time.
            </p>

            {addresses.length > 0 ? (
              <ul className="mt-5 space-y-3">
                {addresses.map((a) => (
                  <li key={a.id} className="rounded-xl border border-line p-4">
                    <p className="text-[0.92rem] font-semibold text-ink">
                      {[a.firstName, a.lastName].filter(Boolean).join(" ") ||
                        "Delivery address"}
                    </p>
                    <address className="mt-1 text-[0.85rem] not-italic leading-relaxed text-muted">
                      {a.address1 && <span className="block">{a.address1}</span>}
                      {a.address2 && <span className="block">{a.address2}</span>}
                      <span className="block">
                        {[a.city, a.province].filter(Boolean).join(", ")}
                        {a.zip ? ` — ${a.zip}` : ""}
                      </span>
                      {a.phone && <span className="block">{a.phone}</span>}
                    </address>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-5 flex flex-col items-center rounded-xl border border-dashed border-line py-14 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-surface">
                  <MapPin size={22} className="text-muted" />
                </span>
                <p className="mt-3 text-[0.92rem] font-semibold text-ink">
                  No saved addresses
                </p>
                <p className="mt-1 max-w-xs text-[0.82rem] leading-relaxed text-muted">
                  The address you enter at checkout is saved here for next
                  time.
                </p>
                <Link
                  href="/categories"
                  className="mt-6 rounded-xl bg-night px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-night-deep"
                >
                  Start shopping
                </Link>
              </div>
            )}

            {/* Stated plainly rather than hidden. Someone looking for an "Add
                address" button should find out why there isn't one, not
                conclude the page is broken. */}
            <p className="mt-5 text-[0.75rem] leading-relaxed text-muted">
              Addresses are added and edited during checkout.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
