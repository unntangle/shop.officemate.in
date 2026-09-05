"use client";

import { useState } from "react";
import { Tag, X } from "lucide-react";
import { useCart } from "@/components/commerce/CartProvider";
import { COUPONS, formatINR, resolveCoupon } from "@/lib/commerce";
import { cn } from "@/lib/utils";

/**
 * Price breakdown, shared by the cart and checkout pages.
 *
 * Every line the shopper will be charged is shown before they reach the
 * payment step, including delivery. Revealing a shipping charge only at the
 * final screen is the single largest driver of cart abandonment in retail, and
 * it is entirely self-inflicted.
 */
export function OrderSummary({
  action,
  className,
}: {
  /** Rendered under the totals — the page's primary button. */
  action?: React.ReactNode;
  className?: string;
}) {
  const { totals, coupon, applyCoupon } = useCart();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submitCode = (e: React.FormEvent) => {
    e.preventDefault();
    const result = resolveCoupon(code, totals.subtotal);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    applyCoupon(result.coupon);
    setError(null);
    setCode("");
  };

  return (
    <div className={cn("rounded-2xl border border-line bg-white p-5", className)}>
      <h2 className="text-[0.95rem] font-bold text-ink">Order summary</h2>

      {/* Coupon */}
      <div className="mt-4">
        {coupon ? (
          <div className="flex items-center justify-between rounded-xl border border-dashed border-save bg-save-soft px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <Tag size={15} className="shrink-0 text-save" />
              <div className="min-w-0">
                <p className="truncate text-[0.8rem] font-bold text-save">
                  {coupon.code}
                </p>
                <p className="truncate text-[0.7rem] text-muted">{coupon.label}</p>
              </div>
            </div>
            <button
              onClick={() => applyCoupon(null)}
              aria-label={`Remove coupon ${coupon.code}`}
              className="shrink-0 text-muted transition-colors hover:text-accent"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <form onSubmit={submitCode}>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(null);
                }}
                placeholder="Coupon code"
                aria-label="Coupon code"
                className="h-11 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-sm uppercase text-ink outline-none transition-colors placeholder:normal-case placeholder:text-muted focus:border-accent focus:bg-white"
              />
              <button
                type="submit"
                className="h-11 shrink-0 rounded-full border border-ink/15 px-5 text-[0.82rem] font-semibold text-ink transition-colors hover:border-ink hover:bg-surface"
              >
                Apply
              </button>
            </div>
            {error && <p className="mt-1.5 text-[0.75rem] text-accent">{error}</p>}
            <p className="mt-1.5 text-[0.7rem] text-muted">
              Try {COUPONS[0].code} — {COUPONS[0].label.toLowerCase()}
            </p>
          </form>
        )}
      </div>

      <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">
            Subtotal
            <span className="ml-1 text-[0.75rem]">({totals.itemCount} items)</span>
          </dt>
          <dd className="font-medium text-ink">{formatINR(totals.subtotal)}</dd>
        </div>

        {totals.savings > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted">Discount on MRP</dt>
            <dd className="font-medium text-save">
              −{formatINR(totals.savings)}
            </dd>
          </div>
        )}

        {totals.couponDiscount > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted">Coupon ({coupon?.code})</dt>
            <dd className="font-medium text-save">
              −{formatINR(totals.couponDiscount)}
            </dd>
          </div>
        )}

        <div className="flex justify-between">
          <dt className="text-muted">Delivery</dt>
          <dd
            className={cn(
              "font-medium",
              totals.shipping === 0 ? "text-save" : "text-ink"
            )}
          >
            {totals.shipping === 0 ? "Free" : formatINR(totals.shipping)}
          </dd>
        </div>

        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <dt className="font-bold text-ink">Total</dt>
          <dd className="text-xl font-bold text-ink">{formatINR(totals.total)}</dd>
        </div>
      </dl>

      <p className="mt-1.5 text-[0.7rem] text-muted">
        Inclusive of all taxes. Installation included at no extra charge.
      </p>

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
