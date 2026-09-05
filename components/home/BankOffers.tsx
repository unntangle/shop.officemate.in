"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { BANK_OFFERS, OFFER_FILTERS } from "@/constants/home";
import { SectionHead } from "@/components/common/SectionHead";
import { cn } from "@/lib/utils";

/**
 * Bank offer strip with payment-type filters.
 *
 * The offers are presented as coupons rather than buttons because none of them
 * are actionable here — they apply automatically at payment. Styling them as
 * CTAs would promise a click that leads nowhere, which is a trust cost for a
 * block whose entire job is to make the price feel trustworthy.
 */
export function BankOffers() {
  const [filter, setFilter] = useState<(typeof OFFER_FILTERS)[number]>("All");

  const shown =
    filter === "All"
      ? BANK_OFFERS
      : BANK_OFFERS.filter((o) => o.type === filter);

  return (
    <section className="section-retail bg-white">
      <div className="container">
        <SectionHead
          kicker="Applied automatically at payment"
          title="Bank offers"
        />

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {OFFER_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-[0.78rem] font-semibold transition-all",
                filter === f
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line bg-white text-muted hover:border-ink/25 hover:text-ink"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((offer) => (
            <div
              key={`${offer.bank}-${offer.value}`}
              className="coupon flex items-center gap-3 p-3.5 transition-colors hover:border-accent/50"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-ink">
                <CreditCard size={16} />
              </span>
              <div className="min-w-0">
                <p className="text-[0.85rem] font-bold leading-tight text-accent">
                  {offer.value}
                </p>
                <p className="truncate text-[0.72rem] text-ink">{offer.bank}</p>
                <p className="truncate text-[0.68rem] text-muted">{offer.cap}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 text-[0.7rem] text-muted">
          Offers are subject to issuer terms and cannot be combined with a coupon code.
        </p>
      </div>
    </section>
  );
}
