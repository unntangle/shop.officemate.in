import { SEO_SECTIONS } from "@/constants/home";

/**
 * Long-form copy block at the foot of the homepage.
 *
 * Every large Indian furniture storefront carries one of these, and the reason
 * is search rather than reading: it is the only place on the page with enough
 * body text to rank for category terms. It is set small and low-contrast on
 * purpose — it should be findable, not competing with the merchandising above.
 *
 * `accent-soft` (#FDECEA) pooling in two corners over white — the same tint
 * as the floating connect button. It was flat white, which left this block
 * and the #F5F5F5 footer beneath it reading as one undifferentiated slab of
 * small text roughly 900px tall. The tint gives the band its own identity and
 * marks where the page's content ends and its plumbing begins.
 *
 * TWO RADIAL GRADIENTS, top-left and bottom-right, over a white base colour.
 * They are set diagonally opposite on purpose: colour enters at the corner
 * where the eye starts reading and again at the corner where it finishes, so
 * the band is framed rather than washed. Putting both on the same side would
 * just read as a lopsided fill.
 *
 * The middle stays near-white, which is where the densest text sits — so the
 * tint never competes with the paragraphs it surrounds.
 *
 * `bg-white` and the `bg-[...]` gradient are not fighting: Tailwind routes a
 * gradient value to `background-image` and a colour to `background-color`, so
 * the white is the base the two radials sit on. Removing `bg-white` leaves
 * the corners bleeding onto whatever is behind the section.
 *
 * The hex is written literally rather than via `theme()`. It has to be inline
 * in an arbitrary value, and a `theme()` call nested inside a multi-gradient
 * value is exactly the kind of thing that parses today and breaks on a
 * Tailwind upgrade. If `accent.soft` changes, change it here too.
 *
 * `55%_70%_at_0%_0%` is ellipse-size then position; the underscores are
 * Tailwind's escape for spaces inside an arbitrary value, not CSS syntax.
 *
 * No `border-t` — the colour change is the edge. A hairline on top of a tint
 * change draws the join twice.
 *
 * The type colours are unchanged and still clear their targets: `ink` on the
 * densest part of this tint is about 11:1 and `muted` about 5.3:1. Do not
 * deepen the corners much further without re-checking the body text, which
 * is the one at risk.
 */
export function SeoContent() {
  return (
    <section className="bg-white bg-[radial-gradient(55%_70%_at_0%_0%,#FDECEA,transparent_72%),radial-gradient(55%_70%_at_100%_100%,#FDECEA,transparent_72%)] py-10 md:py-12">
      <div className="container">
        <div className="grid gap-6 md:grid-cols-2 md:gap-x-10">
          {SEO_SECTIONS.map((block) => (
            <div key={block.heading}>
              {/* `font-semibold`, not bold. At 0.95rem this heading is barely
                  larger than the body beneath it, so weight is doing all the
                  hierarchy work — and at 700 against a 400 body the contrast
                  was heavy enough that the headings read as the content and
                  the paragraphs as footnotes. 600 still separates them
                  clearly at this size without the block turning into a wall
                  of bold. */}
              <h2 className="text-[0.95rem] font-semibold leading-snug text-ink">
                {block.heading}
              </h2>
              <p className="mt-2 text-[0.82rem] leading-relaxed text-muted">
                {block.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
