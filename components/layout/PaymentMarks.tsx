import fs from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";
import { PAYMENT_MARKS, type PaymentMark } from "@/constants/payments";

/**
 * The "We accept" logo strip.
 *
 * TWO THINGS HERE ARE DELIBERATE AND EASY TO BREAK:
 *
 * 1. THE FILESYSTEM CHECK. This is a server component, so it can ask whether
 *    an asset actually exists before rendering an <img> that points at it.
 *    That matters because the official marks are trademarked artwork the
 *    client has to download themselves — until they do, `public/images/
 *    payments/` is empty and every logo would render as a broken-image icon
 *    across the whole site. Instead a missing file falls back to a text chip,
 *    which is exactly what the footer showed before, and each logo switches
 *    on by itself the moment its file lands. No code change, no redeploy
 *    checklist.
 *
 *    The check runs at build time for static pages, so it costs nothing per
 *    request. If this component is ever moved into a client component, the
 *    fs import will fail the build — pass the resolved list down as props
 *    instead of relaxing the boundary.
 *
 * 2. PLAIN <img>, NOT next/image. next.config.mjs does not set
 *    `dangerouslyAllowSVG`, so routing an SVG through the image optimizer
 *    returns a 400. Brand centres ship SVG. Rather than loosen the optimizer
 *    for the whole site to serve eight ~2KB files, these bypass it. Width and
 *    height are set on every one so nothing shifts as they load.
 */

const PUBLIC_DIR = path.join(process.cwd(), "public");

/** True when the mark has artwork on disk right now. */
function hasArtwork(mark: PaymentMark): mark is PaymentMark & { src: string } {
  if (!mark.src) return false;
  try {
    return fs.existsSync(path.join(PUBLIC_DIR, mark.src));
  } catch {
    /* A locked-down or read-only filesystem should degrade to text chips,
       never take the page down. */
    return false;
  }
}

function TextChip({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-9 min-w-[3.25rem] items-center justify-center rounded-md border border-line bg-white px-2.5">
      {children}
    </span>
  );
}

export function PaymentMarks() {
  return (
    /* Centred rather than left-aligned. The link columns above are a reading
       surface and stay flush left; this strip is a closing band with no
       reading order to it, so centring lets the tiles sit as one balanced row
       instead of trailing off into empty space on a wide viewport. */
    <div className="text-center">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted">
        We accept
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {PAYMENT_MARKS.map((mark) =>
          hasArtwork(mark) ? (
            /* TWO RENDERINGS, driven by `boxed`.

               CARD ART gets NO container. Those files are already a rounded
               rectangle with a background colour baked in — putting one inside
               a white bordered tile draws a card inside a card, and the tile's
               padding shrinks the mark to about half the height it should be.
               So the image IS the tile: `h-9` to match everything else in the
               row, `w-auto` for its natural width.

               BARE WORDMARKS get the chip. They are transparent and much wider
               than they are tall — RuPay is nearly 4:1 against the cards' 1.6:1
               — so at `h-9` one would be over 130px wide and floating unbacked
               on the footer grey. Inside a chip at `max-h-4` it reads as the
               same kind of object as the cards beside it.

               Getting `boxed` wrong shows up immediately in either direction.
               See the note on the flag in constants/payments.ts. */
            mark.boxed ? (
              <TextChip key={mark.label}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mark.src}
                  alt={mark.label}
                  width={mark.width}
                  height={mark.height}
                  loading="lazy"
                  decoding="async"
                  className="max-h-4 w-auto object-contain"
                />
              </TextChip>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={mark.label}
                src={mark.src}
                alt={mark.label}
                width={mark.width}
                height={mark.height}
                loading="lazy"
                decoding="async"
                className="h-9 w-auto rounded-md object-contain"
              />
            )
          ) : (
            /* No artwork on disk. Keeps the white chip, because a bare label
               floating on the footer ground would not read as an item in the
               same list. */
            <TextChip key={mark.label}>
              <span className="text-[0.72rem] font-medium text-muted">
                {mark.label}
              </span>
            </TextChip>
          )
        )}
      </div>
    </div>
  );
}
