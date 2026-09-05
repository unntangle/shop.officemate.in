/* =========================================================================
   PAYMENT MARKS

   The logo strip in the footer ("We accept"). Card networks and UPI apps are
   registered trademarks, so the artwork is NOT generated or redrawn — each
   file must be the official mark, downloaded from the owner's brand centre
   and dropped into `public/images/payments/` under the exact filename below.

   WHERE TO GET THEM (all free, all require you to follow the usage rules —
   most importantly: do not recolour, do not stretch, respect clear space):

     Visa              usa.visa.com/run-your-business/small-business-tools/payment-technology/visa-brand-assets.html
     Mastercard        brand.mastercard.com/brandcenter/mastercard-brand-mark.html
     American Express  amex.com \u2192 Merchant Marketing Kit
     RuPay             npci.org.in \u2192 RuPay brand guidelines
     UPI               npci.org.in \u2192 UPI brand guidelines
     Google Pay        developers.google.com/pay/api/web/guides/brand-guidelines
     PhonePe           phonepe.com \u2192 press / brand kit
     Paytm             paytm.com \u2192 brand assets

   ⚠ ONE LEGAL NOTE WORTH PASSING TO THE CLIENT: displaying a network mark is
   a claim that you accept it. Only ship the marks the payment gateway is
   actually live for. An Amex logo on a checkout that declines Amex is a
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
   * Intrinsic aspect. Marks are not all the same shape: Visa and Amex are
   * wide, Mastercard is nearly square, and forcing one box on all of them
   * either crops or letterboxes. The tile is a fixed height and these drive
   * the width, which is why each entry carries its own numbers.
   */
  width?: number;
  height?: number;
};

export const PAYMENT_MARKS: PaymentMark[] = [
  { label: "Visa", src: "/images/payments/visa.svg", width: 48, height: 16 },
  { label: "Mastercard", src: "/images/payments/mastercard.svg", width: 34, height: 22 },
  { label: "American Express", src: "/images/payments/amex.svg", width: 30, height: 22 },
  { label: "RuPay", src: "/images/payments/rupay.svg", width: 48, height: 16 },
  { label: "UPI", src: "/images/payments/upi.svg", width: 44, height: 18 },
  { label: "Google Pay", src: "/images/payments/gpay.svg", width: 44, height: 20 },
  { label: "PhonePe", src: "/images/payments/phonepe.svg", width: 40, height: 20 },
  { label: "Paytm", src: "/images/payments/paytm.svg", width: 44, height: 16 },

  /* No logo of their own — these stay as text chips permanently. */
  { label: "Net banking" },
  { label: "No-cost EMI" },
  { label: "Cash on delivery" },
];
