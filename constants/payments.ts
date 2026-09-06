/* =========================================================================
   PAYMENT MARKS

   The logo strip in the footer ("We accept"). Card networks and UPI apps are
   registered trademarks, so the artwork is NEVER generated or redrawn — each
   file has to be the real mark.

   ALL FIVE MARKS ARE NOW IN THE REPO, but they come in TWO SHAPES, and the
   difference drives how each one is rendered:

   CARD ART — visa, mastercard, amex. From the `payment-icons` package on npm
   (MPL-2.0, github.com/muffinresearch/payment-icons), minified with svgo.
   Each is a 750x471 rounded rectangle with its own background colour baked
   in, so it needs no container: the image IS the tile.

   BARE WORDMARKS — rupay, upi. From Wikimedia Commons, where both are held
   as trademark logos rather than under a free licence. These are transparent
   with no background, and they are much wider than they are tall (RuPay is
   nearly 4:1). Rendered bare at card height they would be enormous and would
   float unbacked on the footer grey, so they get `boxed: true` and sit in a
   white chip instead.

   See NOTICE.md in the payments folder for the licence position on both sets.

   Wikimedia is fine for a merchant displaying marks it accepts, which is this
   case. It is not a substitute for NPCI's own brand kit if the client's legal
   team wants the official asset on file — npci.org.in carries both under
   RuPay and UPI brand guidelines.

   Whichever route you use: do not recolour, do not stretch, respect the
   clear space each brand specifies.

   ONE LEGAL NOTE WORTH PASSING TO THE CLIENT: displaying a network mark is a
   claim that you accept it. Only ship the marks the payment gateway is
   actually live for. An Amex logo above a checkout that declines Amex is a
   consumer-protection problem, not a design detail.

   Until a file exists, <PaymentMarks /> renders that entry as a plain text
   chip instead. Nothing breaks, nothing 404s, and the strip upgrades itself
   one logo at a time as assets arrive.
========================================================================= */

export type PaymentMark = {
  /** Shown as alt text, and as the fallback chip when artwork is missing. */
  label: string;
  /**
   * Public path to the official mark. Omit entirely for methods that have no
   * logo of their own (net banking, EMI, cash on delivery) — those are always
   * text chips.
   */
  src?: string;
  /**
   * Intrinsic aspect. Marks are not all the same shape, and forcing one box
   * on all of them either crops or letterboxes. The tile fixes the height and
   * these drive the width, which is why each entry carries its own numbers.
   */
  width?: number;
  height?: number;
  /**
   * True when the artwork has NO background of its own — a bare wordmark on
   * transparency. Those get a white chip behind them and render smaller;
   * card-shaped art renders bare at full tile height.
   *
   * Get this wrong in either direction and it shows immediately: a card in a
   * chip is a card inside a card, and a bare wordmark without one floats on
   * the footer grey at roughly twice the size of its neighbours.
   */
  boxed?: boolean;
};

/**
 * ORDER IS VISUAL, NOT A RANKING.
 *
 * The two shapes are interleaved — card, chip, card, chip, card — so the strip
 * alternates instead of splitting into a block of three dark cards followed by
 * a block of two white chips. Grouped, the row reads as two unrelated clusters
 * and the eye stops at the seam between them; alternating, it reads as one
 * set.
 *
 * So this is Visa, RuPay, Mastercard, UPI, Amex. Nothing about that sequence
 * implies preference or precedence.
 *
 * If a sixth mark is added, put it where it keeps the alternation going. If
 * the counts stop being 3-and-2, alternation may not be achievable at all —
 * at which point grouping by shape is the better fallback, not a half-broken
 * alternation.
 */
export const PAYMENT_MARKS: PaymentMark[] = [
  /* Card art at 750x471 — aspect 1.59, so all three take the same box. The
     tile caps height at 20px and the width follows. */
  { label: "Visa", src: "/images/payments/visa.svg", width: 32, height: 20 },

  /* Bare wordmarks on transparency, from Wikimedia. Real viewBox aspects:
     RuPay is 71.87 x 18.91 (3.80:1) and UPI is 130.54 x 46.12 (2.83:1) — both
     far wider than the 1.59:1 cards, which is why they render at a smaller
     height inside a chip rather than matching the cards' height. */
  {
    label: "RuPay",
    src: "/images/payments/rupay.svg",
    width: 61,
    height: 16,
    boxed: true,
  },

  {
    label: "Mastercard",
    src: "/images/payments/mastercard.svg",
    width: 32,
    height: 20,
  },

  {
    label: "UPI",
    src: "/images/payments/upi.svg",
    width: 45,
    height: 16,
    boxed: true,
  },

  {
    label: "American Express",
    src: "/images/payments/amex.svg",
    width: 32,
    height: 20,
  },
];

/* REMOVED, and worth knowing why before anyone adds them back:

   Google Pay, PhonePe and Paytm are UPI apps, not payment rails of their
   own. UPI already covers them, so listing all four made the strip longer
   without telling a shopper anything new.

   Net banking, No-cost EMI and Cash on delivery have no marks at all, so they
   rendered as bare text chips in a row of logos — which read as artwork that
   had failed to load rather than as a deliberate choice.

   ⚠ BUT THEY ARE NOW STATED NOWHERE ON THE SITE. The footer's payment text
   list was folded into this strip, and the "How can I pay?" FAQ was cut back
   out of HOME_FAQS. If Officemate accepts cash on delivery, a shopper has no
   way to find that out — which for an Indian storefront is a real conversion
   problem, not a tidiness one. Put them back as a line of text near the strip,
   or as an FAQ entry. */
