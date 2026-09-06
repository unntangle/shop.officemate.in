import { MapPin } from "lucide-react";
import { LOCATIONS } from "@/constants/site";
import { STORES } from "@/constants/home";

/**
 * Corporate office + experience centres, the last band inside the footer's
 * grey container before the legal bar.
 *
 * Grouped under two headings rather than run together as one row of five. The
 * corporate office and the retail centres are different kinds of place — one
 * is where the company is registered, the others are where a shopper can sit
 * in a chair — and a flat row made them look like five equivalent branches.
 *
 * The corporate office comes from LOCATIONS; the experience centres come from
 * STORES, the same list the homepage rail renders. That is deliberate:
 * LOCATIONS also carries a single Chennai experience centre, and rendering
 * both lists would print Chennai twice and leave the other three centres
 * invisible. STORES is the source of truth for retail locations — add one
 * there and it appears here, on the homepage and in the count on the store
 * rail's "N locations" link, all at once.
 *
 * WHY IT SITS LAST: addresses are the closing signature of a footer, not
 * navigation. Everything above it is something to click; this is the answer
 * to "who are these people and where are they". Note that <FooterLinkCloud />
 * no longer carries a duplicate row of centre links — with the full cards
 * directly beneath it, listing the same four cities twice within one screen
 * was noise. If this block ever moves back above the cloud, that row is worth
 * restoring.
 */
export function FooterAddresses() {
  return (
    <div className="mt-9 grid gap-8 border-t border-line pt-8 lg:grid-cols-[15rem_1fr] lg:gap-10">
      <div>
        <h3 className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-ink">
          Corporate office
        </h3>

        <div className="mt-4">
          {LOCATIONS.filter((loc) => loc.label === "Corporate Office").map(
            (loc) => (
              /* City eyebrow, same as the centres opposite — without it the
                 corporate block reads as a different kind of entry rather
                 than the same card under a different heading. */
              <div key={loc.label}>
                <p className="flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-azure">
                  <MapPin size={13} />
                  Chennai
                </p>
                <p className="mt-2 text-[0.82rem] font-semibold text-ink">
                  {loc.name}
                </p>
                <address className="mt-1 text-[0.78rem] not-italic leading-relaxed text-muted">
                  {loc.lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
                <a
                  href={loc.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-[0.76rem] font-semibold text-azure hover:text-azure-ink"
                >
                  Get directions →
                </a>
              </div>
            )
          )}
        </div>
      </div>

      {/* Divider is a left border on this column rather than a separate
         element, so it stretches to whichever side is taller without any
         height being set. It flips to a top border below `lg`, where the two
         groups stack and a vertical rule would have nothing to sit between.

         `ink/15` rather than `border-line`: the footer ground is #F5F5F5 and
         `line` is #ECECEC, about 4% apart — a real border that nobody can
         see. `line` is calibrated for white surfaces, so anything drawn on
         the grey footer needs its own value. */}
      <div className="border-t border-ink/15 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
        <h3 className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-ink">
          Experience centres
        </h3>

        <div className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {STORES.map((store) => (
            <div key={store.city}>
              {/* City stays as the eyebrow here — with four of these side by
                  side it is the only thing that tells them apart. */}
              <p className="flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-azure">
                <MapPin size={13} />
                {store.city}
              </p>
              <p className="mt-2 text-[0.82rem] font-semibold text-ink">
                {store.building}
              </p>
              <address className="mt-1 text-[0.78rem] not-italic leading-relaxed text-muted">
                {store.address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
              <a
                href={store.map}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-[0.76rem] font-semibold text-azure hover:text-azure-ink"
              >
                Get directions →
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
