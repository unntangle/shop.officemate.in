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
 * `align` defaults to "left" with `rule` on: title hard against the container
 * edge, a short accent bar under it, description below, and any "View all"
 * link pinned right on the title's baseline. That is the house style for every
 * section head on the storefront — changing these defaults restyles the whole
 * site at once, which is the point of them living here rather than at each
 * call site.
 *
 * `align="center"` is still available for the occasional band that wants it,
 * and `rule={false}` turns the bar off.
 */
export function SectionHead({
  kicker,
  title,
  description,
  href,
  linkLabel = "View all",
  align = "left",
  rule = true,
  className,
}: {
  kicker?: string;
  title: React.ReactNode;
  description?: string;
  href?: string;
  linkLabel?: string;
  align?: "left" | "center";
  rule?: boolean;
  className?: string;
}) {
  const link = href ? (
    <Link
      href={href}
      /* Azure, not accent red. These "View all" links are navigation — a way
         deeper into a section — not calls to action, and red is reserved here
         for errors and for genuine CTAs. `azure` is the palette's utility
         blue, which already carries the viewer controls and the contact dock
         for exactly that reason. `azure-ink` is its darker step, the hover
         equivalent of `accent-deep`. */
      className="group inline-flex items-center gap-1 text-[0.85rem] font-semibold text-azure transition-colors hover:text-azure-ink"
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
          {rule && (
            <span className="mt-2 block h-[3px] w-12 rounded-full bg-accent" />
          )}
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
        {rule && (
          <span className="mx-auto mt-2.5 block h-[3px] w-12 rounded-full bg-accent" />
        )}
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
