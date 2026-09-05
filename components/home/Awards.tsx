import { AWARDS } from "@/constants/home";
import { SectionHead } from "@/components/common/SectionHead";

/**
 * Awards and certifications.
 *
 * Laurel wreaths rather than cards. The previous treatment — a bordered box
 * with a stock rosette icon — read as dated because the rosette is decoration
 * that adds nothing the citation does not already say. A laurel is the
 * convention for this specific thing, so it carries meaning rather than
 * filling space.
 *
 * TEXT INSIDE THE WREATH, NOT LOGOS. Award and standards marks (Red Dot,
 * BIFMA, GREENGUARD, ISO) are trademarked, and reproducing them without a
 * licence is a legal exposure a homepage band does not justify. The reference
 * site shows logos because it has the rights to them. Swap the `<span>` for an
 * `<Image>` here once permissions are on file — the wreath does not change.
 */

/* ---------------------------------------------------------------------------
   Wreath geometry.

   All five numbers below are tuning knobs; the branch is generated from them
   rather than hand-placed, so changing the leaf count or the sweep does not
   mean re-authoring twenty-four rotated ellipses by hand.
--------------------------------------------------------------------------- */

/** Leaves per branch.

    Ten across a 125° sweep at R=36 puts leaf centres ~8.7px apart against a
    leaf ~11px long — so they overlap by about a fifth, which is what real
    laurel does. Twelve leaves at LEAF_BASE 8.4 (the earlier values) spaced
    them 6.9px apart against a 17px leaf: a 60% overlap, which fused them into
    a solid crescent with no leaf shapes visible at all. */
const LEAVES = 10;

/** Degrees the branch sweeps, measured the usual way: 90° is straight up,
    180° is due left, 270° is straight down.

    140 → 265 matters more than it looks. Each branch covers 125°, and the
    mirrored pair therefore covers 220° of the circle — leaving a 100° gap at
    the TOP for the citation and a 10° near-join at the bottom. That asymmetry
    is what makes it a laurel. A wider sweep (the earlier 96 → 264) closes the
    two branches into a near-complete ring, which reads as a seal or a coin,
    not a wreath. */
const START = 140;
const END = 265;

const CX = 50;
const CY = 51;
const R = 36;

/** Leaf half-length at the base of the branch and at its tip. Real laurel
    tapers toward the tip, and without it the wreath reads as machine-drawn.

    These also set how much room the citation has: the leaves' inner edge sits
    at roughly `R - LEAF_BASE` from the centre, so growing them eats the hole
    the text lives in. See the max-width on the label below. */
const LEAF_BASE = 5.6;
const LEAF_TIP = 2.6;

const pointAt = (theta: number, radius: number) => {
  const rad = (theta * Math.PI) / 180;
  return {
    /* Minus on y because SVG's axis grows downward while the angle is
       measured the usual way. */
    x: CX + radius * Math.cos(rad),
    y: CY - radius * Math.sin(rad),
  };
};

const angleAt = (i: number) => START + ((END - START) / (LEAVES - 1)) * i;

/**
 * One laurel branch: a stem with leaves along it.
 *
 * Each leaf is rotated by `90 - θ`, the tangent to the circle at that point,
 * so leaves lie ALONG the branch rather than pointing at the centre — the
 * difference between a laurel and a sunburst.
 */
function Branch() {
  /* The stem is sampled from the same circle as the leaves at a slightly
     smaller radius, so the leaves sit outboard of it. Sampled as a polyline
     rather than an SVG arc: an arc needs large-arc and sweep flags that are
     easy to get backwards, and at 28 samples a polyline is visually a curve. */
  const stem = Array.from({ length: 28 }, (_, i) => {
    const theta = START + ((END - START) / 27) * i;
    const { x, y } = pointAt(theta, R - 4.5);
    return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");

  return (
    <g>
      <path d={stem} fill="none" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" />

      {Array.from({ length: LEAVES }).map((_, i) => {
        const theta = angleAt(i);
        const { x, y } = pointAt(theta, R);

        /* i counts down from the top tip, so taper runs tip → base. */
        const t = i / (LEAVES - 1);
        const rx = LEAF_TIP + (LEAF_BASE - LEAF_TIP) * t;

        return (
          <ellipse
            key={theta}
            cx={x}
            cy={y}
            rx={rx}
            ry={rx * 0.4}
            transform={`rotate(${90 - theta} ${x} ${y})`}
          />
        );
      })}
    </g>
  );
}

function Laurel({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g fill="currentColor">
        <Branch />
        {/* The right branch is the left one mirrored. Translating by the full
            viewBox width after the flip puts it back in frame. */}
        <g transform="translate(100 0) scale(-1 1)">
          <Branch />
        </g>
      </g>
    </svg>
  );
}

export function Awards() {
  return (
    /* Light grey ground, as in the reference — the wreaths are pale enough
       that on pure white they float without anything holding them. */
    <section className="section-retail bg-surface">
      <div className="container">
        <SectionHead title="Awards & certifications" align="center" />

        {/* Wrapping flex rather than a rail: five wreaths fit a desktop row,
            and they carry no action, so there is nothing to scroll to. */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-6">
          {AWARDS.map((award) => (
            <div
              key={award.title}
              className="group relative h-[9.5rem] w-[9.5rem] shrink-0"
            >
              {/* Honey, the palette's existing warm token, rather than an
                  arbitrary gold — the wreaths sit in the same colour world as
                  the rest of the page. The reference runs a brighter lemon; if
                  you want that exactly it wants a new token, not a one-off
                  literal here. */}
              <Laurel className="h-full w-full text-honey transition-transform duration-500 ease-out group-hover:scale-[1.06]" />

              {/* Citation sits in the hole between the branches, and the
                  max-width is what keeps it there. The leaves' inner edge is
                  at about (R - LEAF_BASE) = 30 of 100 viewBox units, which on
                  a 152px tile is ~46px from centre — a ~92px clear diameter.
                  5.4rem (86px) fits inside that with a little air. A padded
                  full-width box, which is what was here before, leaves the
                  text free to run onto the leaves whenever a title is long.

                  No detail line beneath — the reference carries the mark
                  alone, and the sub-caption was what made this read as a card
                  grid wearing wreaths. */}
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="max-w-[5.4rem] text-center text-[0.74rem] font-bold leading-tight text-ink">
                  {award.title}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
