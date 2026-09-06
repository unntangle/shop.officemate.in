"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useCart } from "@/components/commerce/CartProvider";
import { PRODUCTS } from "@/constants/products";
import { ProductCard } from "@/components/products/ProductCard";

/**
 * Saved items.
 *
 * Resolves slugs against the live catalogue rather than storing a product
 * snapshot. A wishlist can sit untouched for months, and a snapshot would keep
 * showing last year's price on a product that has since changed or been
 * discontinued — silently dropping a slug that no longer resolves is the
 * safer failure.
 */
export default function WishlistPage() {
  const { wishlist, ready } = useCart();

  const saved = wishlist
    .map((slug) => PRODUCTS.find((p) => p.slug === slug))
    .filter((p): p is (typeof PRODUCTS)[number] => Boolean(p));

  if (!ready) {
    return (
      <div className="container py-16">
        <div className="h-8 w-44 animate-pulse rounded-full bg-surface" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-10">
      <div className="container">
        <h1 className="text-[1.6rem] font-bold tracking-[-0.02em] text-ink md:text-[2rem]">
          Saved items
          {saved.length > 0 && (
            <span className="ml-2 text-base font-normal text-muted">
              {saved.length}
            </span>
          )}
        </h1>

        {saved.length === 0 ? (
          <div className="mx-auto mt-12 flex max-w-md flex-col items-center text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-surface">
              <Heart size={30} className="text-muted" />
            </span>
            <h2 className="mt-6 text-xl font-bold text-ink">Nothing saved yet</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Tap the heart on any product to keep it here while you compare.
            </p>
            <Link
              href="/categories"
              className="mt-7 inline-flex h-12 items-center rounded-full bg-accent px-7 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
            >
              Browse the range
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {saved.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
