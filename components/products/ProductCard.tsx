"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Product } from "@/types";

import { PRODUCT_IMAGES } from "@/constants/products";
import { ProductRender } from "@/components/common/ProductRender";
import { AddToCartButton } from "@/components/commerce/AddToCartButton";
import { WishlistButton } from "@/components/commerce/WishlistButton";
import { formatINR, stockNotice } from "@/lib/commerce";
import { cn } from "@/lib/utils";

/**
 * Retail product tile, following the Frido card.
 *
 * Reading order down the card: photo, name, colours, then a rule, then price,
 * then Add to cart. The rule matters more than it looks — it separates "what
 * this is" from "what it costs", which is the split a shopper is actually
 * making, and it is the thing that stops a dense card reading as one
 * undifferentiated block of text.
 *
 * No rating pill, no discount badge and no attribute chips. All were removed
 * deliberately: the saving is still legible from the struck-through MRP beside
 * the price, and `discountPercent`, `product.rating` and `product.badges` are
 * untouched in the data if any of them need to come back.
 *
 * Price and button sit inside an `mt-auto` group so buttons line up across a
 * row even when names wrap to different heights. A ragged row of buttons reads
 * as broken layout and measurably slows the scan.
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
                sizes={
                  compact
                    ? "(max-width: 640px) 60vw, 240px"
                    : "(max-width: 640px) 45vw, 280px"
                }
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

        <WishlistButton
          slug={product.slug}
          name={product.name}
          className="absolute right-2.5 top-2.5"
        />
      </div>

      <div
        className={cn("flex flex-1 flex-col", compact ? "px-1 pt-3" : "px-1 pt-3.5")}
      >
        <Link href={href}>
          <h3 className="clamp-2 text-[0.85rem] font-semibold leading-snug text-ink transition-colors group-hover:text-accent">
            {product.name}
          </h3>
        </Link>

        {product.colors.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            {product.colors.slice(0, 4).map((c) => (
              <span
                key={c.name}
                title={c.name}
                /* Hairline ring so a white or cream swatch is still a visible
                   dot rather than a hole in the card. */
                className="h-3.5 w-3.5 rounded-full ring-1 ring-inset ring-black/10"
                style={{ backgroundColor: c.hex }}
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-[0.68rem] text-muted">
                +{product.colors.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto">
          <div className="mt-3 border-t border-line pt-2.5">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-[1.05rem] font-bold text-ink">
                {formatINR(product.price)}
              </span>
              {product.compareAtPrice && (
                <span className="mrp">{formatINR(product.compareAtPrice)}</span>
              )}
            </div>

            {notice && (
              <span
                className={cn(
                  "mt-1.5 block text-[0.7rem] font-semibold",
                  product.stock === 0 ? "text-muted" : "text-accent"
                )}
              >
                {notice}
              </span>
            )}
          </div>

          <div className="pt-3">
            <AddToCartButton product={product} size="sm" />
          </div>
        </div>
      </div>
    </motion.article>
  );
}
