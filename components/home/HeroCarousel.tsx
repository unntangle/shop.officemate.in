"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
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

  useEffect(() => {
    if (reduce || paused) return;
    const id = window.setInterval(() => {
      setDir(1);
      setIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [reduce, paused]);

  const slide = HERO_SLIDES[index];

  const variants = {
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
      <div className="relative h-[19rem] w-full overflow-hidden sm:h-[23rem] lg:h-[29rem]">
        <AnimatePresence initial={false} custom={dir} mode="sync">
          <motion.div
            key={index}
            custom={dir}
            variants={reduce ? undefined : variants}
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

        {/* Scrim, not the band colour. The headline sits on top of arbitrary
           photography, so this gradient is carrying text contrast — lightening
           it along with the section bands would make the hero copy fail on any
           bright banner image. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-scrim/85 via-scrim/50 to-transparent" />

        <div className="absolute inset-0 z-10 flex items-center">
          <div className="container">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={reduce ? undefined : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: EASE }}
                className="max-w-md lg:max-w-lg"
              >
                <span className="inline-block rounded-full bg-accent px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-white">
                  {slide.eyebrow}
                </span>
                <h1 className="mt-3 text-[1.8rem] font-bold leading-[1.1] tracking-[-0.03em] text-white sm:text-[2.3rem] lg:text-[3rem]">
                  {slide.heading}
                </h1>
                <p className="mt-2.5 max-w-sm text-[0.85rem] leading-relaxed text-white/85 sm:text-[0.95rem]">
                  {slide.sub}
                </p>
                <Link
                  href={slide.cta.href}
                  className="group mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-white shadow-accent transition-all hover:bg-accent-deep active:scale-[0.98]"
                >
                  {slide.cta.label}
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <button
          onClick={() => go(index - 1)}
          aria-label="Previous banner"
          className="absolute left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/25 md:flex"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => go(index + 1)}
          aria-label="Next banner"
          className="absolute right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/25 md:flex"
        >
          <ChevronRight size={20} />
        </button>

        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Banner ${i + 1} of ${HERO_SLIDES.length}`}
              aria-current={i === index}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === index ? 22 : 8,
                background: i === index ? "#fff" : "rgba(255,255,255,0.45)",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
