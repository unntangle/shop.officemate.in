import { CATALOG } from "@/lib/catalog";
import { Rail } from "@/components/common/Rail";
import { SectionHead } from "@/components/common/SectionHead";
import { CatalogCard } from "@/components/products/CatalogCard";

/**
 * "New Arrivals" — a looping rail of the chairs we can actually sell.
 *
 * Sourced from CATALOG, not PRODUCTS. That matters for names: `PRODUCTS` still
 * holds mock records from the original showcase build — "Aeris Glide Ergo",
 * "Aeris Mesh Task Pro" and friends — and Aeris is not Officemate. CATALOG
 * merges those with `CHAIR_MODELS`, the 44 real models taken verbatim from
 * officemate.in, so every name on this rail is one the business actually sells.
 *
 * Filtered to items with CONFIRMED pricing, which today is exactly five:
 * Zenpro, Webstar, Jupiter, Ferro and Altura. That is a data condition rather
 * than a hardcoded list of slugs, so as real prices and photography land the
 * rail fills out on its own — and it can never promote a chair whose price
 * `lib/catalog.ts` invented from SERIES_PRICING.
 *
 * Still CatalogCard rather than ProductCard: the card handles the estimated
 * case correctly if this filter is ever relaxed.
 */
const chairs = CATALOG.filter(
  (i) => i.category === "office-chairs" && !i.pricingIsEstimated
);

/**
 * The five, run twice, for a ten-card rail.
 *
 * This is a straight duplication, not a carousel clone trick — the same five
 * chairs appear twice in the DOM with their own links and Add-to-cart buttons.
 * Two costs worth knowing about:
 *
 *  - A screen reader announces every chair twice, and keyboard users tab
 *    through ten cards to pass five products.
 *  - Anything that counts cards (analytics impressions, for one) will double
 *    count.
 *
 * Neither is fixable by hiding the second pass: `aria-hidden` on a container
 * with focusable links inside it is worse than the duplication, because it
 * hides controls that can still be tabbed to. The real fix is more products.
 */
const cards = [...chairs, ...chairs];

export function NewArrivals() {
  /* An empty rail under a live section head reads as a loading failure. */
  if (chairs.length === 0) return null;

  return (
    /* White. The oAI advisor section directly below is `bg-surface` grey and
       carries the band, so this staying white keeps the two apart — the page
       alternates grounds so adjacent sections never run together. */
    <section className="section-retail bg-white">
      <div className="container">
        <SectionHead
          kicker="Just landed"
          title="New arrivals"
          href="/products?category=office-chairs"
          description="The full seating range — executive, task, training and cafe."
        />

        <Rail ariaLabel="Office chairs" controls autoplay>
          {cards.map((item, i) => (
            /* Width lives on a wrapper because CatalogCard takes no className.
               `shrink-0` stops the flex scroller squeezing the cards into one
               screen instead of letting them overflow.

               Widths are percentages minus a share of the gap, so exactly four
               cards land per screen on desktop rather than four-and-a-sliver.
               `.rail` is gap-3 (0.75rem) rising to gap-4 (1rem) at md, and n
               cards carry n-1 gaps — hence 25% minus 0.75rem at lg, and 50%
               minus half a gap at the two-up sizes. Change the rail gap and
               these have to change with it.

               Key is slug + index because the slug alone is no longer unique
               once the list is doubled — React would drop the second pass. */
            <div
              key={`${item.slug}-${i}`}
              className="w-[72%] shrink-0 sm:w-[calc(50%-0.375rem)] md:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]"
            >
              <CatalogCard item={item} />
            </div>
          ))}
        </Rail>
      </div>
    </section>
  );
}
