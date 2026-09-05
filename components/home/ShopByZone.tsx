import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ZONE_TILES } from "@/constants/home";
import { PLACEHOLDER_IMAGES } from "@/constants/products";
import { SectionHead } from "@/components/common/SectionHead";

/**
 * "Shop by zone" — the office-furniture equivalent of Wakefit's Shop By Rooms.
 *
 * Rooms are how a home shopper thinks; zones are how an office buyer thinks.
 * Someone specifying a floor is solving for "what goes in the meeting room",
 * not "show me tables", so this entry point often outperforms the category
 * grid for larger baskets.
 */
export function ShopByZone() {
  return (
    <section className="section-retail bg-sand">
      <div className="container">
        <SectionHead
          kicker="Fit out a whole space"
          title="Shop by zone"
          description="Everything a cabin, floor or breakout area needs, grouped the way you plan it."
        />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
          {ZONE_TILES.map((zone, i) => (
            <Link
              key={zone.label}
              href={zone.href}
              className="group overflow-hidden rounded-2xl border border-line bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lift"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                <Image
                  src={PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length]}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 45vw, 200px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-3">
                <p className="text-[0.82rem] font-bold leading-tight text-ink">
                  {zone.label}
                </p>
                <p className="clamp-2 mt-0.5 text-[0.7rem] leading-snug text-muted">
                  {zone.blurb}
                </p>
                <span className="mt-2 flex items-center gap-1 text-[0.72rem] font-semibold text-accent">
                  Shop
                  <ArrowRight
                    size={12}
                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
