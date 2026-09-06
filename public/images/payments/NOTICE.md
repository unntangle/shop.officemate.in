# Payment mark attribution

## Card art — Visa, Mastercard, American Express

`visa.svg`, `mastercard.svg` and `amex.svg` are taken from **payment-icons** —
https://github.com/muffinresearch/payment-icons — and are licensed under the
**Mozilla Public License 2.0** (https://mozilla.org/MPL/2.0/). They have been
minified with svgo; no other change was made to the artwork.

MPL-2.0 is file-level copyleft: if you modify these SVGs, the modified files
stay under MPL-2.0 and this notice has to travel with them. The rest of this
project is unaffected.

## Wordmarks — RuPay, UPI

`rupay.svg` and `upi.svg` come from **Wikimedia Commons**, which holds both as
trademark logos rather than under a free content licence. Neither is in any npm
icon package — this was checked across several, including sets of 100+ icons.

These are the original Inkscape-authored files, unmodified. They have not been
run through svgo, so they still carry editor metadata and are larger than they
need to be. Minifying them is safe and would cut them by roughly half.

## Trademarks

Separately from the licence on the SVG source: **the marks themselves are
registered trademarks** of Visa Inc., Mastercard International, American
Express and NPCI. Displaying them is a claim that Officemate accepts those
methods, and that claim is only true if the payment gateway is live for each
one. Remove any mark the gateway does not actually support.

Wikimedia is an acceptable source for a merchant displaying marks it accepts.
It is **not** a substitute for NPCI's own brand kit if the client's legal team
wants the official asset on file — npci.org.in publishes both under its RuPay
and UPI brand guidelines, along with the clear-space and minimum-size rules
that apply to each.

## If you add another mark

Two shapes are handled, and the `boxed` flag in `constants/payments.ts` tells
them apart:

- **Card art** (a coloured rounded rectangle, like the three above) renders
  bare at full tile height — the image is its own tile.
- **Bare wordmarks** on transparency (like RuPay and UPI) render smaller inside
  a white chip, because they are far wider than they are tall and would
  otherwise float unbacked on the footer.

Set `boxed: true` for anything transparent. Getting it wrong is immediately
visible in either direction.
