import Link from "next/link";
import { ArrowRight, Building2, FileText, Truck, Users } from "lucide-react";

const POINTS = [
  { icon: Users, label: "Volume pricing", detail: "From 10 seats up" },
  { icon: Building2, label: "Floor assessment", detail: "Before you commit" },
  { icon: Truck, label: "Staggered delivery", detail: "Around your shifts" },
  { icon: FileText, label: "GST invoicing", detail: "And AMC contracts" },
];

/**
 * "Officemate for Business" — the bulk-order band.
 *
 * The old enquiry-only site treated this as the whole business model. On a
 * retail storefront it becomes one band among many, but it stays prominent:
 * the average B2B order here is worth dozens of retail baskets, and a floor
 * manager who lands on the consumer site needs an obvious exit to the trade
 * flow rather than being funnelled into adding a hundred chairs to a cart.
 */
export function BulkOrderBand() {
  return (
    <section className="section-retail bg-white">
      <div className="container">
        <div className="overflow-hidden rounded-3xl bg-night">
          <div className="grid gap-8 p-7 md:grid-cols-[1.1fr_1fr] md:items-center md:p-10">
            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-accent">
                Offices · Hostels · Hotels · Enterprise
              </p>
              <h2 className="mt-2 text-[1.5rem] font-bold leading-tight tracking-[-0.02em] text-white md:text-[2rem]">
                Officemate for Business
              </h2>
              <p className="mt-3 max-w-md text-[0.9rem] leading-relaxed text-white/70">
                Fitting out a floor rather than a desk? Our workspace team quotes
                volume pricing, assesses the site and schedules delivery so no
                team loses a working day.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/contact?intent=bulk"
                  className="group inline-flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-white transition-all hover:bg-accent-deep active:scale-[0.98]"
                >
                  Place a bulk order
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>
                <Link
                  href="/projects"
                  className="inline-flex h-12 items-center rounded-full border border-white/25 px-7 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/10"
                >
                  See past projects
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {POINTS.map(({ icon: Icon, label, detail }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-night-line bg-night-soft p-4"
                >
                  <Icon size={18} className="text-accent" />
                  <p className="mt-2.5 text-[0.85rem] font-semibold text-white">
                    {label}
                  </p>
                  <p className="mt-0.5 text-[0.72rem] text-white/55">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
