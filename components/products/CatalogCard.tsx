"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import type { ShopItem } from "@/lib/catalog";
import { ProductRender } from "@/components/common/ProductRender";
import { AddToCartButton } from "@/components/commerce/AddToCartButton";
import { WishlistButton } from "@/components/commerce/WishlistButton";
import { discountPercent, formatINR } from "@/lib/commerce";
import { cn } from "@/lib/utils";

/**
 * Catalogue tile for the listing page.
 *
 * Distinct from ProductCard, which takes a full `Product` and always has a
 * real price. This one takes a resolved `ShopItem` and must handle the case
 * where pricing is estimated — the majority of the real Officemate catalogue
 * today.
 *
 * When pricing is estimated it shows an indicative "from" price and an enquiry
 * link rather than an Add-to-cart button. Putting a Buy button on a number we
 * invented would be the single worst thing this build could ship: it invites
 * an order at a price the business never agreed to.
 */
export function CatalogCard({ item }: { item: ShopItem }) {
  const off = discountPercent(item.price, item.compareAtPrice);
  const href = `/products/${item.slug}`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col overflow-hidden rounded-2xl bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative">
        <Link
          href={href}
          className="relative block aspect-square overflow-hidden rounded-2xl bg-surface"
        >
          <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.05]">
            {item.image ? (
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 45vw, 280px"
              />
            ) : (
              <ProductRender
                category={item.category}
                color="#C62828"
                label={item.name}
              />
            )}
          </div>
        </Link>

        {!item.pricingIsEstimated && off > 0 && (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-accent px-2 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-white">
            {off}% off
          </span>
        )}

        <WishlistButton
          slug={item.slug}
          name={item.name}
          className="absolute right-2.5 top-2.5"
        />

        {item.rating != null && (
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-md bg-white/95 px-1.5 py-1 shadow-soft backdrop-blur-sm">
            <Star size={11} className="fill-rated text-rated" />
            <span className="text-[0.7rem] font-bold text-ink">
              {item.rating.toFixed(1)}
            </span>
            {item.reviewCount != null && (
              <span className="text-[0.68rem] text-muted">
                ({item.reviewCount.toLocaleString("en-IN")})
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1 pt-3.5">
        <p className="text-[0.68rem] uppercase tracking-wide text-muted">
          {item.subcategory}
        </p>

        <Link href={href}>
          <h3 className="clamp-2 mt-0.5 text-[0.88rem] font-semibold leading-snug text-ink transition-colors group-hover:text-accent">
            {item.name}
          </h3>
        </Link>

        {item.pricingIsEstimated ? (
          <div className="mt-2">
            <p className="text-[0.8rem] font-semibold text-ink">
              From {formatINR(item.price)}
            </p>
            <p className="mt-0.5 text-[0.68rem] text-muted">
              Indicative — confirm on enquiry
            </p>
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
            <span className="text-[1.05rem] font-bold text-ink">
              {formatINR(item.price)}
            </span>
            {item.compareAtPrice && (
              <span className="mrp">{formatINR(item.compareAtPrice)}</span>
            )}
            {off > 0 && (
              <span className="text-[0.75rem] font-semibold text-save">
                {off}% off
              </span>
            )}
          </div>
        )}

        <div className="mt-auto pt-3">
          {item.product ? (
            <AddToCartButton product={item.product} size="sm" />
          ) : (
            <Link
              href={`/contact?intent=quote&model=${encodeURIComponent(item.name)}`}
              className={cn(
                "inline-flex h-9 w-full items-center justify-center rounded-full",
                "border border-accent bg-white px-3 text-[0.78rem] font-semibold uppercase tracking-[0.04em]",
                "text-accent transition-colors hover:bg-accent-soft"
              )}
            >
              Get a quote
            </Link>
          )}
        </div>
      </div>
    </motion.article>
  );
}
