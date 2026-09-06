"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { FEATURED } from "@/constants/products";
import { ProductCard } from "@/components/products/ProductCard";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";

export function FeaturedProducts() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="section bg-surface overflow-hidden">
      <div className="container">
        {/* Header — matches Categories style */}
        <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
          <SectionHeading
            eyebrow="Best sellers"
            title="Our most-loved workhorses"
          />
          <Reveal>
            <Link
              href="/categories"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-ink"
            >
              View all
              <ArrowUpRight
                size={16}
                className="text-accent transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </Reveal>
        </div>

        {/* Horizontal scroll strip */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pt-4 pb-12 -mb-8 -mx-4 px-4 snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: "none" }}
        >
          {FEATURED.map((product, i) => (
            <motion.div
              key={product.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="flex-none w-[260px] sm:w-[280px] snap-start"
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
