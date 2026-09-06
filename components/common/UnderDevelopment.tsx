import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Placeholder for routes that are still being built.
 *
 * Deliberately a real page rather than a 404: these are linked from the navbar
 * and footer, so a visitor arriving here hasn't made a mistake — the content
 * just isn't ready. It says so, and points at the parts of the site that are.
 *
 * Each parked route keeps its original implementation alongside it as
 * `page.wip.tsx`. Next only routes a file named exactly `page.tsx`, so those
 * sit dormant until they're renamed back.
 */
export function UnderDevelopment({
  title,
  description,
}: {
  /** The section's name, as it appears in the nav. */
  title: string;
  /** One line on what will eventually live here. */
  description?: string;
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 pt-24">
      <div className="text-center">
        <span className="eyebrow">{title}</span>
        <h1 className="display mt-4 text-5xl font-semibold text-ink sm:text-6xl">
          Under development
        </h1>
        <p className="lede mx-auto mt-5 max-w-md">
          {description ??
            "We're still putting this section together. It'll be here shortly."}
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="primary" size="lg">
            <Link href="/categories">Browse categories</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
