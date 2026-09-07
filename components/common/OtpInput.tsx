"use client";

import { useEffect, useRef } from "react";

/**
 * The six-box one-time-code input.
 *
 * Extracted because two screens need it — profile setup and the email change
 * on /account/profile — and the fiddly parts are exactly the parts that get
 * dropped when markup is copied: paste spreading across boxes, backspace
 * stepping back out of an empty one, arrow keys, and `one-time-code` autofill
 * on the first box only.
 *
 * VALUE IS AN ARRAY, NOT A STRING, and deliberately. A string cannot express
 * "box 1 and box 3 are filled, box 2 is empty" — join the digits and a
 * cleared middle box silently shifts everything left, so the code the person
 * sees on screen stops matching the one being compared. Callers `.join("")`
 * when they need to compare.
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  autoFocus = false,
  invalid = false,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  length?: number;
  autoFocus?: boolean;
  invalid?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const setAt = (i: number, raw: string) => {
    /* Strip non-digits rather than rejecting the input outright. Pasting a
       code copied with a stray space still works. */
    const clean = raw.replace(/\D/g, "");

    if (!clean) {
      onChange(value.map((v, idx) => (idx === i ? "" : v)));
      return;
    }

    /* Handles paste as well as typing: six digits dropped into any box fill
       the row from there rather than truncating into one. */
    const next = [...value];
    for (let k = 0; k < clean.length && i + k < length; k++) {
      next[i + k] = clean[k];
    }
    onChange(next);
    refs.current[Math.min(i + clean.length, length - 1)]?.focus();
  };

  return (
    <div className="flex gap-2.5">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={value[i] ?? ""}
          onChange={(e) => setAt(i, e.target.value)}
          onKeyDown={(e) => {
            /* Backspace on an empty box steps back, or clearing a wrong code
               means clicking every box in turn. */
            if (e.key === "Backspace" && !value[i] && i > 0)
              refs.current[i - 1]?.focus();
            if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "ArrowRight" && i < length - 1)
              refs.current[i + 1]?.focus();
          }}
          inputMode="numeric"
          /* First box only. Repeating it makes some browsers offer to fill
             every box with the whole code. */
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={length}
          aria-label={`Digit ${i + 1}`}
          aria-invalid={invalid || undefined}
          className={`h-14 w-full rounded-2xl border-2 text-center text-[1.15rem] font-semibold text-ink outline-none transition-colors focus-visible:outline-none ${
            invalid
              ? "border-accent"
              : "border-line [&:hover:not(:focus)]:border-ink/40 focus:border-ink"
          }`}
        />
      ))}
    </div>
  );
}
