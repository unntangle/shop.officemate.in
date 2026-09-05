import { SITE } from "@/constants/site";

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

/** wa.me wants a bare international number — no +, spaces or dashes. */
const waNumber = SITE.phone.replace(/\D/g, "");

export function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${waNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      style={{ backgroundColor: WHATSAPP_GREEN }}
      className="group fixed bottom-24 right-0 z-40 flex h-12 items-center rounded-l-full px-2 text-white shadow-lift transition-[padding] duration-300 hover:pr-5"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white">
        <svg
          viewBox="0 0 24 24"
          width="17"
          height="17"
          fill={WHATSAPP_GREEN}
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.898 9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413" />
        </svg>
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
