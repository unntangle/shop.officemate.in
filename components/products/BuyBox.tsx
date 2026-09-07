"use client";

import { useState } from "react";
import Link from "next/link";
import { RotateCcw, ShieldCheck, Store, Truck, Video, Wrench } from "lucide-react";
import type { Product } from "@/types";
import { AddToCartButton } from "@/components/commerce/AddToCartButton";
import { QuantityStepper } from "@/components/commerce/QuantityStepper";
import { useCart } from "@/components/commerce/CartProvider";
import { useProductColor } from "@/components/products/ColorProvider";
import { waHrefWithText } from "@/lib/whatsapp";
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
  /* ⚠ PLACEHOLDER. No returns window is written down anywhere in this
     codebase, and this tile is the only place on the site that promises one.
     Confirm the real policy with the client or remove the tile — an unbacked
     returns promise on a buy button is the kind of thing that ends up in a
     consumer complaint. */
  { icon: RotateCcw, label: "7-day returns", detail: "Unused, in packaging" },
];

/**
 * Product detail buy box: price, colour, quantity, add to cart.
 *
 * COLOUR: CHARCOAL, BLUE AND GREY. RED IS RESERVED FOR ERRORS.
 *
 * The primary action is `night` charcoal and the secondary is an outlined
 * charcoal, matching the cart, checkout and category pages. Red used to carry
 * Add to cart, Buy it now, the low-stock notice and the assurance icons at
 * once — four unrelated meanings in one colour, on the one screen where a
 * shopper is deciding to spend money. When everything is urgent, nothing is.
 *
 * `azure` carries the assurance icons: they are informational, and blue is
 * this system's utility colour (see tailwind.config.ts). `save` green stays on
 * the discount, because money saved is the one thing that should catch the
 * eye on a price block.
 *
 * The colour picker writes into local state rather than a URL param because
 * the cart keys lines on slug + colour — the selection has to be the exact
 * string that goes into the line, and round-tripping it through the URL adds
 * a decoding step where that can silently drift.
 *
 * The enquiry route stays available beneath the cart buttons rather than being
 * removed. Retail and trade buyers land on the same page, and a floor manager
 * pricing forty seats should not have to fake a retail order to reach a human.
 *
 * COLOUR COMES FROM ColorProvider, NOT FROM LOCAL STATE.
 *
 * The PDP already has a colour picker that drives the gallery. If this box
 * kept its own, the page would carry two swatch rows that disagree — and the
 * one that decides what lands in the cart would be the one NOT changing the
 * photograph, which is the worst possible split.
 *
 * Reading the shared context means the swatch above the gallery is the single
 * control, and the line added to the cart is the colourway on screen.
 */
export function BuyBox({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { active } = useProductColor();
  const [qty, setQty] = useState(1);

  const color = active?.name ?? product.colors[0]?.name ?? "Default";

  const off = discountPercent(product.price, product.compareAtPrice);
  const notice = stockNotice(product);
  const outOfStock = product.stock === 0;

  return (
    <div className="space-y-5">
      {/* -------------------------------------------------------- price

          Boxed, on one line, on a green ground. The price, what it was, what
          you save and the tax note are four facts about the same number —
          running them as separate lines made the block taller than the buy
          button and read as four separate claims. Enclosing them says "this
          is the cost", once.

          GREEN because it is the savings colour everywhere else on the site:
          the discount badge, the cart's "you save" line, the Added
          confirmation. Tinting the whole panel rather than just the badge
          makes the price read as the good news it is, and it is the only
          tinted block in a column that is otherwise charcoal and white — so
          the eye lands on the number without anything shouting.

          "MRP" is spelled out before the struck-through figure. A bare
          crossed-out number invites the question "whose price was that?", and
          in India MRP is a printed, legally meaningful figure rather than a
          marketing comparison. */}
      <div>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-2xl border border-save/25 bg-save-soft px-4 py-3">
          <span className="text-[1.6rem] font-bold tracking-[-0.02em] text-save">
            {formatINR(product.price)}
          </span>

          {product.compareAtPrice && (
            <span className="text-[0.85rem] text-muted">
              MRP{" "}
              <span className="line-through">
                {formatINR(product.compareAtPrice)}
              </span>
            </span>
          )}

          {off > 0 && (
            <span className="rounded-full bg-save px-2.5 py-1 text-[0.72rem] font-bold uppercase tracking-[0.02em] text-white">
              {off}% off
            </span>
          )}

          <span className="text-[0.78rem] text-muted">
            (Incl. of all taxes)
          </span>
        </div>

        <p className="mt-2 text-[0.75rem] text-muted">
          Installation included
        </p>

        {notice && (
          <p
            className={cn(
              "mt-2 text-[0.8rem] font-semibold",
              /* Low stock is INFORMATION, not an error — blue, not red. Red
                 here competed with the buy button for the same attention,
                 and "only 3 left" is a nudge rather than a problem. */
              outOfStock ? "text-muted" : "text-azure"
            )}
          >
            {notice}
          </p>
        )}
      </div>

      {/* ----------------------------------------------------- quantity */}
      <div className="flex items-center gap-4">
        <span className="text-[0.82rem] font-semibold text-ink">Quantity</span>
        <QuantityStepper value={qty} onChange={setQty} />
      </div>

      {/* ------------------------------------------------------ actions

          THE WISHLIST HEART IS GONE FROM HERE, deliberately. It sat beside
          Add to cart as an equal-sized square, which gave a "maybe later"
          action the same visual weight as the one that completes a sale. The
          heart still lives on every product CARD, which is where saving for
          later actually belongs — on a grid you are scanning, not on the page
          you have already committed to reading.

          What replaces it is the pair of routes a furniture buyer genuinely
          takes instead of buying online: SEE IT, or TALK TO SOMEONE. A chair
          is the one purchase people want to sit in first, and this storefront
          has four experience centres. */}
      <AddToCartButton
        product={product}
        color={color}
        qty={qty}
        /* `rounded` rather than the pill, and sentence case with it — case
           travels with shape in this component. A softened rectangle reads as
           a considered purchase; a full pill with uppercase tracking reads as
           a promotional shout, which is wrong on a ₹20,000 chair. */
        shape="rounded"
        size="lg"
      />

      {!outOfStock && (
        <Link
          href="/checkout"
          onClick={() => addItem(product, { color, qty })}
          className="flex h-[3.25rem] w-full items-center justify-center rounded-xl border-2 border-ink bg-white text-[0.95rem] font-semibold text-ink transition-colors hover:bg-surface"
        >
          Buy it now
        </Link>
      )}

      {/* Secondary pair, side by side rather than two more full-width bars.
          Four stacked buttons of equal width reads as a menu and buries the
          one that matters; halving these keeps the hierarchy legible.

          EACH CARRIES ITS OWN TINT, taken from its icon. These are not
          alternative ways to buy — they are two different real-world routes,
          and colour-coding them makes that legible at a glance in a stack
          that is otherwise all charcoal. It also matches the floating dock,
          where visiting a store and talking to someone already use these same
          two tones, so a shopper meets one vocabulary rather than two.

          Soft fills, not solid ones. A saturated pair here would outrank the
          charcoal Add to cart directly above them, which is exactly backwards
          — these are secondary and should read that way. */}
      <div className="grid grid-cols-2 gap-2.5">
        <Link
          href="/stores"
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-honey/35 bg-honey/10 text-[0.85rem] font-semibold text-ink transition-colors hover:bg-honey/20"
        >
          <Store size={16} className="text-honey" />
          Visit store
        </Link>

        {/* Prefilled with the product name so whoever answers already knows
            what is being asked about — a "Shop Live" message that starts with
            "which chair?" wastes the intent it just captured. */}
        <a
          href={waHrefWithText(
            `Hi Officemate, can someone show me the ${product.name} on a video call?`
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-save/30 bg-save-soft text-[0.85rem] font-semibold text-save transition-colors hover:bg-save/15"
        >
          <Video size={16} />
          Shop Live
        </a>
      </div>

      <p className="text-center text-[0.78rem] text-muted">
        Delivery by <span className="font-semibold text-ink">{deliveryEstimate(product.deliveryDays)}</span>
      </p>

      {/* --------------------------------------------------- assurances

          Same treatment as the bulk-quote card below: white ground, hairline
          border. The sand fill made this the only tinted panel in the column,
          which gave four standing facts more visual weight than the buy
          buttons above them — and the eye reads a filled block as the thing to
          look at. Matching the two cards makes them read as what they are: a
          pair of supporting notes under the decision, not competing with it. */}
      <div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-line p-4">
        {ASSURANCES.map(({ icon: Icon, label, detail }) => (
          <div key={label} className="flex items-start gap-2.5">
            <Icon size={16} className="mt-0.5 shrink-0 text-azure" />
            <div className="min-w-0">
              <p className="text-[0.78rem] font-semibold leading-tight text-ink">
                {label}
              </p>
              <p className="text-[0.7rem] leading-snug text-muted">{detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ⚠ THE BULK-QUOTE CARD WAS REMOVED FROM HERE.

          It sat at the foot of the buy column offering "Request a bulk quote"
          to every visitor, including the one person in a hundred it was
          written for. On a retail PDP that is a fifth call to action under
          four that already exist, and it asks a shopper deciding on one chair
          to consider ordering forty.

          THE TRADE ROUTE IS NOT LOST. "Bulk Orders" is in the header on every
          page, the homepage carries a bulk band, and the floating dock reaches
          a human from anywhere. A floor manager pricing forty seats has three
          ways through without this card.

          If it comes back, it belongs BELOW the fold in the specs area, where
          someone reading dimensions and load ratings is already thinking
          about a fit-out — not beside Add to cart. */}
    </div>
  );
}
