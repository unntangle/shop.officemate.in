"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import type { Product } from "@/types";

import { PRODUCT_IMAGES } from "@/constants/products";
import { ProductRender } from "@/components/common/ProductRender";
import { AddToCartButton } from "@/components/commerce/AddToCartButton";
import { WishlistButton } from "@/components/commerce/WishlistButton";
import { discountPercent, formatINR, stockNotice } from "@/lib/commerce";
import { cn } from "@/lib/utils";

/**
 * Retail product tile.
 *
 * Information order follows how people actually scan a grid: picture, then
 * rating, then name, then price. The Add-to-cart button is pinned to the
 * bottom with `mt-auto` so buttons line up across a row even when names wrap
 * to different heights — a ragged row of buttons reads as broken layout and
 * measurably slows the scan.
 */
export function ProductCard({
  product,
  compact = false,
  className,
}: {
  product: Product;
  /** Narrower variant used inside horizontal rails. */
  compact?: boolean;
  className?: string;
}) {
  const imageSrc = PRODUCT_IMAGES[product.slug];
  const off = discountPercent(product.price, product.compareAtPrice);
  const notice = stockNotice(product);
  const href = `/products/${product.slug}`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl bg-card",
        /* Borderless. Frido separates cards with white space and a grey image
           well rather than an outline — a visible border on every tile turns a
           product rail into a table and fights the airy section rhythm. The
           shadow only appears on hover, so the resting grid stays flat. */
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-lift",
        className
      )}
    >
      <div className="relative">
        <Link
          href={href}
          /* The grey well is the card's frame. It carries the rounded corner
             itself rather than relying on the parent's overflow clip, so the
             image area still reads as a distinct tile once the border is gone. */
          className="relative block aspect-square overflow-hidden rounded-2xl bg-surface"
        >
          <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.05]">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={product.name}
                fill
                className="object-cover"
                sizes={compact ? "(max-width: 640px) 60vw, 240px" : "(max-width: 640px) 45vw, 280px"}
              />
            ) : (
              <ProductRender
                category={product.category}
                color={product.swatch}
                label={product.name}
              />
            )}
          </div>
        </Link>

        {/* Top-left flags. Only one shows at a time — stacking "New" over
            "Bestseller" over "-24%" turns the corner into a sticker wall and
            none of the three gets read. Discount wins because it's the only
            one that changes the decision. */}
        <div className="pointer-events-none absolute left-2.5 top-2.5">
          {off > 0 ? (
            <span className="rounded-md bg-accent px-2 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-white">
              {off}% off
            </span>
          ) : product.isNew ? (
            <span className="rounded-md bg-night px-2 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-white">
              New
            </span>
          ) : product.bestSeller ? (
            <span className="rounded-md bg-night px-2 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-white">
              Bestseller
            </span>
          ) : null}
        </div>

        <WishlistButton
          slug={product.slug}
          name={product.name}
          className="absolute right-2.5 top-2.5"
        />

        {/* Rating pill, bottom-left over the photo — the Frido/Wakefit
            convention. Green rather than star-yellow so it reads as a verified
            score rather than as decoration. */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-md bg-white/95 px-1.5 py-1 shadow-soft backdrop-blur-sm">
          <Star size={11} className="fill-rated text-rated" />
          <span className="text-[0.7rem] font-bold text-ink">
            {product.rating.toFixed(1)}
          </span>
          <span className="text-[0.68rem] text-muted">
            ({product.reviewCount.toLocaleString("en-IN")})
          </span>
        </div>
      </div>

      <div className={cn("flex flex-1 flex-col", compact ? "px-1 pt-3" : "px-1 pt-3.5")}>
        <Link href={href}>
          <h3 className="clamp-2 text-[0.85rem] font-semibold leading-snug text-ink transition-colors group-hover:text-accent">
            {product.name}
          </h3>
        </Link>

        <p className="clamp-1 mt-1 text-[0.75rem] text-muted">{product.tagline}</p>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[1.05rem] font-bold text-ink">
            {formatINR(product.price)}
          </span>
          {product.compareAtPrice && (
            <span className="mrp">{formatINR(product.compareAtPrice)}</span>
          )}
          {off > 0 && (
            <span className="text-[0.75rem] font-semibold text-save">
              {off}% off
            </span>
          )}
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-[0.7rem] text-muted">
            {product.colors.length} colour{product.colors.length === 1 ? "" : "s"}
          </span>
          {notice && (
            <span
              className={cn(
                "text-[0.7rem] font-semibold",
                product.stock === 0 ? "text-muted" : "text-accent"
              )}
            >
              {notice}
            </span>
          )}
        </div>

        <div className="mt-auto pt-3">
          <AddToCartButton product={product} size="sm" />
        </div>
      </div>
    </motion.article>
  );
}
