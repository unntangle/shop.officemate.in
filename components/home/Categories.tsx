"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORIES } from "@/constants/categories";
import { FEATURED } from "@/constants/products";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";
import { ProductCard } from "@/components/products/ProductCard";

const TABS_TO_SHOW = 6; // how many category tabs to display

export function Categories() {
  const [activeTab, setActiveTab] = useState(CATEGORIES[0].slug);

  // Only show FEATURED products (real names + real photos) for the active tab.
  // For tabs where no FEATURED product exists, the empty state is shown.
  const filteredProducts = FEATURED.filter((p) => p.category === activeTab);

  return (
    <section className="pt-10 pb-20 md:pt-12 md:pb-28 lg:pt-14 lg:pb-32">
      <div className="container">
        {/* Header row */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Shop by category"
            title="A workspace, considered end to end"
          />
          <Reveal>
            <Link
              href="/categories"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-ink"
            >
              View all categories
              <ArrowUpRight
                size={16}
                className="text-azure transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </Reveal>
        </div>

        {/* Tab underlines */}
        <div className="mt-8 flex border-b border-line">
          {CATEGORIES.slice(0, TABS_TO_SHOW).map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setActiveTab(cat.slug)}
              className={`relative flex-1 pb-3 pt-1 text-center text-sm font-medium transition-colors duration-200 ${
                activeTab === cat.slug
                  ? "text-ink"
                  : "text-muted hover:text-ink"
              }`}
            >
              {cat.name}
              {activeTab === cat.slug && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 h-0.5 w-full bg-accent"
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 grid grid-cols-2 gap-4 pb-4 md:grid-cols-3 lg:grid-cols-4"
          >
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-muted">
                <p className="text-base">No products in this category yet.</p>
                <Link
                  href="/categories"
                  className="mt-3 text-sm font-medium text-azure underline-offset-4 hover:underline"
                >
                  Browse all categories
                </Link>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* "See all in category" link */}
        {filteredProducts.length > 0 && (
          <div className="mt-6 text-center">
            <Link
              href={`/categories?category=${activeTab}`}
              className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-5 py-2 text-sm font-medium text-ink transition-all hover:border-azure hover:text-azure"
            >
              See all{" "}
              {CATEGORIES.find((c) => c.slug === activeTab)?.name}
              <ArrowUpRight
                size={15}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
