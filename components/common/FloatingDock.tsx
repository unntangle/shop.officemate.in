import Link from "next/link";
import { Store } from "lucide-react";
import { SITE } from "@/constants/site";
import { OmateMark } from "@/components/common/OmateMark";

/**
 * Floating action dock — Omate AI, WhatsApp and Visit store.
 *
 * Three discs, always visible. There is no trigger to open: with only three
 * actions, a toggle costs a tap to reveal what fits on screen anyway, and it
 * hides the WhatsApp button that people look for by shape rather than by
 * reading. A fan is worth it at six or eight actions, not at three.
 *
 * Rendered top to bottom in `ACTIONS` order: Omate AI, WhatsApp, Visit store.
 * Reordering the array reorders the stack.
 *
 * Vertical position is set against BackToTop (bottom-6, ~44px tall): the dock
 * sits at bottom-24 to clear it. Those numbers are related — moving one means
 * checking the other, or they overlap on a short viewport.
 *
 * Not a client component. There is no state here, only links, so it ships no
 * JS; the hover labels are pure CSS. They do not appear on touch, where there
 * is no hover — a tap follows the link directly, and each disc carries an
 * `aria-label` so the action is never nameless.
 */

/* WhatsApp brand green. Deliberately a literal rather than a Tailwind token:
   it belongs to WhatsApp, not to Officemate, and putting it in the palette
   would invite reuse as if it were ours. */
const WHATSAPP_GREEN = "#25D366";

/** wa.me wants a bare international number — no +, spaces or dashes. */
const waNumber = SITE.phone.replace(/\D/g, "");

const ACTIONS = [
  {
    id: "advisor",
    label: "Ask Omate AI",
    href: "/advisor",
    external: false,
    icon: <OmateMark className="h-5 w-5 text-white" />,
    background: undefined as string | undefined,
    /* No hover colour change. The label sits behind the disc in the same
       colour, so lightening one of them on hover splits the capsule into two
       visibly different shades. */
    className: "bg-night",
    labelClass: "bg-night",
  },
  {
    id: "whatsapp",
    label: "Chat on WhatsApp",
    href: `https://wa.me/${waNumber}`,
    external: true,
    icon: (
      <svg viewBox="0 0 24 24" width="19" height="19" fill="#fff" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.898 9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413" />
      </svg>
    ),
    background: WHATSAPP_GREEN,
    className: "",
    labelClass: "",
  },
  {
    id: "stores",
    label: "Visit store",
    href: "/contact#stores",
    external: false,
    icon: <Store size={19} className="text-white" />,
    background: undefined as string | undefined,
    className: "bg-night",
    labelClass: "bg-night",
  },
];

/* The link is just a positioning context now — the coloured disc is an inner
   span, so the label can be painted BEFORE it in the DOM and therefore behind
   it. That ordering is what lets the label run under the circle instead of
   butting against its edge. */
const rowShell = "group relative flex items-center";

/* Shadow is handed off on hover. At rest the disc carries the elevation; once
   the label has unrolled, the label carries it and the disc drops its own.
   Keeping both would draw the disc's shadow ON TOP of the label sitting behind
   it, which is exactly the dark ring that made the two read as separate
   objects rather than one capsule. */
const discShell =
  "relative z-10 flex h-12 w-12 items-center justify-center rounded-full shadow-lift transition-shadow duration-300 group-hover:shadow-none";

/* Label sits to the LEFT of the column. Above or below would collide with the
   next disc in the stack.

   It spans the FULL row — `right-0`, not `right-6` — so it runs the whole way
   behind the disc rather than stopping at its centre. With `rounded-full`,
   its right cap is a circle of exactly the disc's size sitting exactly under
   it, so there is no edge to see. `pr-14` keeps the text clear of the icon.

   The reveal is a clip-path wipe, not a fade: the pill is clipped to zero
   width against its own right edge at rest, so on hover it unrolls leftward
   out from under the disc, as though it had been tucked behind it — which,
   literally, it is. A fade makes the label materialise in place; a wipe makes
   it come FROM somewhere.

   `clip-path` rather than `scale-x`, which would squash the text as it opened
   instead of uncovering it. The `round 9999px` keeps the pill's own corners
   during the wipe.

   Easing is the site's standard cubic-bezier(0.22, 1, 0.36, 1) — the same
   curve `lib/motion` uses for every framer transition, so this moves like the
   rest of the page rather than like a bolted-on widget.

   No background here: each label takes its disc's colour, so the join is
   seamless. */
const labelShell = [
  "pointer-events-none absolute right-0 flex h-12 items-center",
  "rounded-full pl-5 pr-14 text-[0.8rem] font-semibold text-white shadow-lift",
  "whitespace-nowrap",
  "[clip-path:inset(0_0_0_100%_round_9999px)]",
  "transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
  "group-hover:[clip-path:inset(0_0_0_0_round_9999px)]",
].join(" ");

export function FloatingDock() {
  return (
    <div className="fixed bottom-24 right-6 z-40 flex flex-col gap-3">
      {ACTIONS.map((action) => {
        const inner = (
          <>
            {/* Label first in the DOM so the disc paints over its square
                right-hand end. */}
            <span
              style={{ backgroundColor: action.background }}
              className={`${labelShell} ${action.labelClass}`}
            >
              {action.label}
            </span>

            <span
              style={{ backgroundColor: action.background }}
              className={`${discShell} ${action.className}`}
            >
              {action.icon}
            </span>
          </>
        );

        return action.external ? (
          <a
            key={action.id}
            href={action.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={action.label}
            className={rowShell}
          >
            {inner}
          </a>
        ) : (
          <Link
            key={action.id}
            href={action.href}
            aria-label={action.label}
            className={rowShell}
          >
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
