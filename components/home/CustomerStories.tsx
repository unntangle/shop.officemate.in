import { Play, Quote } from "lucide-react";
import { VIDEO_STORIES } from "@/constants/home";
import { Rail } from "@/components/common/Rail";
import { SectionHead } from "@/components/common/SectionHead";

/**
 * Customer stories — the video testimonial band.
 *
 * The play control is rendered as a disabled-looking overlay on a typographic
 * card rather than as a live player, because no footage exists yet. Shipping a
 * play button that does nothing is worse than shipping none: it reads as a
 * broken embed, and the quote underneath is doing the real work anyway. Wire
 * these to real video once approved footage lands.
 */
export function CustomerStories() {
  return (
    <section className="section-retail bg-night">
      <div className="container">
        <div className="mx-auto mb-6 max-w-2xl text-center md:mb-8">
          <p className="text-[0.78rem] font-medium text-white/55">
            Happy workspace stories
          </p>
          <h2 className="section-title text-white">Customer testimonials</h2>
        </div>

        <Rail ariaLabel="Customer stories">
          {VIDEO_STORIES.map((story) => (
            <article
              key={story.name}
              className="flex w-[16rem] flex-col rounded-2xl border border-night-line bg-night-soft p-5 sm:w-[19rem]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <Play size={16} className="fill-accent" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[0.85rem] font-bold text-white">
                    {story.name}
                  </p>
                  <p className="truncate text-[0.7rem] text-white/50">
                    {story.role} · {story.company}
                  </p>
                </div>
              </div>

              <Quote size={20} className="mt-5 text-accent" />
              <p className="mt-2 text-[0.85rem] leading-relaxed text-white/80">
                {story.quote}
              </p>
            </article>
          ))}
        </Rail>
      </div>
    </section>
  );
}
