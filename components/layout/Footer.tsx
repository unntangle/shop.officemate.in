import Link from "next/link";
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  Youtube,
} from "lucide-react";
import { SITE } from "@/constants/site";
import { CATEGORIES } from "@/constants/categories";
import { FooterLinkCloud } from "@/components/layout/FooterLinkCloud";
import { FooterAddresses } from "@/components/layout/FooterAddresses";

/**
 * Storefront mega footer.
 *
 * On a retail site the footer is a real navigation surface, not a colophon:
 * it carries policy links a shopper looks for *before* paying (returns,
 * shipping, warranty) and it is where trust signals belong once the
 * merchandising above has done its job.
 *
 * Light ground (#F5F5F5 / `surface`), matching the Frido reference rather than
 * Wakefit's dark footer. Two consequences worth knowing before anyone flips it
 * back to `night`:
 *
 *   1. SeoContent above must stay white. Same-grey blocks stacked give the
 *      footer no top edge.
 *   2. The logo must NOT carry `brightness-0 invert` here. That filter renders
 *      it white, which is correct on a dark band and invisible on this one.
 *
 * PLACEHOLDER: the policy routes below do not exist yet. They are listed
 * because a checkout without visible returns and shipping terms is both a
 * conversion problem and, for an Indian storefront, a compliance one. Create
 * these pages before launch.
 *
 * ORDER INSIDE THE GREY CONTAINER, and the reason for it:
 *
 *   1. Five link columns  — the primary menu.
 *   2. <FooterLinkCloud /> — the dense band of deep links (chair series,
 *      individual models, sort views, workspace zones, payments and
 *      certifications). Content lives in constants/footerLinks.ts.
 *   3. <FooterAddresses /> — corporate office and the four experience
 *      centres. Last on purpose: it is a signature, not navigation.
 *
 * The cloud replaced a standalone "We accept" row, so do not re-add a payment
 * row here or the same seven words appear twice within one screen.
 */

const POLICY_LINKS = [
  { label: "Shipping & delivery", href: "/resources/shipping" },
  { label: "Returns & refunds", href: "/resources/returns" },
  { label: "Warranty terms", href: "/resources/warranty" },
  { label: "Privacy policy", href: "/resources/privacy" },
  { label: "Terms of service", href: "/resources/terms" },
  { label: "Cancellation policy", href: "/resources/cancellation" },
];

const HELP_LINKS = [
  { label: "Track your order", href: "/contact?intent=order" },
  { label: "Contact us", href: "/contact" },
  { label: "Bulk orders", href: "/contact?intent=bulk" },
  { label: "Become a dealer", href: "/contact?intent=dealer" },
  { label: "Book a live demo", href: "/contact?intent=demo" },
  { label: "Find your chair", href: "/advisor" },
];

const COMPANY_LINKS = [
  { label: "About Officemate", href: "/company" },
  { label: "Our projects", href: "/projects" },
  { label: "Infrastructure", href: "/infrastructure" },
  { label: "Social responsibility", href: "/social-responsibility" },
  { label: "Careers", href: "/career" },
  { label: "Resources", href: "/resources" },
];

const SOCIAL_ICONS = {
  Instagram,
  LinkedIn: Linkedin,
  YouTube: Youtube,
  X: Facebook,
} as const;

function Column({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-ink">
        {title}
      </h3>
      <ul className="mt-3.5 space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-[0.8rem] text-muted transition-colors hover:text-azure"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface text-ink">
      {/* ------------------------------------------------ link columns */}
      <div className="container py-12 md:py-14">
        <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            {/* No invert filter — see the note at the top of this file.

                The vector, at a height chosen for its 12.19:1 aspect rather
                than the webp's 8.9:1. Plain <img> because the SVG optimizer
                is off; see the sign-off block at the bottom of this file. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo.svg"
              alt={SITE.name}
              width={739}
              height={61}
              decoding="async"
              className="h-4 w-auto object-contain"
            />
            <p className="mt-4 max-w-xs text-[0.82rem] leading-relaxed text-muted">
              {SITE.tagline} — ergonomic seating, desks and storage engineered
              around how the body actually moves.
            </p>

            <div className="mt-5 space-y-2.5">
              <a
                href={`tel:${SITE.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-2.5 text-[0.82rem] text-ink transition-colors hover:text-azure"
              >
                <Phone size={15} className="shrink-0 text-azure" />
                {SITE.phone}
              </a>
              <a
                href={`mailto:${SITE.email}`}
                className="flex items-center gap-2.5 text-[0.82rem] text-ink transition-colors hover:text-azure"
              >
                <Mail size={15} className="shrink-0 text-azure" />
                {SITE.email}
              </a>
            </div>

            <div className="mt-5 flex gap-2">
              {SITE.social.map((s) => {
                const Icon =
                  SOCIAL_ICONS[s.label as keyof typeof SOCIAL_ICONS] ?? Instagram;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-muted transition-all hover:border-azure hover:bg-azure hover:text-white"
                  >
                    <Icon size={15} />
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-ink">
              Shop
            </h3>
            <ul className="mt-3.5 space-y-2">
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/categories?category=${c.slug}`}
                    className="text-[0.8rem] text-muted transition-colors hover:text-azure"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <Column title="Help" links={HELP_LINKS} />
          <Column title="Policies" links={POLICY_LINKS} />
          <Column title="Company" links={COMPANY_LINKS} />
        </div>

        {/* Deep-link band, then addresses last — see the order note at the
            top of this file. */}
        <FooterLinkCloud />
        <FooterAddresses />
      </div>

      {/* ---------------------------------------------------- legal bar

          Copyright left, wordmark centred, company registration right — all
          on one row. The logo had its own full-width band underneath this;
          folding it in cuts a whole section of height off the end of every
          page and stops the footer trailing away into two near-empty strips.

          A THREE-COLUMN GRID, NOT `justify-between`. With flex, the middle
          item sits between two unequal neighbours — the copyright runs about
          250px and the CIN line about 350px — so the logo lands visibly left
          of centre. Equal grid columns centre it against the page rather than
          against its neighbours.

          `bg-surface`, matching the main footer above rather than the white
          it used to be. That makes the whole footer one ground; the hairline
          is what separates the bar now.

          `border-ink/15`, not `border-line`. See the same note in
          FooterAddresses: `line` is #ECECEC against this #F5F5F5 ground,
          about 4% apart, which is a border nobody can see. `line` is
          calibrated for white surfaces.

          The logo is not a link. One home already exists in the first footer
          column and another in the header; a third adds a tab stop that goes
          where the visitor has just been. `alt=""` for the same reason — the
          company name is spelled out twice in the text either side of it.

          h-5 (20px), about 244px at the vector's 12.19:1 aspect. Plain <img>
          because the SVG optimizer is off; see the first footer column.

          Stacks and centres below `sm`. Three items on one row at phone width
          would leave the CIN — the longest string on the page, and one that
          cannot be shortened — wrapping mid-number. */}
      <div className="border-t border-ink/15 bg-surface">
        <div className="container flex flex-col items-center gap-3 py-5 text-[0.75rem] text-muted sm:grid sm:grid-cols-3 sm:gap-6">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo.svg"
            alt=""
            width={739}
            height={61}
            loading="lazy"
            decoding="async"
            className="h-5 w-auto shrink-0 object-contain sm:justify-self-center"
          />

          <p className="text-center sm:text-right">
            Zebro Officemate Pvt Ltd · CIN {SITE.cin}
          </p>
        </div>
      </div>
    </footer>
  );
}
