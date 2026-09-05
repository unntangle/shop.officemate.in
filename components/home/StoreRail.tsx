import Image from "next/image";
import { Clock, MessageCircle } from "lucide-react";
import { STORES } from "@/constants/home";
import { SITE } from "@/constants/site";
import { SectionHead } from "@/components/common/SectionHead";

/**
 * Store locator rail, following the Frido card.
 *
 * Furniture is a considered purchase that people still want to sit in before
 * committing, so the physical footprint is a conversion asset, not an
 * afterthought — which is why both references give it a full band rather than
 * burying the addresses in the footer.
 *
 * Two buttons per card, and the hierarchy between them is deliberate: Get
 * directions is the primary action in solid charcoal, WhatsApp is the fallback
 * for people who want to ask before travelling. Frido uses the same split.
 *
 * NO CITY FILTER TABS, unlike the reference. Frido has dozens of stores across
 * eight cities, so tabs do real work there. Officemate has four centres in
 * four different cities — every tab would filter to exactly one card, which is
 * a control that costs a click and tells the shopper nothing they cannot
 * already see.
 *
 * A grid, not a rail. Four cards fit a desktop row exactly, and fixed-width
 * cards in a scroller left a band of empty space to the right of the last one.
 * If the footprint grows past eight or so, switch back to `Rail` — but then
 * the cards want percentage widths, not fixed rem.
 */

/** wa.me wants a bare international number — no +, spaces or dashes. */
const waNumber = SITE.phone.replace(/\D/g, "");

export function StoreRail() {
  return (
    <section className="section-retail bg-sand">
      <div className="container">
        <SectionHead
          title="Visit our experience centres"
          href="/contact#stores"
          linkLabel={`${STORES.length} locations`}
          description="Book a slot or walk in — the full range is on the floor."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STORES.map((store) => (
            <article
              key={store.city}
              className="flex flex-col rounded-2xl border border-line bg-white p-2.5"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface">
                <Image
                  src={store.image}
                  alt={`Officemate experience centre, ${store.city}`}
                  fill
                  sizes="(max-width: 640px) 70vw, 280px"
                  className="object-cover"
                />
              </div>

              <div className="flex flex-1 flex-col pt-3">
                {/* Only rendered once real trading hours exist — see STORES. */}
                {store.hours && (
                  <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-md bg-azure-soft px-2 py-1 text-[0.7rem] font-medium text-azure-ink">
                    <Clock size={12} />
                    {store.hours}
                  </span>
                )}

                <h3 className="text-[0.95rem] font-bold text-ink">
                  {store.building}, {store.city}
                </h3>

                {/* Address lines stay separate strings rather than one joined
                    block, so they break the way they would on an envelope
                    instead of wherever the card width happens to land. */}
                <address className="mt-1 text-[0.78rem] not-italic leading-relaxed text-muted">
                  {store.address.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>

                {/* mt-auto pins the buttons to the bottom so they line up
                    across the row even though addresses differ in length. */}
                <div className="mt-auto space-y-2 pt-4">
                  <a
                    href={store.map}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 w-full items-center justify-center rounded-xl bg-night text-[0.85rem] font-semibold text-white transition-colors hover:bg-night-deep"
                  >
                    Get directions
                  </a>

                  <a
                    href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                      `Hi, I'd like to know more about the Officemate experience centre in ${store.city}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-surface text-[0.85rem] font-semibold text-ink transition-colors hover:bg-line"
                  >
                    <MessageCircle size={15} className="text-save" />
                    Talk to us
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
