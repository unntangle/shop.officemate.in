import { CATALOG } from "@/lib/catalog";
import { SectionHead } from "@/components/common/SectionHead";
import { CatalogCard } from "@/components/products/CatalogCard";

/**
 * "Best sellers" — a four-up grid below New Arrivals.
 *
 * A grid rather than a rail, deliberately. New Arrivals directly above is a
 * scrolling rail, and two rails back to back read as one long scroller; a
 * static grid gives the eye somewhere to stop.
 *
 * HONEST LIMITATION: there is no sales data in this build, and no product
 * carries a `bestSeller` flag. This ranks by customer rating, which is the
 * closest signal available — so it is really "top rated". Wire it to real
 * order volume before the copy claims anything stronger.
 *
 * It also draws from the same pool of confirmed-price chairs as New Arrivals,
 * because those five are the entire shoppable catalogue right now. Expect
 * overlap until more products have real prices; the ordering differs, but a
 * shopper will recognise the same chairs. The fix is more product data, not a
 * cleverer filter.
 */
const bestSellers = [
  ...CATALOG.filter(
    (i) => i.category === "office-chairs" && !i.pricingIsEstimated
  ),
]
  .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  .slice(0, 4);

export function BestSellers() {
  if (bestSellers.length === 0) return null;

  return (
    /* Grey, matching the oAI advisor section. New Arrivals directly above is
       white, so this band separates the two product surfaces without a rule. */
    <section className="section-retail bg-surface">
      <div className="container">
        <SectionHead
          title="Best sellers"
          href="/categories?category=office-chairs"
          description="The chairs our customers rate highest, in stock and shipping now."
        />

        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {bestSellers.map((item) => (
            <CatalogCard key={item.slug} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
