"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HERO_SLIDES } from "@/constants/home";
import { EASE } from "@/lib/motion";

/**
 * Retail hero banner.
 *
 * Deliberately much shorter than the showcase hero it replaces: a full-viewport
 * banner on a storefront pushes the first row of shoppable product below the
 * fold, and the category grid is what converts. Height is capped so the trust
 * strip is always visible on a laptop.
 */
export function HeroCarousel() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (next: number) => {
      setDir(next > index ? 1 : -1);
      setIndex((next + HERO_SLIDES.length) % HERO_SLIDES.length);
    },
    [index]
  );

  /* Autoplay is NOT gated on `reduce`.

     It used to be, and that was wrong: a shopper with reduced motion turned
     on — which is the default on Windows once "show animations" is off — saw
     slide one and only slide one, forever. Two of the three offers simply
     never existed for them. Reduced motion should suppress the sliding
     transition, not the content rotation, so the interval runs for everyone
     and `variants` below swaps the slide for a crossfade instead. */
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setDir(1);
      setIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, 3000);
    return () => window.clearInterval(id);
  }, [paused]);

  const slide = HERO_SLIDES[index];

  /* Always a real variants object. Passing `undefined` here while `initial`
     and `animate` were still variant *labels* left framer resolving names
     against nothing. */
  const variants = reduce
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0.4 }),
        center: { x: 0, opacity: 1 },
        exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0.4 }),
      };

  return (
    <section
      className="relative w-full overflow-hidden bg-surface"
      /* Pausing on hover is not politeness, it's necessary: a banner that
         advances while someone is reading the offer loses the click. */
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured offers"
    >
      <div className="relative h-[17rem] w-full overflow-hidden sm:h-[20rem] lg:h-[25rem]">
        <AnimatePresence initial={false} custom={dir} mode="sync">
          <motion.div
            key={index}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.55, ease: EASE }}
            className="absolute inset-0"
          >
            <Image
              src={slide.image}
              alt=""
              fill
              priority={index === 0}
              className="object-cover object-center"
              sizes="100vw"
            />
          </motion.div>
        </AnimatePresence>

        {/* Scrim runs bottom-up, not left-right.

           The copy sits in the lower-left corner now rather than centred, so
           a horizontal gradient would be darkening the wrong half of the
           frame — heavy where the product usually is and thin exactly where
           the headline lands. This is carrying text contrast over arbitrary
           photography, so it can't be lightened along with the section
           bands. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-scrim/85 via-scrim/35 to-transparent" />

        <div className="absolute inset-0 z-10 flex items-end pb-12 lg:pb-16">
          <div className="container">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={reduce ? undefined : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: EASE }}
                className="max-w-lg lg:max-w-xl"
              >
                {/* Two lines only, matching the reference: a light kicker
                   over a bold headline, then the button. The longer `sub`
                   copy in HERO_SLIDES is deliberately not rendered here — a
                   third block of text made the stack taller than a 25rem
                   banner could hold, which is why the headline was riding up
                   into the middle of the frame. The field is left in the data
                   for whatever replaces this. */}
                <span className="block text-[0.95rem] text-white/85 sm:text-[1.05rem]">
                  {slide.eyebrow}
                </span>
                <h1 className="mt-1 text-[1.9rem] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-[2.4rem] lg:text-[3rem]">
                  {slide.heading}
                </h1>
                <Link
                  href={slide.cta.href}
                  className="mt-5 inline-flex h-12 items-center rounded-full bg-accent px-7 text-[0.875rem] font-semibold text-white transition-all hover:bg-accent-deep active:scale-[0.98]"
                >
                  {slide.cta.label}
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Dots and arrows sit together in the bottom-right corner rather
           than on the mid-edges. Mid-edge arrows overlap the product in a
           banner this short, and they compete with the CTA for the same
           horizontal band. Grouping them corners all the chrome away from the
           copy. */}
        <div className="absolute bottom-5 right-5 z-10 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Banner ${i + 1} of ${HERO_SLIDES.length}`}
                aria-current={i === index}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === index ? 26 : 10,
                  background: i === index ? "#fff" : "rgba(255,255,255,0.5)",
                }}
              />
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <button
              onClick={() => go(index - 1)}
              aria-label="Previous banner"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink shadow-soft transition-colors hover:bg-surface"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => go(index + 1)}
              aria-label="Next banner"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink shadow-soft transition-colors hover:bg-surface"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
