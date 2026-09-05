"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import type { ShopItem } from "@/lib/catalog";
import { galleryFor } from "@/constants/products";
import { ProductRender } from "@/components/common/ProductRender";
import { AddToCartButton } from "@/components/commerce/AddToCartButton";
import { WishlistButton } from "@/components/commerce/WishlistButton";
import { discountPercent, formatINR } from "@/lib/commerce";
import { cn } from "@/lib/utils";

/**
 * Catalogue tile, following the Frido card.
 *
 * Distinct from ProductCard, which takes a full `Product` and always has a
 * real price. This one takes a resolved `ShopItem` and must handle the case
 * where pricing is estimated — the majority of the real Officemate catalogue
 * today.
 *
 * When pricing is estimated it shows an indicative "from" price and an enquiry
 * link rather than an Add-to-cart button. Putting a Buy button on a number we
 * invented would be the single worst thing this build could ship: it invites
 * an order at a price the business never agreed to. For the same reason an
 * estimated item shows no discount pill — a saving off an invented number is
 * an invented saving.
 *
 * The card carries a hairline border and pads its own contents, so the image
 * well sits inset rather than bleeding to the card edge — the Frido treatment.
 * Note ProductCard is still borderless; the two will look different wherever
 * they appear on the same page.
 *
 * Reading order down the card: photo, rating, attribute chips, name, colours,
 * rule, price, discount, Add to cart. The rule separates "what this is" from
 * "what it costs", which is the split a shopper is actually making.
 *
 * Where a product has more than one photo the card cycles through them on
 * hover, with dots over the image showing position. Only a handful of models
 * have galleries today, so most cards show one still image and no dots — that
 * is correct rather than broken: dots under a single shot promise views that
 * do not exist.
 */
export function CatalogCard({ item }: { item: ShopItem }) {
  const off = discountPercent(item.price, item.compareAtPrice);
  const href = `/products/${item.slug}`;

  /* Capped at four. The Zenpro gallery runs to ten shots including the
     annotated feature panels, and preloading all of them for a card in a rail
     costs far more than the hover effect is worth. */
  const shots = useMemo(() => {
    const gallery = galleryFor(item.slug);
    const list = gallery.length > 0 ? gallery : item.image ? [item.image] : [];
    return list.slice(0, 4);
  }, [item.slug, item.image]);

  /* Two chips maximum — a third wraps and pushes the price down. Falls back to
     the series name so a quote-only model, which has no `product` record and
     therefore no badges, still gets one line of context instead of a gap. */
  const chips = useMemo(() => {
    const badges = item.product?.badges ?? [];
    return (badges.length > 0 ? badges : [item.subcategory]).slice(0, 2);
  }, [item.product, item.subcategory]);

  const colors = item.product?.colors ?? [];

  const [hover, setHover] = useState(false);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!hover || shots.length < 2) return;
    const id = window.setInterval(
      () => setIdx((i) => (i + 1) % shots.length),
      900
    );
    return () => window.clearInterval(id);
  }, [hover, shots.length]);

  /* Snap back to the hero shot on the way out, so the resting grid is always
     the same set of images rather than wherever each card happened to stop. */
  useEffect(() => {
    if (!hover) setIdx(0);
  }, [hover]);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group flex h-full flex-col rounded-2xl border border-line bg-card p-2.5 transition-all duration-300 hover:-translate-y-1 hover:border-ink/15 hover:shadow-lift"
    >
      <div className="relative">
        <Link
          href={href}
          /* rounded-xl inside the card's rounded-2xl. A nested corner has to
             be tighter than the one containing it, or the gap between the two
             radii reads as a misalignment. */
          className="relative block aspect-square overflow-hidden rounded-xl bg-surface"
        >
          <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.05]">
            {shots.length > 0 ? (
              shots.map((src, i) => (
                <Image
                  key={src}
                  src={src}
                  /* Only the first shot is described. The rest are alternate
                     views of the same product, and repeating the name four
                     times is noise to a screen reader. */
                  alt={i === 0 ? item.name : ""}
                  fill
                  className={cn(
                    "object-cover transition-opacity duration-500",
                    i === idx ? "opacity-100" : "opacity-0"
                  )}
                  sizes="(max-width: 640px) 45vw, 280px"
                />
              ))
            ) : (
              <ProductRender
                category={item.category}
                color="#C62828"
                label={item.name}
              />
            )}
          </div>
        </Link>

        {/* Rating pill, top-left over the photo. Green rather than star-yellow
            so it reads as a verified score rather than as decoration. */}
        {item.rating != null && (
          <div className="pointer-events-none absolute left-2.5 top-2.5 flex items-center gap-1 rounded-md bg-white/95 px-1.5 py-1 shadow-soft backdrop-blur-sm">
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

        <WishlistButton
          slug={item.slug}
          name={item.name}
          className="absolute right-2.5 top-2.5"
        />

        {/* Position dots, bottom-centre over the photo. Purely indicative —
            not buttons, because the card is already one big link and nesting
            controls inside it would break the tab order. */}
        {shots.length > 1 && (
          <div className="pointer-events-none absolute bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1">
            {shots.map((src, i) => (
              <span
                key={src}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  i === idx ? "w-4 bg-ink" : "w-1 bg-ink/25"
                )}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col pt-3">
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip}
              /* Azure, not accent red. These are descriptive labels, not calls
                 to action, and a row of red chips on every tile would give the
                 grid a wash of brand colour that means nothing. */
              className="rounded bg-azure-soft px-1.5 py-0.5 text-[0.65rem] font-medium text-azure-ink"
            >
              {chip}
            </span>
          ))}
        </div>

        <Link href={href}>
          <h3 className="clamp-2 text-[0.88rem] font-semibold leading-snug text-ink transition-colors group-hover:text-accent">
            {item.name}
          </h3>
        </Link>

        {colors.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            {colors.slice(0, 4).map((c) => (
              <span
                key={c.name}
                title={c.name}
                /* Hairline ring so a white or cream swatch is still a visible
                   dot rather than a hole in the card. */
                className="h-3.5 w-3.5 rounded-full ring-1 ring-inset ring-black/10"
                style={{ backgroundColor: c.hex }}
              />
            ))}
            {colors.length > 4 && (
              <span className="text-[0.68rem] text-muted">
                +{colors.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto">
          <div className="mt-3 border-t border-line pt-2.5">
            {item.pricingIsEstimated ? (
              <>
                <p className="text-[0.85rem] font-semibold text-ink">
                  From {formatINR(item.price)}
                </p>
                <p className="mt-0.5 text-[0.68rem] text-muted">
                  Indicative — confirm on enquiry
                </p>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-[1.05rem] font-bold text-ink">
                    {formatINR(item.price)}
                  </span>
                  {item.compareAtPrice && (
                    <span className="mrp">{formatINR(item.compareAtPrice)}</span>
                  )}
                </div>
                {off > 0 && (
                  /* Solid green, matching the reference. Green is reserved for
                     savings and stock across this palette and never used for a
                     CTA — a discount is information, not an action. */
                  <span className="mt-1.5 inline-block rounded bg-save px-1.5 py-0.5 text-[0.65rem] font-bold text-white">
                    {off}% OFF
                  </span>
                )}
              </>
            )}
          </div>

          <div className="pt-3">
            {item.product ? (
              <AddToCartButton
                product={item.product}
                variant="dark"
                shape="rounded"
              />
            ) : (
              <Link
                href={`/contact?intent=quote&model=${encodeURIComponent(item.name)}`}
                className={cn(
                  "inline-flex h-11 w-full items-center justify-center rounded-xl",
                  "border border-night bg-white px-3 text-sm font-semibold",
                  "text-ink transition-colors hover:bg-surface"
                )}
              >
                Get a quote
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
