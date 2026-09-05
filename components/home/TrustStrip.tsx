"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Headset, ShieldCheck, Truck, Wrench } from "lucide-react";
import { TRUST_POINTS } from "@/constants/home";

const ICONS = [Truck, Wrench, ShieldCheck, BadgeCheck];

/**
 * Sale countdown + trust row, directly under the hero.
 *
 * The countdown runs to the end of the current day rather than to a hardcoded
 * date. A hardcoded deadline is the classic way this component rots: it ships,
 * the date passes, and the storefront starts advertising a sale that ended
 * with a row of zeroes. Swap `endOfToday` for a real campaign end date from
 * the CMS when one exists.
 */
function endOfToday(): number {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/**
 * Time left until `target`.
 *
 * `left` starts as null rather than a computed value, and that is the whole
 * point: the server renders at one instant and the browser hydrates at
 * another, so anything derived from `Date.now()` during the first render is
 * guaranteed to disagree across the boundary — a seconds field will differ
 * on essentially every load. React reports that as a hydration error and
 * throws away the server tree.
 *
 * So the first client render deliberately matches the server's "no value
 * yet", and the real countdown starts in the effect, which never runs on the
 * server. `ready` lets the caller hold the widget back until then.
 */
function useCountdown(target: number) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setLeft(Math.max(0, target - Date.now()));
    /* Tick once immediately so the countdown appears on the first frame
       after mount rather than a second later. */
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  const s = Math.floor((left ?? 0) / 1000);
  return {
    ready: left !== null,
    hours: String(Math.floor(s / 3600)).padStart(2, "0"),
    minutes: String(Math.floor((s % 3600) / 60)).padStart(2, "0"),
    seconds: String(s % 60).padStart(2, "0"),
    expired: left !== null && left <= 0,
  };
}

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="min-w-[2.1rem] rounded-md bg-night px-1.5 py-1 text-[0.95rem] font-bold tabular-nums text-white">
        {value}
      </div>
      <p className="mt-0.5 text-[0.6rem] uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}

export function TrustStrip() {
  const [target] = useState(endOfToday);
  const { ready, hours, minutes, seconds, expired } = useCountdown(target);

  return (
    <section className="border-b border-line bg-white">
      <div className="container">
        <div className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:gap-6">
          {/* Countdown. Held back until the client has a real time (see
              useCountdown), and hidden once it hits zero rather than showing
              00:00:00, which reads as a broken widget instead of an ended
              sale. */}
          {ready && !expired && (
            <div className="flex shrink-0 items-center gap-3 rounded-xl border border-line bg-sand px-4 py-2.5">
              <div>
                <p className="text-[0.7rem] font-bold uppercase tracking-wide text-accent">
                  Sale ends in
                </p>
                <p className="text-[0.68rem] text-muted">Today only</p>
              </div>
              <div className="flex items-center gap-1">
                <Unit value={hours} label="Hrs" />
                <span className="pb-3 font-bold text-muted">:</span>
                <Unit value={minutes} label="Min" />
                <span className="pb-3 font-bold text-muted">:</span>
                <Unit value={seconds} label="Sec" />
              </div>
            </div>
          )}

          <div className="hidden h-10 w-px bg-line lg:block" />

          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
            {TRUST_POINTS.map((point, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <div key={point.label} className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.82rem] font-bold leading-tight text-ink">
                      {point.value}
                    </p>
                    <p className="truncate text-[0.7rem] text-muted">{point.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <a
            href="tel:+919789827270"
            className="hidden shrink-0 items-center gap-2 rounded-full border border-line px-4 py-2.5 text-[0.8rem] font-semibold text-ink transition-colors hover:border-ink hover:bg-surface xl:flex"
          >
            <Headset size={15} className="text-accent" />
            Talk to an expert
          </a>
        </div>
      </div>
    </section>
  );
}
