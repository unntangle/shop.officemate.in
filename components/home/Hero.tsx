"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnquireButton } from "@/components/common/EnquireButton";
import { EASE } from "@/lib/motion";

const SLIDES = [
  {
    src: "/images/hero.webp",
    alt: "Ergonomic office chairs for every workspace",
    heading: "Ergonomic Office Chairs for Every Workspace",
    sub: "Modular office furniture, engineered for enterprise scale.",
    category: "Task Chairs",
  },
  {
    src: "/images/hero2.webp",
    alt: "Premium ergonomic office seating",
    heading: "Premium Seating Engineered for Productivity",
    sub: "Designed from posture data — not mood boards. Built to last a decade.",
    category: "Executive Chairs",
  },
];

export function Hero() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const go = useCallback(
    (next: number) => {
      setDirection(next > index ? 1 : -1);
      setIndex(next);
    },
    [index]
  );

  const prev = () => go((index - 1 + SLIDES.length) % SLIDES.length);
  const next = () => go((index + 1) % SLIDES.length);

  /* Auto-advance every 5 seconds */
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(id);
  }, [reduce]);

  const slide = SLIDES[index];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <section className="relative w-full overflow-hidden">
      {/* Full-bleed hero slider */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: "100dvh", minHeight: "560px" }}
      >
        <AnimatePresence initial={false} custom={direction} mode="sync">
          <motion.div
            key={index}
            custom={direction}
            variants={reduce ? undefined : variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={index === 0}
              className="object-cover object-center animate-zoom-in-out"
              sizes="100vw"
            />
          </motion.div>
        </AnimatePresence>

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />

        {/* Text overlay — bottom-left */}
        <div className="absolute inset-0 flex items-end pb-12 md:pb-16 z-10">
          <div className="container">
            <div className="max-w-md lg:max-w-xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={reduce ? undefined : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -12 }}
                  transition={{ duration: 0.5, ease: EASE }}
                >
                  <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                    {slide.heading}
                  </h1>
                  <p className="mt-4 text-sm leading-relaxed text-white/80 md:text-base">
                    {slide.sub}
                  </p>
                </motion.div>
              </AnimatePresence>

              <motion.div
                initial={reduce ? undefined : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.32 }}
                className="mt-6 flex flex-wrap items-center gap-3"
              >
                <Button asChild variant="primary" size="lg" className="group">
                  <Link href="/categories">
                    Explore the range
                    <ArrowRight
                      size={17}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </Link>
                </Button>
                <EnquireButton
                  size="lg"
                  variant="ghost"
                  label="Enquire Now"
                  className="border border-white/60 text-white hover:bg-white/10 hover:text-white hover:border-white"
                />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom-right category pill */}
        <div className="absolute bottom-10 right-6 md:bottom-14 md:right-14 z-10">
          <Link
            href="/categories"
            className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/25"
          >
            {slide.category}
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink">
              <ArrowRight size={13} />
            </span>
          </Link>
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 md:bottom-5 z-10">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === index ? 20 : 8,
                background: i === index ? "#fff" : "rgba(255,255,255,0.4)",
              }}
            />
          ))}
        </div>

        {/* Left / Right navigation arrows */}
        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/25 border border-white/20 active:scale-95"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/25 border border-white/20 active:scale-95"
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>
      </div>

    </section>
  );
}
