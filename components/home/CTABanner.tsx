import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/common/Reveal";
import { EnquireButton } from "@/components/common/EnquireButton";
import { Button } from "@/components/ui/button";

export function CTABanner() {
  return (
    <section className="section pt-0">
      <div className="container">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-16 text-white sm:px-12 sm:py-20 md:px-16 md:py-24">
            {/* hairline sight-line motif */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]"
              aria-hidden
            >
              <defs>
                <pattern
                  id="cta-grid"
                  width="48"
                  height="48"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M48 0H0V48"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cta-grid)" />
            </svg>
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
              style={{ background: "radial-gradient(circle, #C62828, transparent 70%)" }}
              aria-hidden
            />

            {/* Product shot — full-bleed background */}
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <Image
                src="/images/homepage-cta.webp"
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 1200px"
                className="object-cover object-right"
              />
              {/* Keep the copy legible over the shot */}
              <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/30" />
            </div>

            <div className="relative max-w-2xl">
              <span className="eyebrow text-accent-soft">Find your fit</span>
              <h2 className="display mt-4 text-3xl font-semibold leading-[1.08] sm:text-4xl md:text-5xl">
                Ready to sit better for the next decade?
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/70">
                Tell us how you work and we&apos;ll match you to the right chair or
                desk — with pricing, lead time and a live demo if you&apos;d like one.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <EnquireButton
                  variant="accent"
                  size="lg"
                  withArrow
                  label="Enquire Now"
                />
                <Button asChild variant="outline" size="lg" className="border-white/25 text-white hover:border-white hover:bg-white/5">
                  <Link href="/categories">
                    Browse the range
                    <ArrowUpRight size={16} />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
