"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { waChatHref } from "@/lib/whatsapp";
import { EASE } from "@/lib/motion";

/**
 * Sign-in modal — mobile number or email, then a six-digit code.
 *
 * ⚠⚠ SHIPPING AS A STAND-IN. READ THIS BEFORE CHANGING ANYTHING. ⚠⚠
 *
 * This runs in production, deliberately, until a real OTP service is wired
 * up. It is NOT authentication, and the copy on screen says so rather than
 * pretending otherwise.
 *
 * The code is generated in the browser and shown to the person. That proves
 * nothing — the whole security model of a one-time password is that it
 * travels over a second channel the attacker does not control, and here there
 * is no second channel. Verifying also creates no session, because nothing is
 * signed and nothing is stored.
 *
 * WHY THAT IS TOLERABLE FOR NOW, and the exact moment it stops being:
 *
 *   Right now this flow guards nothing. There are no accounts, no order
 *   history, no saved addresses — so a bypass gets an attacker exactly what a
 *   stranger already has. The number or email lives in React state and never
 *   leaves the browser, so there is no personal data at rest either.
 *
 *   THE MOMENT ANYTHING SITS BEHIND THIS — order history, a saved address, a
 *   B2B price list, anything — it becomes an open door and must be replaced
 *   FIRST, not alongside. Do not let a feature ship that assumes this modal
 *   means the person is who they say they are.
 *
 * WHAT REPLACING IT INVOLVES, so it is not underestimated:
 *
 *   1. `POST /api/auth/request-otp` — server generates the code, stores a
 *      hash of it with a short TTL, sends the SMS or email. It must return
 *      NOTHING about the code.
 *   2. `POST /api/auth/verify-otp` — server compares, and on success issues an
 *      httpOnly, Secure, SameSite session cookie.
 *   3. Rate limiting on both, per identifier AND per IP. Without it this is a
 *      free SMS pump that bills the client for every request an attacker makes.
 *   4. An attempt cap — five tries, then the code is burned. Six digits is a
 *      million combinations, which is minutes of brute force without one.
 *   5. In India, an SMS sender ID and template registered on the DLT registry
 *      before any transactional SMS can be delivered at all.
 *
 * NO GOOGLE OR EMAIL BUTTON, despite the reference having both. OAuth needs a
 * real provider, a client ID, a redirect URI and a session to put the result
 * in — none of which exist. A social button that opens nothing is worse than
 * no button: it is the control a shopper most expects to work, and a dead one
 * teaches them the site is broken. Add them with the auth backend.
 *
 * Email was built and then removed on request. Mobile is the right single
 * channel for an Indian storefront anyway — it is the identifier customers
 * already give for delivery, and it is the one an SMS OTP needs.
 */

/**
 * Whether to generate and show the code in the browser.
 *
 * TRUE  — the stand-in. Code shown on screen, no SMS or email, no session.
 * FALSE — the flow stops at the identifier and points the person at WhatsApp
 *         instead. Use this the moment the real endpoints exist but are not
 *         yet wired, so the flow is never half-real.
 *
 * A constant rather than an env var, on purpose. An env var makes it possible
 * for staging and production to disagree about whether authentication is
 * real, which is the worst of both worlds.
 */
const DEMO_OTP = true;

/** Indian mobile numbers are ten digits and start 6-9. */
const PHONE_RE = /^[6-9]\d{9}$/;

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

type Step = "identify" | "otp" | "unavailable";

export function LoginModal({
  open,
  onClose,
  onVerified,
}: {
  open: boolean;
  onClose: () => void;
  /** Fires once the code matches. The provider records the number. */
  onVerified?: (phone: string) => void;
}) {
  const [step, setStep] = useState<Step>("identify");
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  /** What the code went to, for the "sent to X" line and the success screen. */
  const sentTo = `+91 ${phone}`;

  /* Reset on close rather than on open. Resetting on open leaves the previous
     entry visible for a frame during the exit animation, which looks like the
     modal forgot what it was doing. */
  const reset = useCallback(() => {
    setStep("identify");
    setPhone("");
    setDigits(Array(OTP_LENGTH).fill(""));
    setSentCode(null);
    setError(null);
    setResendIn(0);
  }, []);

  const close = useCallback(() => {
    onClose();
    window.setTimeout(reset, 250);
  }, [onClose, reset]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  /* Focus the field the step expects. The 60ms wait lets the enter animation
     start first — focusing a mid-transform element makes some browsers scroll
     the page to chase it. */
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      if (step === "identify") inputRef.current?.focus();
      if (step === "otp") otpRefs.current[0]?.focus();
    }, 60);
    return () => window.clearTimeout(t);
  }, [open, step]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  const sendCode = () => {
    if (!PHONE_RE.test(phone)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setError(null);

    /* With DEMO_OTP off there is nothing to send to, so the flow stops here
       rather than advancing to a code screen that could never succeed. Half a
       working flow is worse than none. Replace this branch with the real
       request-otp call. */
    if (!DEMO_OTP) {
      setStep("unavailable");
      return;
    }

    setSentCode(String(Math.floor(100000 + Math.random() * 900000)));
    setDigits(Array(OTP_LENGTH).fill(""));
    setResendIn(RESEND_SECONDS);
    setStep("otp");
  };

  const setDigit = (i: number, value: string) => {
    /* Handles paste as well as typing: dropping six digits into any box fills
       the row rather than putting all six in one and silently truncating. */
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      setDigits((d) => d.map((v, idx) => (idx === i ? "" : v)));
      return;
    }
    setDigits((d) => {
      const next = [...d];
      for (let k = 0; k < clean.length && i + k < OTP_LENGTH; k++) {
        next[i + k] = clean[k];
      }
      return next;
    });
    setError(null);
    otpRefs.current[Math.min(i + clean.length, OTP_LENGTH - 1)]?.focus();
  };

  const onOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    /* Backspace on an empty box steps back. Without it, clearing a wrong code
       means clicking every box in turn. */
    if (e.key === "Backspace" && !digits[i] && i > 0) otpRefs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) otpRefs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < OTP_LENGTH - 1) otpRefs.current[i + 1]?.focus();
  };

  const verify = () => {
    const entered = digits.join("");
    if (entered.length < OTP_LENGTH) {
      setError("Enter all six digits.");
      return;
    }
    if (entered !== sentCode) {
      setError("That code doesn't match. Try again.");
      setDigits(Array(OTP_LENGTH).fill(""));
      otpRefs.current[0]?.focus();
      return;
    }

    /* No success screen. The modal hands off and AuthProvider takes over — it
       closes this and navigates, to setup on a first sign-in or to the
       dashboard on a return visit.

       There used to be a "You're verified" step here. It was a dead end: the
       person had done the work, and the reward was a panel telling them so and
       a Done button that put them back where they started. The account area IS
       the confirmation. */
    setError(null);
    onVerified?.(phone);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 z-[70] bg-scrim/60 backdrop-blur-sm"
            aria-hidden
          />

          {/* CENTRING IS DONE BY FLEX, NOT BY `-translate-x-1/2`.

              Framer writes its animated values into the element's INLINE
              transform, and inline beats a class — so a Tailwind centring
              translate on a motion component is wiped the moment the enter
              animation resolves, leaving the panel's top-left corner at the
              middle of the viewport. A flex parent has nothing to do with
              transform, so the two cannot fight. The same trap applies to any
              `translate-*`, `scale-*` or `rotate-*` on a motion component. */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: EASE }}
            onClick={close}
            className="fixed inset-0 z-[71] flex items-center justify-center overflow-y-auto p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="login-title"
              className="relative grid w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-lift md:grid-cols-2"
            >
              {/* ---------------------------------------------- image panel

                  Hidden below `md`. On a phone it would eat half the screen
                  above the fold and push the actual field under the keyboard,
                  which is the one thing a sign-in modal cannot afford.

                  `aria-hidden` and empty alt — it is atmosphere. The dialog is
                  already named by its heading.

                  The logo sits on the image rather than above the form, so the
                  form column stays a single uninterrupted run from heading to
                  legal line. */}
              <div className="relative hidden min-h-[30rem] md:block">
                <Image
                  src="/images/hero.webp"
                  alt=""
                  aria-hidden
                  fill
                  sizes="(min-width: 768px) 24rem, 0px"
                  className="object-cover"
                />
                {/* Scrim: the logo is brand red on an uncontrolled photograph,
                    and red on a mid-tone image is the worst case for
                    legibility. Darkening the top third fixes it without
                    flattening the whole picture. */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-b from-scrim/70 via-scrim/10 to-transparent"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/logo.svg"
                  alt=""
                  width={739}
                  height={61}
                  className="absolute left-7 top-7 h-4 w-auto brightness-0 invert"
                />
              </div>

              {/* ----------------------------------------------- form panel */}
              <div className="relative p-7 sm:p-8">
                <button
                  onClick={close}
                  aria-label="Close"
                  className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink"
                >
                  <X size={19} />
                </button>

                <h2
                  id="login-title"
                  className="pr-10 text-[1.35rem] font-semibold leading-tight text-ink"
                >
                  Login / Sign up
                </h2>
                <p className="mt-1 text-[0.85rem] text-muted">
                  {step === "identify" &&
                    "We'll send a one-time code to your mobile."}
                  {step === "otp" && `Code sent to ${sentTo}`}
                  {step === "unavailable" && "Sign-in isn't switched on yet."}
                </p>

                <div className="mt-6">
                  {step === "identify" && (
                    <>
                      <label
                        htmlFor="login-id"
                        className="block text-[0.82rem] font-semibold text-ink"
                      >
                        Mobile number
                      </label>

                      {/* Border darkens on hover and again on focus, rather
                          than turning accent red.

                          Red is this site's action colour and, on a form
                          field, also its ERROR colour — the validation message
                          two lines below is `text-accent`. A field that turns
                          red the moment you touch it reads as "something is
                          wrong" before anything has been typed. Ink says
                          "active" without claiming anything about validity.

                          Three steps: `line` at rest, `ink/40` on hover so the
                          field acknowledges the pointer, `ink` on focus. The
                          hover step is what was missing — the field went from
                          inert straight to focused with nothing in between.

                          The +91 prefix is a static span, not a select. One
                          country is supported, and a select implies more. It
                          now sits on white with only a divider, so the group
                          reads as one field rather than a grey chip glued to
                          an input.

                          The red sliver that used to appear at the left of
                          the input on focus was the global focus outline
                          (`input:focus-visible { outline: 2px solid #EC1C24 }`
                          in globals.css) being CLIPPED by this wrapper's
                          `overflow-hidden`. Only the inner edge survived, so
                          it read as a stray red bar rather than a ring.

                          The input therefore suppresses its own outline and
                          the GROUP carries the focus indicator instead — the
                          ink border plus a soft ring. That is not dropping an
                          accessibility affordance, it is moving it to the
                          element that actually looks focused. `focus-visible:`
                          rather than `focus:` is required: the global rule is
                          `input:focus-visible`, specificity 0,1,1, which a
                          plain `focus:outline-none` at 0,1,0 loses to.

                          The ring is a box-shadow, so it is drawn outside this
                          box and `overflow-hidden` does not clip it.

                          THE HOVER RULE IS SCOPED WITH `:not(:focus-within)`,
                          AND IT HAS TO BE. Tailwind emits `focus-within`
                          BEFORE `hover` in its variant order, so with a plain
                          `hover:border-ink/40` the hover rule wins whenever
                          both apply — the field went GREY while focused and
                          under the pointer, then snapped to black the moment
                          the cursor moved away. Same specificity, later in the
                          stylesheet, so nothing about the class list hinted at
                          it.

                          Excluding the focused state from the hover rule fixes
                          it without `!important` and without depending on that
                          ordering ever staying the same.

                          `border-2` at every state, not just on focus. A
                          border that thickens on focus reflows its own
                          contents by a pixel, so the placeholder and the +91
                          divider visibly twitch when the field is clicked.
                          Carrying the weight at rest costs nothing and keeps
                          the box geometry fixed — only the colour changes.

                          No focus ring. A soft ring around a 2px border reads
                          as a glow rather than an edge, and at this weight the
                          border alone is already the strongest thing on the
                          panel. */}
                      <div className="mt-2 flex items-stretch overflow-hidden rounded-xl border-2 border-line transition-colors [&:hover:not(:focus-within)]:border-ink/40 focus-within:border-ink">
                        <span className="grid shrink-0 place-items-center border-r border-line px-4 text-[0.88rem] font-semibold text-ink">
                          +91
                        </span>
                        <input
                          id="login-id"
                          ref={inputRef}
                          value={phone}
                          onChange={(e) =>
                            setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                          }
                          onKeyDown={(e) => e.key === "Enter" && sendCode()}
                          inputMode="numeric"
                          autoComplete="tel-national"
                          /* Zeros, not a plausible-looking number. "98765
                             43210" is a valid Indian mobile prefix, and at
                             placeholder grey a shopper glancing at the field
                             can read it as already filled in — then tap
                             Continue and get an error they do not understand.
                             A run of zeros can only be a format hint. */
                          placeholder="00000 00000"
                          className="h-12 w-full px-3.5 text-[0.95rem] text-ink outline-none placeholder:text-muted/60 focus-visible:outline-none"
                        />
                      </div>

                      {error && (
                        <p role="alert" className="mt-2 text-[0.78rem] text-accent">
                          {error}
                        </p>
                      )}

                      <button
                        onClick={sendCode}
                        className="mt-4 h-12 w-full rounded-xl bg-night text-[0.9rem] font-semibold text-white transition-colors hover:bg-night-soft active:scale-[0.99]"
                      >
                        Get code
                      </button>

                      <p className="mt-3 text-center text-[0.72rem] leading-relaxed text-muted">
                        By continuing you agree to our{" "}
                        <a href="/resources/terms" className="underline hover:text-ink">
                          Terms
                        </a>{" "}
                        and{" "}
                        <a href="/resources/privacy" className="underline hover:text-ink">
                          Privacy policy
                        </a>
                        .
                      </p>
                    </>
                  )}

                  {step === "otp" && (
                    <>
                      {/* The code, shown on screen because there is no SMS or
                          email yet. Worded for a customer rather than a
                          developer, but kept visually distinct — dashed border,
                          tinted ground — so nobody on the team mistakes it for
                          finished work. */}
                      <div className="mb-5 rounded-xl border-2 border-dashed border-accent/40 bg-accent-soft p-3 text-center">
                        <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-accent">
                          Code delivery is being set up
                        </p>
                        <p className="mt-1 font-mono text-[1.5rem] font-bold tracking-[0.3em] text-ink">
                          {sentCode}
                        </p>
                        <p className="mt-1 text-[0.7rem] text-muted">
                          Use the code above for now.
                        </p>
                      </div>

                      <label className="block text-[0.82rem] font-semibold text-ink">
                        Enter the 6-digit code
                      </label>

                      {/* Same focus treatment as the phone field — border and
                          ring on the box, global accent outline suppressed —
                          so both steps of the flow look alike. These boxes are
                          not inside an `overflow-hidden` parent, so nothing
                          was clipped here; the outline was simply red where
                          every other field shows ink.

                          Hover is scoped with `:not(:focus)` for the same
                          reason as the phone field. Tailwind happens to emit
                          `focus` after `hover`, so this one would have worked
                          either way — but relying on that leaves two fields on
                          the same form depending on opposite orderings, which
                          is exactly how the phone bug got missed. */}
                      <div className="mt-2 flex gap-2">
                        {digits.map((d, i) => (
                          <input
                            key={i}
                            ref={(el) => {
                              otpRefs.current[i] = el;
                            }}
                            value={d}
                            onChange={(e) => setDigit(i, e.target.value)}
                            onKeyDown={(e) => onOtpKeyDown(i, e)}
                            inputMode="numeric"
                            autoComplete={i === 0 ? "one-time-code" : "off"}
                            maxLength={OTP_LENGTH}
                            aria-label={`Digit ${i + 1}`}
                            className="h-12 w-full rounded-xl border-2 border-line text-center text-[1.1rem] font-semibold text-ink outline-none transition-colors [&:hover:not(:focus)]:border-ink/40 focus:border-ink focus-visible:outline-none"
                          />
                        ))}
                      </div>

                      {error && (
                        <p role="alert" className="mt-2 text-[0.78rem] text-accent">
                          {error}
                        </p>
                      )}

                      <button
                        onClick={verify}
                        className="mt-4 h-12 w-full rounded-xl bg-night text-[0.9rem] font-semibold text-white transition-colors hover:bg-night-soft active:scale-[0.99]"
                      >
                        Verify
                      </button>

                      <div className="mt-3 flex items-center justify-between text-[0.78rem]">
                        <button
                          onClick={() => setStep("identify")}
                          className="text-muted underline-offset-4 hover:text-ink hover:underline"
                        >
                          Change number
                        </button>
                        <button
                          onClick={sendCode}
                          disabled={resendIn > 0}
                          className="font-semibold text-accent disabled:cursor-not-allowed disabled:text-muted"
                        >
                          {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                        </button>
                      </div>
                    </>
                  )}

                  {step === "unavailable" && (
                    <div className="py-2 text-center">
                      <p className="text-[0.9rem] leading-relaxed text-ink">
                        We can&apos;t send a code just yet.
                      </p>
                      <p className="mt-2 text-[0.82rem] leading-relaxed text-muted">
                        Message us on WhatsApp and we&apos;ll pick up from your
                        details — same team, same answers, no code needed.
                      </p>
                      <a
                        href={waChatHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ backgroundColor: "#25D366" }}
                        className="mt-5 flex h-12 w-full items-center justify-center rounded-xl text-[0.9rem] font-semibold text-white transition-transform active:scale-[0.99]"
                      >
                        Chat on WhatsApp
                      </a>
                      <button
                        onClick={() => setStep("identify")}
                        className="mt-3 text-[0.78rem] text-muted underline-offset-4 hover:text-ink hover:underline"
                      >
                        Back
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
