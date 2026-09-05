"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ANNOUNCEMENTS } from "@/constants/home";

/**
 * Rotating promo strip above the header.
 *
 * Rotates one message at a time rather than running a marquee. A marquee makes
 * the whole line unreadable for anyone who needs more than a glance, and the
 * offer code in these messages is the one thing that must be readable. With
 * reduced motion the first message is simply pinned.
 */
export function AnnouncementBar() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % ANNOUNCEMENTS.length),
      4200
    );
    return () => window.clearInterval(id);
  }, [reduce]);

  return (
    <div className="bg-night text-white">
      <div className="container">
        <p
          key={index}
          className="py-2 text-center text-[0.72rem] font-medium tracking-[0.01em] sm:text-[0.78rem]"
          aria-live="off"
        >
          {ANNOUNCEMENTS[reduce ? 0 : index]}
        </p>
      </div>
    </div>
  );
}
