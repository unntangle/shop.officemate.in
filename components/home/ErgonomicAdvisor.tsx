"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MessageCircle, Armchair, Activity } from "lucide-react";
import { Reveal } from "@/components/common/Reveal";
import { OmateMark } from "@/components/common/OmateMark";

/**
 * Homepage intro to Omate AI — Officemate's AI ergonomic advisor.
 *
 * Rather than embedding the live chat here, the section introduces Omate AI as
 * a personality and invites the visitor to "chat and know your best chair."
 * The CTA carries them to /advisor where the real conversation happens.
 *
 * Palette: warm neutral (cream + walnut) grounds, with the brand's running
 * gradient reserved for Omate AI's own marks (the avatar halo and the CTA) so
 * the advisor reads as something a little more alive than the rest of the page.
 */
export function ErgonomicAdvisor() {
  const reduce = useReducedMotion();

  return (
    <section className="bg-surface py-14 md:py-16">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-16">
          {/* Left — who Omate AI is */}
          <Reveal>
            <h2 className="display text-3xl font-semibold leading-[1.08] text-ink sm:text-4xl md:text-[2.75rem]">
              Meet Omate AI, your
              <br />
              ergonomic advisor.
            </h2>

            <p className="mt-5 text-lg leading-relaxed text-muted">
              Omate AI is Officemate&apos;s AI ergonomic advisor. Tell it how
              you work and where it hurts, and it&apos;ll help you{" "}
              <span className="font-semibold text-ink">
                chat and know your best chair
              </span>{" "}
              — matched against the Chair Health Score, with no showroom visit
              and no sales pitch.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-card px-3 py-1.5 text-xs font-medium text-muted">
                Under 30 seconds
              </span>
              <span className="rounded-full bg-card px-3 py-1.5 text-xs font-medium text-muted">
                Free · No sign-up
              </span>
              <span className="rounded-full bg-card px-3 py-1.5 text-xs font-medium text-muted">
                4 quick questions
              </span>
            </div>
          </Reveal>

          {/* Right — the "Meet Omate AI" card */}
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-card shadow-soft ring-1 ring-line/70">
              {/* soft gradient washes */}
              <div
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-accent/10 via-walnut/10 to-transparent blur-3xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-gradient-to-tr from-walnut/10 to-transparent blur-3xl"
              />

              <div className="relative flex flex-col items-center px-6 py-10 text-center sm:px-10">
                {/* Avatar with a living gradient halo */}
                <motion.div
                  animate={reduce ? undefined : { y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="gradient-ring grid h-20 w-20 place-items-center"
                >
                  <OmateMark className="h-8 w-8 text-white" />
                </motion.div>

                {/* Online status */}
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1 text-xs font-medium text-green-700">
                  <span className="relative flex h-1.5 w-1.5">
                    {!reduce && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                    )}
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                  </span>
                  Online · replies instantly
                </span>

                {/* Name + role */}
                <h3 className="display mt-4 text-2xl font-semibold text-ink">
                  Omate AI
                </h3>
                <p className="mt-1 text-sm font-medium text-walnut">
                  Your ergonomic advisor
                </p>

                {/* Tagline */}
                <p className="mt-4 max-w-xs text-[0.95rem] leading-relaxed text-muted">
                  Chat and know your best chair. Four quick questions, and
                  Omate AI matches you to the one that actually fits how you
                  sit.
                </p>

                {/* The three-beat of what it does */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[0.72rem] font-medium text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <MessageCircle size={13} className="text-walnut" />
                    Tell it how you sit
                  </span>
                  <span className="text-line">•</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Armchair size={13} className="text-walnut" />
                    Get matched
                  </span>
                  <span className="text-line">•</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Activity size={13} className="text-walnut" />
                    See your score
                  </span>
                </div>

                {/* CTA — into the real chat on /advisor */}
                <Link
                  href="/advisor"
                  aria-label="Ask Omate AI"
                  className="gradient-pill group mt-7 text-[0.95rem]"
                >
                  <span className="relative z-[1] inline-flex items-center gap-2">
                    <OmateMark className="h-4 w-4 text-white/90 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                    Ask Omate AI
                    <ArrowRight
                      size={15}
                      className="transition-transform duration-300 group-hover:translate-x-0.5"
                    />
                  </span>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
