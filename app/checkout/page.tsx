"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useCart } from "@/components/commerce/CartProvider";
import { useAuth } from "@/components/common/AuthProvider";
import { setCartBuyer } from "@/lib/shopify/cart";
import { formatPrice } from "@/lib/utils";

/**
 * Checkout hand-off.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THIS PAGE NO LONGER TAKES AN ADDRESS OR A PAYMENT. It hands the cart to
 * Shopify's hosted checkout, which owns the whole transaction.
 *
 * What that removes, and why removing it was the point:
 *
 *   PCI SCOPE. No card detail ever reaches this codebase or this server.
 *   PRICE TAMPERING. Shopify recalculates every line from its own catalogue,
 *     so an edited cart in localStorage cannot produce a cheap order. The
 *     previous version totalled in the browser and trusted the result.
 *   TAX AND SHIPPING. Both computed by Shopify against the real address,
 *     which is why this page never asked for one — a delivery estimate made
 *     up before an address exists is a guess presented as a fact.
 *   ORDER CREATION. Shopify records the order, emails the confirmation and
 *     shows it in the admin. The old page cleared the cart and recorded
 *     nothing, which meant a customer could "complete" a purchase that had
 *     never happened.
 *
 * The address form, the fake order confirmation and the local coupon maths
 * are all gone. None of them were real.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * ⚠ A PAYMENT PROVIDER MUST BE CONNECTED IN SHOPIFY before an order can
 * actually complete. Until then this redirect works and Shopify's checkout
 * loads with the right items and the right customer — it simply has no way to
 * charge. Settings → Payments.
 */

export default function CheckoutPage() {
  const { lines, totals, checkoutUrl, ready } = useCart();
  const { auth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  /**
   * Redirect as soon as there is a cart to redirect with.
   *
   * Automatic rather than behind a button. Someone who pressed "Proceed to
   * checkout" has already declared their intent; making them press a second
   * button on a page that only forwards them is friction with nothing behind
   * it.
   */
  useEffect(() => {
    if (!ready || redirecting) return;
    if (lines.length === 0) return;
    if (!checkoutUrl) return;

    setRedirecting(true);

    (async () => {
      /* Attach the customer BEFORE handing over, so the order lands on their
         existing record instead of creating a second one — see setCartBuyer.
         Deliberately not awaited for its result: a failure here must not stop
         the sale. */
      if (auth?.email || auth?.phone) {
        await setCartBuyer({ email: auth.email, phone: auth.phone }).catch(
          () => null
        );
      }

      /* `logged_in=true` carries the Shopify customer session across to
         checkout. Without it a signed-in customer is asked to identify
         themselves a second time, immediately after signing in — which is
         exactly the friction the account work exists to remove. */
      const url = new URL(checkoutUrl);
      if (auth?.signedIn) url.searchParams.set("logged_in", "true");

      /* `replace`, not `assign`. Checkout is a one-way door: pressing Back
         from Shopify's page should return to the cart, not to this
         intermediate screen which would immediately forward them again. */
      window.location.replace(url.toString());
    })().catch(() => {
      setRedirecting(false);
      setError("We couldn't reach checkout. Please try again.");
    });
  }, [ready, redirecting, lines.length, checkoutUrl, auth]);

  if (!ready) {
    return (
      <div className="container py-24">
        <div className="mx-auto h-64 max-w-md animate-pulse rounded-2xl bg-surface" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container flex flex-col items-center py-24 text-center">
        <h1 className="text-[1.5rem] font-bold tracking-[-0.02em] text-ink">
          Your cart is empty
        </h1>
        <p className="mt-2 max-w-sm text-[0.9rem] leading-relaxed text-muted">
          Add something to it and checkout will be here waiting.
        </p>
        <Link
          href="/categories"
          className="mt-6 inline-flex h-12 items-center rounded-xl bg-night px-7 text-sm font-semibold text-white transition-colors hover:bg-night-deep"
        >
          Shop the range
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-16 md:py-24">
      <div className="mx-auto max-w-md text-center">
        {error ? (
          <>
            <h1 className="text-[1.4rem] font-bold tracking-[-0.02em] text-ink">
              Something went wrong
            </h1>
            <p className="mt-2 text-[0.9rem] leading-relaxed text-muted">
              {error}
            </p>
            <Link
              href="/cart"
              className="mt-6 inline-flex h-12 items-center rounded-xl bg-night px-7 text-sm font-semibold text-white transition-colors hover:bg-night-deep"
            >
              Back to cart
            </Link>
          </>
        ) : (
          <>
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface">
              <Loader2 size={24} className="animate-spin text-muted" />
            </span>

            <h1 className="mt-5 text-[1.4rem] font-bold tracking-[-0.02em] text-ink">
              Taking you to secure checkout
            </h1>

            {/* The total is repeated here on purpose. This screen appears for
                a second or two, and seeing the amount carried across is what
                makes the hand-off to a different domain feel deliberate
                rather than like being bounced somewhere unexpected. */}
            <p className="mt-2 text-[0.9rem] leading-relaxed text-muted">
              {totals.itemCount} {totals.itemCount === 1 ? "item" : "items"} ·{" "}
              <span className="font-semibold text-ink">
                {formatPrice(totals.total || totals.subtotal)}
              </span>
            </p>

            <div className="mt-8 space-y-2.5 text-left">
              {[
                { icon: Lock, text: "Payment handled entirely by Shopify" },
                { icon: ShieldCheck, text: "We never see or store your card details" },
                { icon: ArrowRight, text: "Delivery and taxes calculated at the next step" },
              ].map(({ icon: Icon, text }) => (
                <p
                  key={text}
                  className="flex items-center gap-2.5 text-[0.82rem] text-muted"
                >
                  <Icon size={15} className="shrink-0" />
                  {text}
                </p>
              ))}
            </div>

            {/* A manual escape hatch. If the automatic redirect is blocked —
                some in-app browsers and privacy extensions do block
                programmatic navigation — this is the difference between a
                stuck page and a completed order. */}
            {checkoutUrl && (
              <a
                href={checkoutUrl}
                className="mt-8 inline-block text-[0.82rem] font-medium text-azure underline underline-offset-4 hover:text-azure-ink"
              >
                Not redirected? Continue to checkout
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}
