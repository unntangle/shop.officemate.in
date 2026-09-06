"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Headset, Store, Video, X } from "lucide-react";
import { waChatHref, waShopLiveHref } from "@/lib/whatsapp";
import { OmateMark } from "@/components/common/OmateMark";
import { WhatsAppGlyph } from "@/components/common/WhatsAppGlyph";

/**
 * Floating action dock — one trigger that fans four actions out along an arc.
 *
 * This replaced a permanent vertical stack of four discs. At four the stack
 * claimed 324px of the right edge on every page and every scroll position,
 * which is a lot of persistent furniture for actions most visitors never use.
 * Collapsing to a single disc buys that space back and turns the dock into
 * something you open rather than something you look past.
 *
 * WHY THIS IS A CLIENT COMPONENT, when the stack was not.
 *
 * The stack's hover labels were pure CSS, so it shipped no JS. A fan cannot
 * be: hover alone would make the whole dock unopenable on touch, where there
 * is no hover at all. So the trigger is a real button with three ways in —
 * hover (desktop), click (touch), and focus (keyboard) — and that needs
 * state. The cost is a few hundred bytes; the alternative is a control half
 * the audience cannot use.
 *
 * GEOMETRY. Each action is stacked dead-centre on the trigger when closed and
 * translates out to a point on a 118px arc when open, sweeping from straight
 * up (first in `ACTIONS`) to straight left (last). The corner position is
 * what fixes the sweep at 90° rather than a true 180°: anything past straight
 * up or straight left would run off the top of the viewport or under the
 * BackToTop button below.
 *
 * 118px is not arbitrary. Four discs across 90° sit 30° apart, and the chord
 * between two points 30° apart on a 118px arc is about 61px — just enough for
 * a 48px disc plus breathing room. Shrink the radius and they overlap; add a
 * fifth action and they overlap at any radius, so widen the sweep or drop one.
 *
 * Vertical position is set against BackToTop (bottom-6, ~44px tall): the dock
 * sits at bottom-24 to clear it. Those numbers are related — moving one means
 * checking the other, or they overlap on a short viewport.
 */

/** Arc radius in px. See the geometry note above before changing it. */
const RADIUS = 118;

/**
 * Every action disc is `bg-night` — one uniform cluster. The variety lives in
 * the glyph colours instead (see ACTIONS below).
 *
 * The WhatsApp disc used to be brand green (#25D366). A single green circle
 * among three charcoal ones looked like a leftover rather than a decision,
 * and it put a second green on a site where `save` green already means
 * "discount". Moving that colour onto the glyph keeps the recognition and
 * loses the odd-one-out silhouette.
 *
 * So the dock now reads in two layers: the red trigger is the control, the
 * charcoal discs are its contents, and the glyphs tell them apart.
 */
const DISC_CLASS = "bg-night";

/* WhatsApp brand green. Deliberately a literal rather than a Tailwind token:
   it belongs to WhatsApp, not to Officemate, and putting it in the palette
   would invite reuse as if it were ours.

   It applies to the GLYPH now, not the disc. That gets the channel's colour
   recognition back without a green circle breaking up the uniform cluster. */
const WHATSAPP_GREEN = "#25D366";

/**
 * How long the fan stays open after the cursor leaves, in ms.
 *
 * Without a grace period the dock is genuinely hard to use: the actions sit
 * on an arc with gaps between them, and the trigger is 56px while each disc
 * is 48px, so a diagonal move from the button to the far disc crosses bare
 * page. Closing on the first `mouseleave` snaps the fan shut mid-reach and
 * the discs retreat toward the cursor's destination — you end up chasing it.
 *
 * 300ms is long enough to cross those gaps and short enough that the dock
 * does not feel stuck open after you have moved on. Only hover uses it;
 * Escape, an outside tap and tabbing away all close immediately, because
 * those are deliberate dismissals rather than the cursor wandering.
 */
const CLOSE_DELAY = 300;

/**
 * Glyph colours.
 *
 * The discs are uniform charcoal; the icons carry the variety. That split is
 * deliberate — colouring the discs made the dock read as four separate
 * objects, colouring only the glyphs keeps it one menu with four distinct
 * entries.
 *
 * Three of the four come from the ergonomics palette (sage / honey / lilac),
 * which exists in tailwind.config.ts as a coordinated set for the Chair
 * Health Score and the Advisor. Reusing it here means the dock is not
 * inventing colours the site does not already own. Lilac on Omate AI is the
 * one with a real semantic tie: lilac already means "the advisor" elsewhere.
 *
 * All four clear 6:1 against #282A2E. The rest of the palette does not —
 * `accent` red lands at about 2.3:1 on charcoal and `azure` at 2.7:1, which
 * is why neither appears here despite both being obvious first guesses.
 *
 * ORDER MATTERS. WhatsApp green and sage are the two greens, so they are
 * deliberately not adjacent on the arc — honey sits between them. Reordering
 * ACTIONS without re-checking that puts two greens side by side.
 *
 * Each action's tone is declared ONCE, as `toneClass` (or `toneStyle` for the
 * WhatsApp literal), and applied to both the glyph and its hover label. The
 * icons themselves carry no colour — they all draw in `currentColor`, so the
 * tone is set on the wrapper and inherited. Setting it per-icon is how these
 * two drift apart.
 */
const ACTIONS = [
  {
    id: "advisor",
    label: "Ask Omate AI",
    href: "/advisor",
    external: false,
    icon: <OmateMark className="h-5 w-5" />,
    toneClass: "text-lilac",
    toneStyle: undefined as React.CSSProperties | undefined,
    /* Draws the running gradient outline on hover. Omate AI only. */
    beam: true,
  },
  {
    id: "whatsapp",
    label: "Chat on WhatsApp",
    href: waChatHref,
    external: true,
    icon: <WhatsAppGlyph className="h-[19px] w-[19px]" />,
    toneClass: "",
    toneStyle: { color: WHATSAPP_GREEN } as React.CSSProperties | undefined,
    beam: false,
  },
  {
    id: "shop-live",
    label: "Shop Live",
    href: waShopLiveHref,
    external: true,
    icon: <Video size={19} />,
    toneClass: "text-honey",
    toneStyle: undefined as React.CSSProperties | undefined,
    beam: false,
  },
  {
    id: "stores",
    label: "Visit store",
    href: "/contact#stores",
    external: false,
    icon: <Store size={19} />,
    toneClass: "text-sage",
    toneStyle: undefined as React.CSSProperties | undefined,
    beam: false,
  },
];

/**
 * Where action `i` sits when the fan is open, and which way is "outward"
 * from there.
 *
 * Angles run from 90° (straight up) for the first action down to 0° (straight
 * left) for the last. Y is negated because screen coordinates grow downward
 * while the maths does not — forget that and the fan opens into the floor.
 *
 * `rad` comes back with the offsets because the label needs it: labels are
 * pushed further along the SAME angle, not simply leftward. See the note on
 * the label span below for why that is not optional.
 */
function arcOffset(i: number, total: number) {
  const angle = total > 1 ? 90 - (90 / (total - 1)) * i : 45;
  const rad = (angle * Math.PI) / 180;
  return {
    x: -RADIUS * Math.cos(rad),
    y: -RADIUS * Math.sin(rad),
    rad,
  };
}

/**
 * How far past the disc's own edge a label is anchored, in px.
 *
 * 46 clears the 24px disc radius with 22px to spare. Below about 40 the label
 * starts clipping the neighbouring disc on the 60° and 30° positions, where
 * the arc is at its most crowded.
 */
const LABEL_OFFSET = 46;

/**
 * The running gradient outline on the Omate AI disc.
 *
 * Unchanged from the stack version except for what it wraps: the capsule
 * label is gone, so this now traces the 48px disc itself. The maths still
 * works because a circle is just a pill whose width equals its height —
 * `rx="22.75"` is half of (48px − the 2.5px stroke), which describes a
 * perfect circle at this size and a pill at any wider one.
 *
 * Timing and colour live in globals.css under `.dock-beam`. Note the 0.45s
 * start delay there was tuned to let the old label finish unrolling; with no
 * label to wait for it now just reads as a beat before the light appears,
 * which is still the right feel. Drop it to 0 if you want it instant.
 *
 * The gradient id is hardcoded because exactly one dock renders per page. If
 * this ever repeats, switch to React's useId — duplicate ids would make every
 * instance resolve to the first one's gradient.
 */
function DockBeam() {
  return (
    <svg className="dock-beam" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="dock-beam-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="28%" stopColor="#a855f7" />
          <stop offset="52%" stopColor="#6366f1" />
          <stop offset="76%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>

      <rect
        className="dock-track"
        width="100%"
        height="100%"
        rx="22.75"
        pathLength={100}
      />
      <rect
        className="dock-head"
        width="100%"
        height="100%"
        rx="22.75"
        pathLength={100}
      />
    </svg>
  );
}

export function FloatingDock() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  /* Immediate close, for deliberate dismissals. */
  const closeNow = useCallback(() => {
    cancelClose();
    setOpen(false);
  }, [cancelClose]);

  /* Delayed close, for the cursor leaving. Cancelling first is what makes
     re-entry work: come back within the grace period and the pending close is
     thrown away rather than firing on top of a fresh open. */
  const closeSoon = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY);
  }, [cancelClose]);

  const openNow = useCallback(() => {
    cancelClose();
    setOpen(true);
  }, [cancelClose]);

  /* A pending timer outliving the component would call setState on something
     unmounted — harmless in React 19, but it would also fire after a client
     navigation, which is not. */
  useEffect(() => cancelClose, [cancelClose]);

  /* Escape closes, and focus returns nowhere in particular — the trigger is
     still where the user left it, so stealing focus back would be more
     disorienting than leaving it.

     Outside-click matters on touch only: there is no mouseleave on a phone,
     so without this an opened fan stays open until something else is tapped.
     Both listeners are only attached while open, and both close immediately
     rather than on the hover delay. */
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNow();
    };
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) closeNow();
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, closeNow]);

  return (
    <div
      ref={rootRef}
      /* Hover opens immediately and closes on a delay; the handlers are inert
         on touch, where the click below does the work. `onBlur` with
         `relatedTarget` outside closes for keyboard users tabbing past the
         dock — immediately, since that is a deliberate move. */
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) closeNow();
      }}
      className="fixed bottom-24 right-6 z-40 h-14 w-14"
    >
      {ACTIONS.map((action, i) => {
        const { x, y, rad } = arcOffset(i, ACTIONS.length);

        /* Stagger. Opening runs outward from the trigger (first action
           first); closing runs the reverse, so the fan collapses back into
           the button rather than all four arriving home at once. */
        const delay = open ? i * 45 : (ACTIONS.length - 1 - i) * 45;

        const inner = (
          <>
            <span
              style={action.toneStyle}
              className={`grid h-full w-full place-items-center ${action.toneClass}`}
            >
              {action.icon}
            </span>

            {action.beam && <DockBeam />}

            {/* Label anchored RADIALLY OUTWARD from its own disc, not simply
                to its left.

                Leftward labels are what caused the overlap. On a 90° arc the
                top disc sits only 16px above its neighbour vertically but
                59px across, so a horizontal label leaving the top disc runs
                straight through the disc below-left of it — and loses, because
                that disc comes later in the DOM and paints over it.

                That is not a spacing bug to tune away. Clearing it with
                leftward labels needs a radius over 290px, which puts the fan
                through the top of the viewport.

                Pushing along each disc's own angle instead means a label
                always travels into the empty space beyond the arc, never
                across it. `translate(-100%, -50%)` right-aligns the pill to
                that anchor and centres it vertically, so a long label grows
                away from the dock rather than back into it.

                Only one is ever visible — they appear on their own disc's
                hover, so labels never have to clear each other either.

                `bg-night`, matching the discs exactly. `ink` is the type
                token rather than a surface one, and at #2D2D2D against the
                discs' #282A2E it was close enough to look like a mistake
                rather than a choice. Same colour makes the label read as part
                of the disc it belongs to.

                Text takes the action's own tone rather than white, so the
                label and its glyph read as one unit. All four tones clear 6:1
                against the pill, which is the same charcoal as the disc — so
                a tone that works on one works on the other by construction.
                That stops being true if the pill colour ever changes. */}
            <span
              style={{
                ...action.toneStyle,
                transform: `translate(-100%, -50%) translate(${
                  -LABEL_OFFSET * Math.cos(rad)
                }px, ${-LABEL_OFFSET * Math.sin(rad)}px)`,
              }}
              className={`pointer-events-none absolute left-1/2 top-1/2 whitespace-nowrap rounded-full bg-night px-3 py-1.5 text-[0.75rem] font-semibold opacity-0 shadow-lift transition-opacity duration-200 group-hover:opacity-100 ${action.toneClass}`}
            >
              {action.label}
            </span>
          </>
        );

        const linkClass = `dock-sweep group relative flex h-12 w-12 items-center justify-center rounded-full shadow-lift ${DISC_CLASS}`;

        return (
          <div
            key={action.id}
            style={{
              transform: open
                ? `translate(${x}px, ${y}px) scale(1)`
                : "translate(0px, 0px) scale(0.4)",
              transitionDelay: `${delay}ms`,
            }}
            /* Centred on the trigger via a -24px offset (half of h-12), so
               the closed state collapses to the button's own centre rather
               than to its top-left corner.

               `invisible` rather than `hidden` when closed: the transform
               still needs to animate, and a display change would kill it.
               Paired with `tabIndex={-1}` and `aria-hidden` below so a closed
               fan is not a set of invisible tab stops. */
            className={`absolute left-1/2 top-1/2 -ml-6 -mt-6 transition-all duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
              open ? "visible opacity-100" : "invisible opacity-0"
            }`}
          >
            {action.external ? (
              <a
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={action.label}
                aria-hidden={!open}
                tabIndex={open ? 0 : -1}
                className={linkClass}
              >
                {inner}
              </a>
            ) : (
              <Link
                href={action.href}
                aria-label={action.label}
                aria-hidden={!open}
                tabIndex={open ? 0 : -1}
                className={linkClass}
              >
                {inner}
              </Link>
            )}
          </div>
        );
      })}

      {/* Trigger. A button, not a div — it needs to be focusable, activate on
          Enter and Space, and announce its state, and `aria-expanded` on a
          real button gets all three for free.

          56px against the actions' 48px, so the thing you press is visibly
          the parent of the things that come out of it.

          Accent red, not night. This is the only part of the dock on screen
          at all times, and in near-black it read as generic chat furniture
          rather than as Officemate's. The actions stay night so the open fan
          is one dark cluster with a single coloured anchor — the red says
          "this is the control", the dark says "these are its contents".

          Inverted against the rest of the dock: a pale `accent-soft` fill
          with the red on the glyph, rather than red fill with a pale glyph.
          Same two colours, swapped — which keeps the trigger unmistakably
          Officemate's while making it the lightest thing in the stack instead
          of the heaviest. Red on #FDECEA is about 5.9:1, so the glyph is
          doing the legibility work the fill used to.

          THE RING IS NOT DECORATION. #FDECEA is a 97%-luminance tint, so on
          the white and #F5F5F5 grounds this dock floats over, the button's
          own edge is nearly invisible — `shadow-lift` is far too diffuse to
          define it alone. The hairline of accent at 20% is what keeps it
          reading as a button rather than a smudge. Remove it and the control
          disappears on white sections.

          Hover flips the two colours back the other way, so pressing toward
          it darkens rather than lightens — the direction people expect. */}
      <button
        type="button"
        onClick={() => {
          cancelClose();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-label={open ? "Close contact options" : "Contact options"}
        className="relative grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-accent ring-1 ring-accent/20 shadow-lift transition-all duration-300 hover:bg-accent hover:text-accent-soft hover:scale-105 active:scale-95"
      >
        {/* Both icons are always rendered and cross-faded on a shared centre.
            Swapping which one is mounted would snap; rotating one into the
            other reads as the same control changing state. */}
        <Headset
          size={22}
          className={`absolute transition-all duration-300 ${
            open ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`}
        />
        <X
          size={22}
          className={`absolute transition-all duration-300 ${
            open ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          }`}
        />
      </button>
    </div>
  );
}
