"use client";

import { useState } from "react";
import Link from "next/link";
import { RotateCcw, ShieldCheck, Truck, Wrench } from "lucide-react";
import type { Product } from "@/types";
import { AddToCartButton } from "@/components/commerce/AddToCartButton";
import { WishlistButton } from "@/components/commerce/WishlistButton";
import { QuantityStepper } from "@/components/commerce/QuantityStepper";
import { EnquireButton } from "@/components/common/EnquireButton";
import { useCart } from "@/components/commerce/CartProvider";
import {
  deliveryEstimate,
  discountPercent,
  formatINR,
  stockNotice,
} from "@/lib/commerce";
import { cn } from "@/lib/utils";

const ASSURANCES = [
  { icon: Truck, label: "Free delivery", detail: "On orders above ₹15,000" },
  { icon: Wrench, label: "Free installation", detail: "By a trained team" },
  { icon: ShieldCheck, label: "1-year warranty", detail: "Frame & mechanism" },
  { icon: RotateCcw, label: "7-day returns", detail: "Unused, in packaging" },
];

/**
 * Product detail buy box: price, colour, quantity, add to cart.
 *
 * The colour picker writes into local state rather than a URL param because
 * the cart keys lines on slug + colour — the selection has to be the exact
 * string that goes into the line, and round-tripping it through the URL adds
 * a decoding step where that can silently drift.
 *
 * The enquiry route stays available beneath the cart buttons rather than being
 * removed. Retail and trade buyers land on the same page, and a floor manager
 * pricing forty seats should not have to fake a retail order to reach a human.
 */
export function BuyBox({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [color, setColor] = useState(product.colors[0]?.name ?? "Default");
  const [qty, setQty] = useState(1);

  const off = discountPercent(product.price, product.compareAtPrice);
  const notice = stockNotice(product);
  const outOfStock = product.stock === 0;

  return (
    <div className="space-y-5">
      {/* -------------------------------------------------------- price */}
      <div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[1.75rem] font-bold tracking-[-0.02em] text-ink">
            {formatINR(product.price)}
          </span>
          {product.compareAtPrice && (
            <span className="text-[0.95rem] text-muted line-through">
              {formatINR(product.compareAtPrice)}
            </span>
          )}
          {off > 0 && (
            <span className="rounded-md bg-save-soft px-2 py-1 text-[0.78rem] font-bold text-save">
              {off}% off
            </span>
          )}
        </div>
        <p className="mt-1 text-[0.75rem] text-muted">
          Inclusive of all taxes · Installation included
        </p>
        {notice && (
          <p
            className={cn(
              "mt-2 text-[0.8rem] font-semibold",
              outOfStock ? "text-muted" : "text-accent"
            )}
          >
            {notice}
          </p>
        )}
      </div>

      {/* ------------------------------------------------------- colour */}
      {product.colors.length > 1 && (
        <div>
          <p className="mb-2 text-[0.82rem] font-semibold text-ink">
            Colour: <span className="font-normal text-muted">{color}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((c) => (
              <button
                key={c.name}
                onClick={() => setColor(c.name)}
                aria-label={c.name}
                aria-pressed={color === c.name}
                title={c.name}
                className={cn(
                  "h-9 w-9 rounded-full border-2 transition-all",
                  color === c.name
                    ? "border-accent ring-2 ring-accent/25 ring-offset-1"
                    : "border-line hover:border-ink/30"
                )}
                style={{ background: c.hex }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------- quantity */}
      <div className="flex items-center gap-4">
        <span className="text-[0.82rem] font-semibold text-ink">Quantity</span>
        <QuantityStepper value={qty} onChange={setQty} />
      </div>

      {/* ------------------------------------------------------ actions */}
      <div className="flex items-center gap-2.5">
        <AddToCartButton
          product={product}
          color={color}
          qty={qty}
          size="lg"
          className="flex-1"
        />
        <WishlistButton
          slug={product.slug}
          name={product.name}
          size={19}
          className="h-[3.25rem] w-[3.25rem] shrink-0"
        />
      </div>

      {!outOfStock && (
        <Link
          href="/checkout"
          onClick={() => addItem(product, { color, qty })}
          className="flex h-[3.25rem] w-full items-center justify-center rounded-full border-2 border-accent bg-white text-[0.95rem] font-semibold uppercase tracking-[0.04em] text-accent transition-colors hover:bg-accent-soft"
        >
          Buy it now
        </Link>
      )}

      <p className="text-center text-[0.78rem] text-muted">
        Delivery by <span className="font-semibold text-ink">{deliveryEstimate(product.deliveryDays)}</span>
      </p>

      {/* --------------------------------------------------- assurances */}
      <div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-line bg-sand p-4">
        {ASSURANCES.map(({ icon: Icon, label, detail }) => (
          <div key={label} className="flex items-start gap-2.5">
            <Icon size={16} className="mt-0.5 shrink-0 text-accent" />
            <div className="min-w-0">
              <p className="text-[0.78rem] font-semibold leading-tight text-ink">
                {label}
              </p>
              <p className="text-[0.7rem] leading-snug text-muted">{detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* -------------------------------------------------- trade route */}
      <div className="rounded-2xl border border-line p-4">
        <p className="text-[0.82rem] font-semibold text-ink">
          Buying for a whole floor?
        </p>
        <p className="mt-1 text-[0.75rem] leading-relaxed text-muted">
          Orders of 10 seats or more get volume pricing, a site assessment and
          scheduled installation.
        </p>
        <EnquireButton
          product={product.name}
          variant="outline"
          size="sm"
          label="Request a bulk quote"
          className="mt-3 w-full"
        />
      </div>
    </div>
  );
}
