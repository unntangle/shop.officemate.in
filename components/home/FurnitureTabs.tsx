"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FURNITURE_TABS } from "@/constants/home";
import { PLACEHOLDER_IMAGES, SUBCATEGORY_IMAGES } from "@/constants/products";
import { SectionHead } from "@/components/common/SectionHead";
import { cn } from "@/lib/utils";

/**
 * "Furnitures" — the tabbed sub-range browser from the Wakefit reference.
 *
 * This overlaps with Shop By Category on purpose. The grid near the top is for
 * a visitor who knows roughly what they want; this block sits deep in the page
 * for someone who has scrolled past everything without committing, and gives
 * them a second, more granular way in before they reach the footer.
 */
export function FurnitureTabs() {
  const [active, setActive] = useState(0);
  const tab = FURNITURE_TABS[active];

  return (
    <section className="section-retail bg-sand">
      <div className="container">
        <SectionHead
          kicker="Browse the full range"
          title="Office furniture"
          href="/categories"
        />

        <div
          role="tablist"
          aria-label="Furniture ranges"
          className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {FURNITURE_TABS.map((t, i) => (
            <button
              key={t.label}
              role="tab"
              aria-selected={active === i}
              onClick={() => setActive(i)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-[0.8rem] font-semibold transition-all",
                active === i
                  ? "border-accent bg-accent text-white"
                  : "border-line bg-white text-muted hover:border-ink/25 hover:text-ink"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-6">
          {tab.tiles.map((sub, i) => {
            const image =
              SUBCATEGORY_IMAGES[`${tab.category}:${sub}`] ??
              PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length];

            return (
              <Link
                key={sub}
                href={`/categories?category=${tab.category}&sub=${encodeURIComponent(sub)}`}
                className="group block"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-white transition-all duration-300 group-hover:border-accent/40 group-hover:shadow-lift">
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 45vw, 200px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="mt-2 text-center text-[0.76rem] font-semibold leading-snug text-ink transition-colors group-hover:text-accent">
                  {sub}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
