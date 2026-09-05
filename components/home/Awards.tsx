import { Award } from "lucide-react";
import { AWARDS } from "@/constants/home";
import { Rail } from "@/components/common/Rail";
import { SectionHead } from "@/components/common/SectionHead";

/**
 * Awards and certifications rail.
 *
 * Rendered as typographic cards rather than logo lock-ups. Award and standards
 * marks are trademarked, and reproducing them without a licence is a legal
 * exposure that a homepage band does not justify — the citation carries the
 * same credibility. Drop in licensed artwork here once permissions are on file.
 */
export function Awards() {
  return (
    <section className="section-retail bg-white">
      <div className="container">
        <SectionHead
          kicker="Recognition"
          title="Awards & certifications"
          align="center"
        />

        <Rail ariaLabel="Awards and certifications">
          {AWARDS.map((award) => (
            <div
              key={award.title}
              className="flex w-[14rem] flex-col rounded-2xl border border-line bg-sand p-5 sm:w-[16rem]"
            >
              <Award size={20} className="text-accent" />
              <p className="mt-3 text-[0.9rem] font-bold leading-tight text-ink">
                {award.title}
              </p>
              <p className="mt-1.5 text-[0.75rem] leading-relaxed text-muted">
                {award.detail}
              </p>
            </div>
          ))}
        </Rail>
      </div>
    </section>
  );
}
