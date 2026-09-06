import { waChatHref } from "@/lib/whatsapp";
import { WhatsAppGlyph } from "@/components/common/WhatsAppGlyph";

/**
 * Floating WhatsApp contact button.
 *
 * Pinned flush to the right edge and collapsed to the icon disc, expanding to
 * reveal the label on hover — the Frido pattern. Flush-right rather than
 * inset, so the collapsed state reads as a tab attached to the viewport
 * instead of a second floating pill competing with BackToTop.
 *
 * Vertical position is set against BackToTop (bottom-6, 44px tall): this sits
 * at bottom-24 to clear it. Those two numbers are related — moving one means
 * checking the other, or they overlap on a short viewport.
 *
 * Not a client component. There is no state here, only an anchor, so it stays
 * server-rendered and ships no JS; the expand is pure CSS on :hover. That also
 * means it does not expand on touch, where there is no hover — a tap just
 * opens WhatsApp, which is the only thing the button is for.
 */

/* WhatsApp brand green. Deliberately a literal rather than a Tailwind token:
   it belongs to WhatsApp, not to Officemate, and putting it in the palette
   would invite it to be reused as if it were ours. `save.DEFAULT` is the
   green that carries meaning in this design system. */
const WHATSAPP_GREEN = "#25D366";

export function WhatsAppButton() {
  return (
    <a
      href={waChatHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      style={{ backgroundColor: WHATSAPP_GREEN }}
      className="group fixed bottom-24 right-0 z-40 flex h-12 items-center rounded-l-full px-2 text-white shadow-lift transition-[padding] duration-300 hover:pr-5"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white">
        {/* Colour set inline rather than by class: the brand green is a
            literal, not a palette token. */}
        <WhatsAppGlyph
          className="h-[17px] w-[17px]"
          style={{ color: WHATSAPP_GREEN }}
        />
      </span>

      {/* Animating max-width rather than width: the label has no fixed size,
          and `width: auto` is not a transitionable value. 12rem is a ceiling
          the text never reaches, not a measurement. */}
      <span className="ml-0 max-w-0 overflow-hidden whitespace-nowrap text-[0.85rem] font-semibold transition-all duration-300 group-hover:ml-2.5 group-hover:max-w-[12rem]">
        Chat on WhatsApp
      </span>
    </a>
  );
}
