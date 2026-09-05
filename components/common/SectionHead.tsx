import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Homepage section header.
 *
 * Centred by default, matching the Frido reference: a small grey kicker over
 * a heavy headline, with plenty of air beneath. Every section on that page
 * uses this one shape — "Curated Collections / Discover Our Best Picks",
 * "Why Choose Us? / Comfort Backed by Purpose", "Payment Offers / Maximise
 * Your Savings" — and the consistency is most of what makes the page feel
 * composed rather than assembled.
 *
 * The optional "View all" link is pinned to the right on desktop rather than
 * sitting inline, so the title stays optically centred in the container. On
 * mobile it drops below the title, because a floated link beside a centred
 * heading on a narrow screen just crowds it.
 *
 * `align="left"` is still available for inner pages (search results, category
 * listings) where a centred head over a filtered grid would read as odd.
 *
 * Distinct from the showcase `SectionHeading` used on the marketing pages,
 * which is larger and carries an accent rule.
 */
export function SectionHead({
  kicker,
  title,
  description,
  href,
  linkLabel = "View all",
  align = "center",
  className,
}: {
  kicker?: string;
  title: React.ReactNode;
  description?: string;
  href?: string;
  linkLabel?: string;
  align?: "left" | "center";
  className?: string;
}) {
  const link = href ? (
    <Link
      href={href}
      className="group inline-flex items-center gap-1 text-[0.85rem] font-semibold text-accent transition-colors hover:text-accent-deep"
    >
      {linkLabel}
      <ArrowRight
        size={14}
        className="transition-transform duration-300 group-hover:translate-x-0.5"
      />
    </Link>
  ) : null;

  if (align === "left") {
    return (
      <div
        className={cn(
          "mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 md:mb-8",
          className
        )}
      >
        <div>
          {kicker && <p className="kicker mb-1.5">{kicker}</p>}
          <h2 className="section-title">{title}</h2>
          {description && (
            <p className="mt-2.5 max-w-xl text-sm text-muted">{description}</p>
          )}
        </div>
        {link}
      </div>
    );
  }

  return (
    <div className={cn("relative mb-8 md:mb-10", className)}>
      <div className="mx-auto max-w-2xl text-center">
        {kicker && <p className="kicker mb-2">{kicker}</p>}
        <h2 className="section-title">{title}</h2>
        {description && (
          <p className="mx-auto mt-3 max-w-xl text-[0.9rem] leading-relaxed text-muted md:text-[0.95rem]">
            {description}
          </p>
        )}
      </div>

      {link && (
        <div className="mt-4 flex justify-center md:absolute md:bottom-0 md:right-0 md:mt-0">
          {link}
        </div>
      )}
    </div>
  );
}
