"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Package, Search } from "lucide-react";
import { useAuth } from "@/components/common/AuthProvider";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { Accordion } from "@/components/common/Accordion";
import { SectionHead } from "@/components/common/SectionHead";
import { CatalogCard } from "@/components/products/CatalogCard";
import { CATALOG } from "@/lib/catalog";
import { HOME_FAQS } from "@/constants/site";
import { waChatHref } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

/**
 * Account dashboard — sidebar of account surfaces, orders panel on the right.
 *
 * ⚠ THERE ARE NO ORDERS, AND THAT IS NOT A BUG. Nothing is persisted server
 * side; checkout is simulated and clears the cart without recording anything.
 * The panel says "No orders yet" because that is true for everyone, always,
 * until an order API exists.
 *
 * It is built this way rather than hidden so the shape is ready: drop a real
 * fetch into `orders` and the empty state, the search field and the layout all
 * already work. What must NOT happen is seeding it with sample orders to make
 * the screenshot look better — a fake order in someone's account is a support
 * ticket, not a placeholder.
 *
 * Saved addresses is the same story and worth more caution: it is linked
 * because the flow needs the entry point, but the page does not exist yet.
 * Do not build it against this auth \u2014 an address is real personal data, and
 * a localStorage flag is not a credential. See AuthProvider.
 *
 * WHAT IS DELIBERATELY MISSING, having looked at the Wakefit reference:
 *
 *   Wallet, Referral and Rewards. Those are three separate products, not three
 *   nav links — each needs a ledger, a rules engine and a payout path. Adding
 *   the links now creates three dead ends inside the one area of the site
 *   where a customer expects everything to work, and "coming soon" on a wallet
 *   reads as "they are holding my money somewhere I cannot see".
 *
 *   The promo banner. It needs a real campaign, and this is the screen someone
 *   opens to check an order, not to be sold to.
 *
 * WHAT WAS WORTH TAKING: the status filter, the FAQ block and the product
 * rail. All three are backed by data that already exists, and all three make
 * an empty account useful rather than just empty.
 */

/**
 * Order status filters.
 *
 * They work against an empty list today, and the empty-state copy changes with
 * the selection so the control stays honest rather than decorative — "No
 * cancelled orders" is a real answer to a real question.
 *
 * Four states, not the reference's five. "Failed" and "Pending" both describe
 * payment outcomes, and until a payment provider exists there is no way to
 * know which one an order would land in. Four that will definitely exist beat
 * five that might not.
 */
const ORDER_FILTERS = ["All", "Active", "Delivered", "Cancelled"] as const;
type OrderFilter = (typeof ORDER_FILTERS)[number];

/**
 * Account navigation lives in components/account/AccountSidebar.tsx, shared
 * with the settings page. A sidebar copied into two pages in the same area is
 * the clearest possible way to end up with two different sidebars.
 */

/**
 * Top sellers, computed exactly as the homepage's BestSellers section does —
 * same source, same filter, same sort, same slice.
 *
 * Duplicated deliberately rather than imported: BestSellers keeps its list as
 * a module-level const, not an export. If a third surface needs this, lift it
 * into lib/catalog.ts rather than copying it a second time.
 *
 * HONEST LIMITATION, inherited with the logic: there is no sales data in this
 * build and no product carries a `bestSeller` flag, so this ranks by customer
 * rating rather than by units sold.
 *
 * The heading says "Best selling products" anyway, because the homepage's own
 * section is already labelled "Best sellers" off the identical ranking — two
 * surfaces showing the same four chairs under different claims would be worse
 * than one soft claim made consistently. Wire both to real order volume
 * together; if the ranking ever needs to stay rating-based, both headings
 * change, not just this one.
 */
const topSellers = [
  ...CATALOG.filter(
    (i) => i.category === "office-chairs" && !i.pricingIsEstimated
  ),
]
  .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  .slice(0, 4);

/** Time-of-day greeting lives in AccountSidebar. */

export default function AccountPage() {
  const router = useRouter();
  const { profile, signedIn, profileComplete, ready } = useAuth();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<OrderFilter>("All");

  /* Redirect in an effect, never during render. Someone signed in but part-way
     through setup is sent to finish it rather than shown a half-empty
     dashboard. */
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

          {/* -------------------------------------------------------- orders */}
          <section className="rounded-2xl bg-white p-5 md:p-6">
            <nav className="flex items-center gap-1.5 text-[0.78rem] text-muted">
              <Link href="/account" className="hover:text-ink">
                Account
              </Link>
              <ChevronRight size={13} />
              <span className="text-ink">My orders</span>
            </nav>

            <h1 className="mt-2 text-[1.5rem] font-bold tracking-[-0.02em] text-ink">
              My orders
            </h1>

            <div className="relative mt-5">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your orders"
                aria-label="Search your orders"
                /* Disabled, not hidden. The field is the shape this panel will
                   have; leaving it enabled over an empty list would let someone
                   type and get nothing back, which reads as broken search
                   rather than as an empty account. */
                disabled
                className="h-12 w-full rounded-xl border-2 border-line bg-surface pl-10 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-muted disabled:cursor-not-allowed"
              />
            </div>

            {/* Status filters. `aria-pressed` rather than tabs — these toggle
                a view of one list, they do not switch between panels, and a
                tablist would promise arrow-key navigation between them. */}
            <div className="mt-4 flex flex-wrap gap-2">
              {ORDER_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={cn(
                    "rounded-full border px-4 py-2 text-[0.8rem] font-medium transition-colors",
                    filter === f
                      ? "border-ink bg-night text-white"
                      : "border-line text-muted hover:border-ink/30 hover:text-ink"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-surface">
                <Package size={26} className="text-muted" />
              </span>
              <p className="mt-4 text-[0.95rem] font-semibold text-ink">
                {filter === "All" ? "No orders yet" : `No ${filter.toLowerCase()} orders`}
              </p>
              <p className="mt-1 max-w-xs text-[0.82rem] leading-relaxed text-muted">
                Once you place an order it will show up here, with tracking and
                installation updates.
              </p>
              <Link
                href="/products"
                className="mt-6 rounded-xl bg-night px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-night-deep"
              >
                Start shopping
              </Link>
            </div>
          </section>

          {/* ------------------------------------------------ recommendations

              Sits under the orders panel rather than beside it. The reference
              runs a product rail down the right-hand side, which works on
              their wider layout; here the sidebar already owns that column,
              and a third column would leave the orders list too narrow to show
              a line item properly.

              `SectionHead` and `CatalogCard` are the homepage's own components
              — same heading treatment, same card, same Add to cart button,
              same wishlist heart. Building a bespoke card here would have
              meant a second product tile to keep in step with the first. */}
          <section className="lg:col-start-2">
            <SectionHead
              title="Best selling products"
              href="/products?category=office-chairs"
              description="The chairs our customers rate highest, in stock and shipping now."
            />

            <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
              {topSellers.map((item) => (
                <CatalogCard key={item.slug} item={item} />
              ))}
            </div>
          </section>

          {/* -------------------------------------------------------- faqs

              The same HOME_FAQS the homepage renders. Shared rather than
              copied: an account FAQ that contradicts the homepage FAQ is worse
              than no FAQ, and this is the surface a confused customer reaches
              for first.

              Placed after the orders panel because it answers the question
              someone asks once they have looked for their order and not found
              it. */}
          <section className="rounded-2xl bg-white p-5 md:p-6 lg:col-start-2">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-[1.05rem] font-semibold text-ink">
                Frequently asked
              </h2>
              <a
                href={waChatHref}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-[0.8rem] font-medium text-muted underline underline-offset-4 transition-colors hover:text-ink"
              >
                Still stuck?
              </a>
            </div>
            <Accordion items={HOME_FAQS} variant="card" defaultOpen={null} className="mt-3" />
          </section>
        </div>
      </div>
    </div>
  );
}
