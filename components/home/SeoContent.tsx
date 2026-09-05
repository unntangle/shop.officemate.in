import { SEO_SECTIONS } from "@/constants/home";

/**
 * Long-form copy block at the foot of the homepage.
 *
 * Every large Indian furniture storefront carries one of these, and the reason
 * is search rather than reading: it is the only place on the page with enough
 * body text to rank for category terms. It is set small and low-contrast on
 * purpose — it should be findable, not competing with the merchandising above.
 *
 * White ground, not `surface`. The footer below is #F5F5F5, and two adjacent
 * blocks of the same grey read as one ~900px slab with no edge between them.
 */
export function SeoContent() {
  return (
    <section className="border-t border-line bg-white py-10 md:py-12">
      <div className="container">
        <div className="grid gap-6 md:grid-cols-2 md:gap-x-10">
          {SEO_SECTIONS.map((block) => (
            <div key={block.heading}>
              <h2 className="text-[0.95rem] font-bold leading-snug text-ink">
                {block.heading}
              </h2>
              <p className="mt-2 text-[0.82rem] leading-relaxed text-muted">
                {block.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
