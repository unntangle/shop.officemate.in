import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Store, Video } from "lucide-react";
import { waChatHref, waShopLiveHref } from "@/lib/whatsapp";
import { WhatsAppGlyph } from "@/components/common/WhatsAppGlyph";

/* Statically imported rather than referenced by path string.

   The import gives Next the file's real intrinsic width and height at build
   time, which is what lets the band size itself to the artwork's own aspect
   ratio instead of a hardcoded min-height. Swap the file and the band
   re-proportions itself; no numbers to update here. It also removes the
   layout shift a bare `src="/images/..."` causes. */
import bannerImage from "@/public/images/cta-banner.png";

/* WhatsApp brand green — a literal, not a palette token, for the same reason
   given in WhatsAppButton.tsx: it belongs to WhatsApp, not to Officemate. */
const WHATSAPP_GREEN = "#25D366";

/**
 * "Officemate for Business" — the bulk-order band.
 *
 * The old enquiry-only site treated this as the whole business model. On a
 * retail storefront it becomes one band among many, but it stays prominent:
 * the average B2B order here is worth dozens of retail baskets, and a floor
 * manager who lands on the consumer site needs an obvious exit to the trade
 * flow rather than being funnelled into adding a hundred chairs to a cart.
 *
 * LAYOUT: the banner is the band's background at full strength, with just the
 * heading and two action rows overlaid on its right half — the "talk to an
 * expert" pattern. It replaced a pair of pill buttons under a block of copy.
 * The point of this band is that a human quotes the job, and a named channel
 * says that faster than a paragraph explaining it does.
 *
 * THE COPY THAT USED TO BE HERE IS GONE ON PURPOSE. An eyebrow, a
 * three-line paragraph, a four-item capability strip and a text link all
 * competed with the two things a visitor can actually do, and the stack of
 * them forced the band tall enough to need a heavy scrim, which in turn
 * buried the artwork. Everything they said (volume pricing, floor
 * assessment, GST invoicing, past projects) is covered on the pages the two
 * rows lead to. If any of it has to come back, it belongs on /contact, not
 * layered over an illustration.
 */

/**
 * One compact action pill.
 *
 * These were full-width glass rows with a sub-label and an arrow chip. Two of
 * them stacked ran the entire width of the copy column, which made a pair of
 * links look like a settings menu — and at that width the eye reads them as
 * panels to scan rather than buttons to press. Sizing to content is what
 * makes them read as buttons again.
 *
 * Solid fills rather than glass, for the same reason. Glass works when a
 * panel is large enough to show the artwork through it; at pill size the blur
 * has nothing to say and the translucency just costs contrast. The two fills
 * also carry the hierarchy: WhatsApp green is the recognised channel and
 * takes the eye first, white is the neutral second option.
 *
 * The sub-labels are gone with the width. "On WhatsApp, during business
 * hours" is carried by the green fill and the glyph; "10 seats and up"
 * belongs on the page the pill leads to, not on the pill.
 */
function ActionPill({
  href,
  external,
  tint,
  className: variantClass,
  discClass = "bg-white/20",
  icon,
  label,
}: {
  href: string;
  external?: boolean;
  /** Fill colour, for brand literals that must NOT enter the palette
      (WhatsApp green). Use `className` for anything of ours. */
  tint?: string;
  /** Fill and text colour as Tailwind classes — the preferred route. */
  className?: string;
  /** Tint of the disc behind the glyph. Needs to be set per variant: a
      white-on-white disc is invisible, and a dark one on the green fill is
      heavier than the pill. */
  discClass?: string;
  icon: React.ReactNode;
  label: string;
}) {
  /* `inline-flex` with no width set: the pill is exactly as wide as its
     contents. `h-12` keeps a 48px touch target, which is the floor.

     `active:scale` matters more here than on a large row — a small control
     needs to confirm the press, and on touch there is no hover state to do
     it. */
  const base = [
    "group inline-flex h-12 items-center gap-2.5 rounded-full pl-3 pr-5",
    "text-[0.88rem] font-semibold shadow-lift",
    "transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]",
    variantClass ?? "",
  ].join(" ");

  const inner = (
    <>
      {/* Glyph sits in its own disc so both pills share one silhouette even
          though their fills differ — without it the white pill's red icon
          floats and the green pill's white glyph disappears into the fill. */}
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-transform duration-300 group-hover:scale-105 ${discClass}`}
      >
        {icon}
      </span>
      {label}
      <ArrowRight
        size={16}
        strokeWidth={2.5}
        className="shrink-0 transition-transform duration-300 group-hover:translate-x-1"
      />
    </>
  );

  /* WhatsApp leaves the site, so it is a plain anchor with the usual
     noopener/noreferrer. The internal one stays a next/link for prefetching. */
  return external ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={tint ? { backgroundColor: tint } : undefined}
      className={base}
    >
      {inner}
    </a>
  ) : (
    <Link
      href={href}
      style={tint ? { backgroundColor: tint } : undefined}
      className={base}
    >
      {inner}
    </Link>
  );
}

export function BulkOrderBand() {
  return (
    <section className="section-retail bg-white">
      <div className="container">
        {/* CSS grid with a single cell that both children occupy — not
            absolute positioning.

            That choice is what makes "show the whole image" safe. With one
            shared cell the row height is max(image, content): the artwork
            gets to be its full natural height, and if the copy ever grows
            taller than the artwork the band grows with it instead of
            clipping. Absolute positioning would take the content out of flow
            and let it overflow the moment it outgrew the picture.

            `overflow-hidden` clips the image to the rounded corners.
            `bg-night` is the colour behind it while it loads, the fallback if
            it 404s, and the fill on either side if the artwork is ever
            narrower than the band. */}
        <div className="relative grid overflow-hidden rounded-3xl bg-night">
          {/* Banner.

              TWO BEHAVIOURS, and the breakpoint is the whole point:

              MOBILE — `h-full object-cover`. The artwork is a wide banner, so
              at phone width its natural height is only a couple of
              centimetres; letting it run at true aspect would leave the two
              rows sitting on bare `bg-night` under a thin strip of picture.
              Here the content sets the height and the image crops to fill.

              `md` AND UP — `aspect-[7/2]` with `h-auto` and `self-start`.
              The band is pinned to a 3.5:1 letterbox and `object-cover` takes
              a shallow slice off the top and bottom of the artwork.

              This was briefly uncropped (`h-auto` alone, true aspect ratio),
              which ran about 3:1 and made the band taller than anything in it
              needed. The scene has generous empty space above the lamp and
              below the rug, so a 3.5:1 crop takes height out of the padding
              rather than off the furniture. Widen the ratio to trim further —
              but watch the plant and the table legs, which go first.

              `self-start` matters: grid items stretch to fill their row by
              default, which would override the aspect ratio and stretch the
              picture.

              No `object-contain` anywhere. It shows every pixel but
              letterboxes to do it, and the bars are more conspicuous than the
              crop.

              Empty alt — decorative. The band's meaning is carried by the
              heading and the action rows.

              Not `priority`: this sits well down the homepage, so preloading
              it would compete with the hero for bandwidth. */}
          <Image
            src={bannerImage}
            alt=""
            sizes="(min-width: 1280px) 1200px, 100vw"
            className="col-start-1 row-start-1 h-full w-full object-cover object-center md:aspect-[7/2] md:h-auto md:self-start"
          />

          {/* Scrim, MOBILE ONLY.

              On desktop there is none — the illustration runs at full
              strength, which is the whole reason it is here. The purple it
              sits on is dark enough to carry white type and the glass rows
              without help.

              Below `md` the content stacks over the middle of the cropped
              artwork rather than over its empty right half, and the lamp in
              that scene is the one genuinely light area in the frame. A
              heading crossing it would disappear. `md:hidden` keeps that fix
              off desktop entirely. */}
          <div
            aria-hidden
            className="col-start-1 row-start-1 bg-night/60 md:hidden"
          />

          {/* Content. Shares the grid cell with the image, so it paints over
              it — later in the DOM wins without needing a z-index.

              No min-height any more: the image supplies the band's height
              from `md` up, and below that the content supplies its own. */}
          <div className="col-start-1 row-start-1 flex flex-col justify-center p-6 md:ml-auto md:w-1/2 md:p-8 lg:p-10">
            {/* The sr-only span gives the section a name. "Connect with us"
                on its own is the only h2 in this band, and it tells a crawler
                and a screen-reader user nothing about whose contact options
                these are. */}
            <h2 className="text-[1.5rem] font-semibold leading-tight tracking-[-0.02em] text-white md:text-[2rem]">
              Connect with us
              <span className="sr-only"> — Officemate contact options</span>
            </h2>

            {/* Side by side, wrapping only when the column gets too narrow.
                Three solid fills in descending emphasis, so they do not read
                as one undifferentiated row: green is the recognised channel
                and takes the eye first, white is the bright secondary,
                charcoal is the quiet third. */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <ActionPill
                href={waChatHref}
                external
                tint={WHATSAPP_GREEN}
                className="text-white"
                icon={<WhatsAppGlyph className="h-[18px] w-[18px] text-white" />}
                label="WhatsApp"
              />
              <ActionPill
                href={waShopLiveHref}
                external
                className="bg-white text-night"
                discClass="bg-accent/10"
                icon={<Video size={17} className="text-accent" />}
                label="Shop Live"
              />
              <ActionPill
                href="/stores"
                /* Solid charcoal, not the outlined glass this started as.

                   Glass made it the odd one out: two solid pills and a
                   translucent third read as "two buttons and a disabled one"
                   rather than three equal options. Solid `night` keeps the
                   set consistent while still being clearly the third tier —
                   green is the recognised channel, white is the bright
                   secondary, charcoal is the quiet one.

                   Charcoal rather than `accent`. The brand red against this
                   banner's purple is the one adjacency on the site where two
                   saturated hues sit edge to edge and vibrate. Charcoal is
                   neutral against any banner, which also means this survives
                   if the artwork is ever swapped. */
                className="bg-night text-white"
                discClass="bg-white/15"
                icon={<Store size={17} className="text-white" />}
                label="Visit store"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
