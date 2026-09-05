import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Youtube,
} from "lucide-react";
import { LOCATIONS, SITE } from "@/constants/site";
import { CATEGORIES } from "@/constants/categories";

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
              className="text-[0.8rem] text-muted transition-colors hover:text-accent"
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
            {/* No invert filter — see the note at the top of this file. */}
            <Image
              src="/images/logo.webp"
              alt={SITE.name}
              width={140}
              height={34}
              className="h-8 w-auto object-contain"
            />
            <p className="mt-4 max-w-xs text-[0.82rem] leading-relaxed text-muted">
              {SITE.tagline} — ergonomic seating, desks and storage engineered
              around how the body actually moves.
            </p>

            <div className="mt-5 space-y-2.5">
              <a
                href={`tel:${SITE.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-2.5 text-[0.82rem] text-ink transition-colors hover:text-accent"
              >
                <Phone size={15} className="shrink-0 text-accent" />
                {SITE.phone}
              </a>
              <a
                href={`mailto:${SITE.email}`}
                className="flex items-center gap-2.5 text-[0.82rem] text-ink transition-colors hover:text-accent"
              >
                <Mail size={15} className="shrink-0 text-accent" />
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
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-muted transition-all hover:border-accent hover:bg-accent hover:text-white"
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
                    href={`/products?category=${c.slug}`}
                    className="text-[0.8rem] text-muted transition-colors hover:text-accent"
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

        {/* ---------------------------------------------- addresses */}
        <div className="mt-11 grid gap-6 border-t border-line pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {LOCATIONS.map((loc) => (
            <div key={loc.label}>
              <p className="flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-accent">
                <MapPin size={13} />
                {loc.label}
              </p>
              <p className="mt-2 text-[0.82rem] font-semibold text-ink">
                {loc.name}
              </p>
              <address className="mt-1 text-[0.78rem] not-italic leading-relaxed text-muted">
                {loc.lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
              <a
                href={loc.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-[0.76rem] font-semibold text-accent hover:text-accent-deep"
              >
                Get directions →
              </a>
            </div>
          ))}

          <div className="sm:col-span-2">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-ink">
              We accept
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["UPI", "Visa", "Mastercard", "RuPay", "Net banking", "EMI", "COD"].map(
                (method) => (
                  <span
                    key={method}
                    className="rounded-md border border-line bg-white px-2.5 py-1.5 text-[0.72rem] font-medium text-muted"
                  >
                    {method}
                  </span>
                )
              )}
            </div>
            <p className="mt-3 text-[0.72rem] leading-relaxed text-muted">
              Card details are handled entirely by our payment provider. Officemate
              never stores your card number.
            </p>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- legal bar */}
      <div className="border-t border-line bg-white">
        <div className="container flex flex-col gap-2 py-5 text-[0.75rem] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <p>Zebro Officemate Pvt Ltd · CIN placeholder — add before launch</p>
        </div>
      </div>
    </footer>
  );
}
