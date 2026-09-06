import Link from "next/link";
import { ArrowRight, Sparkles, Video, Zap } from "lucide-react";

/**
 * The three full-width promotional bands from the Wakefit reference: the
 * product-finder quiz, the flash sale strip and the live video-call shopping
 * banner.
 *
 * Grouped in one file because they share a single visual shape — a full-bleed
 * coloured band with an icon, a two-line message and one action — and splitting
 * three near-identical thirty-line components across three files makes the
 * shared shape harder to keep consistent, not easier.
 */

function Band({
  tone,
  icon,
  eyebrow,
  title,
  sub,
  cta,
  href,
}: {
  tone: "advisor" | "flash" | "live";
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  sub: string;
  cta: string;
  href: string;
}) {
  const tones = {
    /* Sage, not red. The advisor measures rather than sells, and dressing a
       diagnostic tool in the CTA colour makes it read as an upsell. */
    advisor: {
      wrap: "bg-sage-soft border-sage/30",
      chip: "bg-sage text-white",
      title: "text-sage-ink",
      sub: "text-sage-ink/75",
      btn: "bg-sage-ink text-white hover:bg-sage-ink/90",
    },
    flash: {
      wrap: "bg-accent border-accent",
      chip: "bg-white/20 text-white",
      title: "text-white",
      sub: "text-white/85",
      btn: "bg-white text-accent hover:bg-white/90",
    },
    live: {
      wrap: "bg-night border-night",
      chip: "bg-accent text-white",
      title: "text-white",
      sub: "text-white/70",
      btn: "bg-accent text-white hover:bg-accent-deep",
    },
  }[tone];

  return (
    <div
      className={`flex flex-col items-start gap-4 rounded-2xl border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6 ${tones.wrap}`}
    >
      <div className="flex items-center gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tones.chip}`}
        >
          {icon}
        </span>
        <div>
          <p className={`text-[0.7rem] font-bold uppercase tracking-[0.1em] ${tones.sub}`}>
            {eyebrow}
          </p>
          <p className={`mt-0.5 text-[1.05rem] font-bold leading-tight sm:text-[1.25rem] ${tones.title}`}>
            {title}
          </p>
          <p className={`mt-1 text-[0.8rem] ${tones.sub}`}>{sub}</p>
        </div>
      </div>

      <Link
        href={href}
        className={`group inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-6 text-[0.85rem] font-semibold transition-all active:scale-[0.98] ${tones.btn}`}
      >
        {cta}
        <ArrowRight
          size={15}
          className="transition-transform duration-300 group-hover:translate-x-1"
        />
      </Link>
    </div>
  );
}

/** "Confused? Find your perfect mattress" → find your perfect chair. */
export function AdvisorBanner() {
  return (
    <section className="section-retail bg-white">
      <div className="container">
        <Band
          tone="advisor"
          icon={<Sparkles size={19} />}
          eyebrow="Not sure which chair?"
          title="Find your perfect chair in 60 seconds"
          sub="Six questions about how you sit, and we shortlist three models."
          cta="Start the advisor"
          href="/advisor"
        />
      </div>
    </section>
  );
}

/** Flash sale strip. */
export function FlashSaleStrip() {
  return (
    <section className="pb-4 pt-0">
      <div className="container">
        <Band
          tone="flash"
          icon={<Zap size={19} />}
          eyebrow="Flash sale"
          title="These deals are too good to scroll past"
          sub="Extra 7% off with select bank cards, today only."
          cta="Shop deals"
          href="/categories?sort=discount"
        />
      </div>
    </section>
  );
}

/** Shop live over a video call. */
export function LiveShoppingBanner() {
  return (
    <section className="section-retail bg-white">
      <div className="container">
        <Band
          tone="live"
          icon={<Video size={19} />}
          eyebrow="Shop live"
          title="See it in the showroom, from your desk"
          sub="A specialist walks you through the range on a video call."
          cta="Book a live demo"
          href="/contact?intent=demo"
        />
      </div>
    </section>
  );
}
