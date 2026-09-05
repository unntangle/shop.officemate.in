"use client";

import { useMemo, useState } from "react";
import { PRODUCTS } from "@/constants/products";
import { CATEGORIES } from "@/constants/categories";
import { Rail } from "@/components/common/Rail";
import { SectionHead } from "@/components/common/SectionHead";
import { ProductCard } from "@/components/products/ProductCard";
import { cn } from "@/lib/utils";

/**
 * "New Arrivals" — tabbed product rail, matching the Wakefit block.
 *
 * Tabs are derived from categories that actually contain new products rather
 * than hardcoded. A tab that opens onto an empty rail is worse than a missing
 * tab: it reads as a loading failure and costs the shopper a click to find out
 * there was nothing there.
 */
export function NewArrivals() {
  const newProducts = useMemo(
    () => PRODUCTS.filter((p) => p.isNew || p.featured),
    []
  );

  const tabs = useMemo(() => {
    const present = new Set(newProducts.map((p) => p.category));
    return [
      { slug: "all", name: "All" },
      ...CATEGORIES.filter((c) => present.has(c.slug)).map((c) => ({
        slug: c.slug as string,
        name: c.name,
      })),
    ];
  }, [newProducts]);

  const [active, setActive] = useState("all");

  const shown =
    active === "all"
      ? newProducts
      : newProducts.filter((p) => p.category === active);

  if (newProducts.length === 0) return null;

  return (
    <section className="section-retail bg-white">
      <div className="container">
        <SectionHead
          kicker="Just landed"
          title="New arrivals"
          href="/products?sort=newest"
          description="The latest additions to the range, in stock and shipping now."
        />

        <div
          role="tablist"
          aria-label="New arrival categories"
          className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map((tab) => (
            <button
              key={tab.slug}
              role="tab"
              aria-selected={active === tab.slug}
              onClick={() => setActive(tab.slug)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-[0.8rem] font-semibold transition-all",
                active === tab.slug
                  ? "border-accent bg-accent text-white"
                  : "border-line bg-white text-muted hover:border-ink/25 hover:text-ink"
              )}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <Rail ariaLabel="New arrivals">
          {shown.map((product) => (
            <ProductCard
              key={product.slug}
              product={product}
              compact
              className="w-[10.5rem] sm:w-[13rem] md:w-[15rem]"
            />
          ))}
        </Rail>
      </div>
    </section>
  );
}
