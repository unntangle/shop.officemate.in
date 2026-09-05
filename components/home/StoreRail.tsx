import Link from "next/link";
import { MapPin, Navigation } from "lucide-react";
import { STORES } from "@/constants/home";
import { Rail } from "@/components/common/Rail";
import { SectionHead } from "@/components/common/SectionHead";

/**
 * Store locator rail.
 *
 * Furniture is a considered purchase that people still want to sit in before
 * committing, so the physical footprint is a conversion asset, not an
 * afterthought — which is why both references give it a full band rather than
 * burying the addresses in the footer.
 */
export function StoreRail() {
  return (
    <section className="section-retail bg-sand">
      <div className="container">
        <SectionHead
          kicker="Sit in it first"
          title="Officemate stores"
          href="/contact#stores"
          linkLabel={`${STORES.length} locations`}
          description="Book a slot or walk in — the full range is on the floor."
        />

        <Rail ariaLabel="Officemate store locations">
          {STORES.map((store) => (
            <Link
              key={`${store.city}-${store.area}`}
              href="/contact#stores"
              className="group w-[10.5rem] rounded-2xl border border-line bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lift sm:w-[11.5rem]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
                <MapPin size={17} />
              </span>
              <p className="mt-3 text-[0.9rem] font-bold text-ink">{store.city}</p>
              <p className="text-[0.75rem] text-muted">{store.area}</p>
              <p className="mt-2 text-[0.68rem] uppercase tracking-wide text-muted">
                {store.label} · {store.since}
              </p>
              <span className="mt-3 flex items-center gap-1 text-[0.75rem] font-semibold text-accent">
                <Navigation size={12} />
                Get directions
              </span>
            </Link>
          ))}
        </Rail>
      </div>
    </section>
  );
}
