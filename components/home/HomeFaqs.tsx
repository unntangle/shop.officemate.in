import { HOME_FAQS } from "@/constants/site";
import { Accordion } from "@/components/common/Accordion";
import { SectionHead } from "@/components/common/SectionHead";

/**
 * Homepage FAQ.
 *
 * Uses `Accordion`'s `card` variant — its docstring already describes that
 * variant as "used on the homepage", so the styling was written for this and
 * simply had nothing mounted against it.
 *
 * Answers come from `HOME_FAQS` in constants/site.ts rather than being written
 * here, so the same set can be reused on the contact and product pages without
 * two copies drifting apart.
 *
 * White ground: the awards band directly above is `bg-surface` grey, and the
 * accordion's open panels are `bg-card` white, which would disappear into a
 * grey section.
 */
export function HomeFaqs() {
  if (HOME_FAQS.length === 0) return null;

  return (
    <section className="section-retail bg-white">
      <div className="container">
        <SectionHead
          title="Frequently asked questions"
          href="/contact"
          linkLabel="Ask us"
          align="center"
        />

        {/* Capped and centred to match the head above. Full-bleed would put
            the chevron a screen-width away from the question it belongs to. */}
        <Accordion
          items={HOME_FAQS}
          variant="card"
          /* Nothing open on load. A pre-opened first row pushes the rest down
             and implies that question matters more than the others, which on
             a general FAQ it does not. */
          defaultOpen={null}
          className="mx-auto max-w-3xl"
        />
      </div>
    </section>
  );
}
