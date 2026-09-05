import Link from "next/link";
import {
  FOOTER_LINK_COLUMNS,
  type FooterLink,
  type FooterLinkColumn,
} from "@/constants/footerLinks";
import { PaymentMarks } from "@/components/layout/PaymentMarks";

/**
 * The dense link band at the foot of the footer.
 *
 * Rendered as pipe-separated inline runs rather than stacked <ul> lists. That
 * is not a stylistic preference — a block this wide (roughly seventy links)
 * stacked one-per-line would add two screens of height to every page on the
 * site. Inline runs let a column of twelve links occupy three lines, which is
 * how Wakefit, Pepperfry and Nykaa all handle the same problem.
 *
 * Type is deliberately the quietest on the page: `muted` at 0.76rem, no
 * underline, accent only on hover. This band is for the shopper who is
 * actively hunting and for the crawler; it must not compete with the real
 * footer columns above it.
 *
 * Items without an `href` render as plain text. Payment methods and
 * certifications are statements about the business, not destinations, and
 * wrapping them in anchors that go nowhere is worse than useless — it costs a
 * keyboard user seven extra tab stops per column.
 */

function Separator() {
  /* aria-hidden: a screen reader announcing "pipe" between every link turns a
     scannable row into noise. The links are still individually focusable. */
  return (
    <span aria-hidden className="mx-1.5 select-none text-ink/20">
      |
    </span>
  );
}

function LinkRun({ links }: { links: FooterLink[] }) {
  return (
    <p className="mt-2.5 text-[0.76rem] leading-[1.95] text-muted">
      {links.map((link, i) => (
        <span key={`${link.label}-${i}`}>
          {i > 0 && <Separator />}
          {!link.href ? (
            <span>{link.label}</span>
          ) : link.external ? (
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-accent"
            >
              {link.label}
            </a>
          ) : (
            <Link href={link.href} className="transition-colors hover:text-accent">
              {link.label}
            </Link>
          )}
        </span>
      ))}
    </p>
  );
}

function Column({ column }: { column: FooterLinkColumn }) {
  return (
    <div>
      <h3 className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-ink">
        {column.title}
      </h3>

      <div className="mt-4 space-y-4">
        {column.sets.map((set) => (
          <div key={set.heading}>
            {/* Sub-heading sits a step below the column title in weight, not
                in size — two type sizes inside a 0.72rem heading system are
                indistinguishable, so the hierarchy is carried by colour. */}
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted">
              {set.heading}
            </p>
            <LinkRun links={set.links} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FooterLinkCloud() {
  return (
    /* mt-11 because this is now the first divider after the main link
       columns — it inherited the spacing the addresses block used to have
       there. <FooterAddresses /> below uses the tighter mt-9. */
    <div className="mt-11 border-t border-line pt-8">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
        {FOOTER_LINK_COLUMNS.map((column) => (
          <Column key={column.title} column={column} />
        ))}
      </div>

      {/* Payment marks sit full-width beneath the grid rather than inside a
          column. Logo tiles have a fixed height and a ragged set of widths,
          so boxed into a quarter-width column they wrap into three uneven
          rows; across the full width they read as one strip, which is what
          the pattern is for. */}
      <div className="mt-8 border-t border-line pt-7">
        <PaymentMarks />

        {/* Kept from the old standalone "We accept" row. The sentence is a
            security statement a shopper looks for at checkout, and it belongs
            under the payment marks rather than floating on its own. */}
        <p className="mt-4 text-center text-[0.72rem] leading-relaxed text-muted">
          Card details are handled entirely by our payment provider. Officemate
          never stores your card number.
        </p>
      </div>
    </div>
  );
}
