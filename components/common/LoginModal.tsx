"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { waChatHref } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

/**
 * Sign-in modal — mobile number, then a six-digit code.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THIS IS REAL AUTHENTICATION NOW. It was a stand-in for a long time; it no
 * longer is, and the difference matters if you are about to change it.
 *
 * The code is generated on the SERVER, stored only as a hash with a five
 * minute TTL, and verified by POST /api/auth/otp/verify — which issues a
 * signed httpOnly session cookie and links the number to a Shopify customer.
 * The browser never learns the code except in the development case described
 * below.
 *
 * WHAT THAT SESSION UNLOCKS: a Shopify customer record — order history,
 * saved addresses, phone, email. Anyone who can obtain a code can read a
 * stranger's home address. Treat every change here as a change to a security
 * boundary, not to a form.
 *
 * The server enforces what matters, and it must stay that way: rate limits
 * per number and per IP, a five-attempt cap, constant-time comparison. This
 * component validates only to give fast feedback — it is not a control, and
 * nothing here should ever be the only thing standing between a request and
 * a session.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * CHANNEL: WHATSAPP ONLY, DELIBERATELY.
 *
 * SMS is not wired up and is not the next step. Transactional SMS in India
 * needs DLT registration with TRAI — a Principal Entity, a registered header
 * and an approved template, all three before the first message delivers.
 * WhatsApp requires none of it, which is why it goes first.
 *
 * ⚠ THE COST: anyone whose number is not on WhatsApp cannot sign in.
 * Dual-SIM users whose WhatsApp lives on the other number, people who
 * uninstalled it, and landlines — which matters here, because this
 * storefront courts dealers and procurement teams who give a desk number.
 * Reckon on one in ten to one in twenty attempts.
 *
 * WHEN COVERAGE BECOMES THE PROBLEM, REACH FOR EMAIL BEFORE DLT. It needs no
 * telecom registration, and app/account/setup/page.tsx already runs an email
 * code screen with the same six-box input.
 *
 * NO GOOGLE OR EMAIL BUTTON, despite the reference having both. OAuth needs a
 * real provider, a client ID, a redirect URI and a session to put the result
 * in. A social button that opens nothing is worse than no button: it is the
 * control a shopper most expects to work, and a dead one teaches them the
 * site is broken.
 */

/** Indian mobile numbers are ten digits and start 6-9. */
const PHONE_RE = /^[6-9]\d{9}$/;

/* WhatsApp brand green. Deliberately a literal rather than a Tailwind token,
   matching how FloatingDock and BulkOrderBand treat it: the colour belongs to
   WhatsApp, not to Officemate, and putting it in the palette would invite it
   to be reused as if it were ours. `save.DEFAULT` is the green that carries
   meaning in this design system. */
const WHATSAPP_GREEN = "#25D366";

const OTP_LENGTH = 6;

/**
 * Resend cooldown, in seconds.
 *
 * MUST NOT BE SHORTER THAN THE SERVER'S. lib/otp/service.ts enforces a 60
 * second cooldown and returns a 429 before that; a 30 second timer here
 * re-enabled the button while the server was still refusing, so the shopper
 * pressed Resend and got "please wait a moment" from a control that had just
 * told them it was ready.
 *
 * The server is the authority — this only decides when the button lights up,
 * and it should light up no earlier.
 */
const RESEND_SECONDS = 60;

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
  /**
   * WhatsApp opt-in — CONSENT, not a channel switch.
   *
   * Meta requires explicit opt-in before a business messages someone, and a
   * ticked box on your own site is one of the accepted methods. So this is
   * the consent record, and its value must be logged SERVER-SIDE with the
   * number when `request-otp` lands — a value only read on the client proves
   * nothing to anyone auditing it.
   *
   * IT SELECTS NOTHING. WhatsApp is the only channel wired up, so unticking
   * does not fall back to SMS — it blocks the send and says why. An earlier
   * version was labelled as though it chose between two channels, which is
   * the worse failure: a control that looks like a switch and silently does
   * nothing. If SMS is ever added, this becomes a real choice and the guard
   * in `sendCode` comes out.
   */
  const [waOptIn, setWaOptIn] = useState(true);
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  /**
   * The code, when the server chose to reveal it.
   *
   * Populated only from the API's `devCode`, which appears solely while
   * WhatsApp is unconfigured AND either this is localhost or the number is in
   * OTP_DEV_PHONES. It is never computed here — the browser has no idea what
   * the real code is otherwise, which is the entire point.
   */
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  /* Requests are in flight now, so both buttons need a pending state.
     Without it a double-tap fires two sends and burns the resend cooldown. */
  const [busy, setBusy] = useState(false);

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
    setWaOptIn(true);
    setDigits(Array(OTP_LENGTH).fill(""));
    setDevCode(null);
    setError(null);
    setResendIn(0);
    setBusy(false);
  }, []);

  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  /**
   * Reset whenever the modal CLOSES, however it closed.
   *
   * This used to hang off `close()`, which only runs when the person dismisses
   * the modal themselves. A SUCCESSFUL sign-in closes it a different way —
   * AuthProvider sets `open` to false directly after `onVerified` — so that
   * path never reset anything. Sign out, reopen, and you were looking at the
   * previous session's code screen with its old digits still in the boxes.
   *
   * Watching `open` catches every route out: dismissed, verified, or closed
   * by a parent for any reason at all.
   *
   * The delay lets the exit animation finish first. Clearing immediately
   * blanks the panel mid-fade, which reads as the modal breaking rather than
   * closing.
   */
  useEffect(() => {
    if (open) return;
    const t = window.setTimeout(reset, 250);
    return () => window.clearTimeout(t);
  }, [open, reset]);

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

  /**
   * Ask the server for a code.
   *
   * The validation below is CONVENIENCE, not enforcement — it saves a round
   * trip on an obviously bad number. The endpoint re-checks everything,
   * because anything in this file can be bypassed with devtools.
   */
  const sendCode = async () => {
    if (!PHONE_RE.test(phone)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    /* WhatsApp is the only channel, so consent is not optional — without it
       there is nowhere to send the code. Blocking with an explanation is
       honest; quietly sending anyway would breach Meta's opt-in policy. */
    if (!waOptIn) {
      setError(
        "We can only send the code on WhatsApp right now — tick the box to continue."
      );
      return;
    }

    setError(null);
    setBusy(true);

    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, waOptIn }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        /* The server's message is shown verbatim. It is written for a customer
           and is deliberately vague about rate limits — naming which limit was
           hit tells an attacker how to pace around it. */
        setError(data.error ?? "We couldn't send the code. Please try again.");
        return;
      }

      setDevCode(data.devCode ?? null);
      setDigits(Array(OTP_LENGTH).fill(""));
      setResendIn(RESEND_SECONDS);
      setStep("otp");
    } catch {
      setError("Couldn't reach the server. Check your connection.");
    } finally {
      setBusy(false);
    }
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

  /**
   * Submit the code.
   *
   * NO LOCAL COMPARISON. The browser does not hold the code to compare
   * against, and must not — a client-side check would be trivially bypassed
   * and would defeat the server's attempt cap entirely. The server decides.
   */
  const verify = async () => {
    const entered = digits.join("");
    if (entered.length < OTP_LENGTH) {
      setError("Enter all six digits.");
      return;
    }

    setError(null);
    setBusy(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: entered }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error ?? "That code doesn't match. Try again.");
        setDigits(Array(OTP_LENGTH).fill(""));
        otpRefs.current[0]?.focus();
        return;
      }

      /* No success screen. The session cookie is already set; AuthProvider
         takes over, closing this and navigating — to setup on a first sign-in,
         to the dashboard on a return visit.

         There used to be a "You're verified" step. It was a dead end: the
         person had done the work and the reward was a panel telling them so.
         The account area IS the confirmation. */
      onVerified?.(phone);
    } catch {
      setError("Couldn't reach the server. Check your connection.");
    } finally {
      setBusy(false);
    }
  };

  const autoSubmitted = useRef<string | null>(null);

  /**
   * Submit automatically once all six digits are in.
   *
   * The Verify button stays — it is the affordance people look for, and
   * removing it would leave the screen with no visible action — but nobody
   * should have to press it. The code is fixed-length, so the moment the last
   * digit lands there is exactly one thing the person can possibly want.
   *
   * This is also what makes autofill feel finished: the browser drops all six
   * digits in at once and the flow simply continues, instead of stopping to
   * ask for a click nobody expected to make.
   *
   * GUARDED AGAINST RESUBMITTING THE SAME CODE. Without the ref this effect
   * re-fires on the next render and resubmits the identical digits, burning
   * the server's five-attempt cap in seconds. `verify` clears the boxes on a
   * wrong code, which resets the guard naturally; a correct one closes the
   * modal, so it never runs twice.
   */
  useEffect(() => {
    if (step !== "otp" || busy) return;

    const entered = digits.join("");
    if (entered.length !== OTP_LENGTH) {
      autoSubmitted.current = null;
      return;
    }

    if (autoSubmitted.current === entered) return;
    autoSubmitted.current = entered;
    void verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits, step, busy]);

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
                  {/* The subtitle names the channel outright. WhatsApp is the
                      only one wired up, so there is nothing to vary — and
                      saying so here is what makes the checkbox below read as
                      consent rather than as a choice. */}
                  {step === "identify" && "We'll send a one-time code on WhatsApp."}
                  {step === "otp" && `Code sent to ${sentTo} on WhatsApp`}
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

                      {/* WhatsApp opt-in.

                          A real `<input type="checkbox">`, visually hidden and
                          replaced by the styled box beside it, rather than a
                          `<button role="checkbox">`. Wrapped in a <label> the
                          native control gives keyboard toggling with Space,
                          the correct role and state to a screen reader, and a
                          click target that covers the text — all for free.
                          `sr-only` keeps it focusable; `hidden` would not.

                          CONSENT, NOT A CHANNEL PICKER — see the note on
                          `waOptIn`. The label says "Send my code on WhatsApp"
                          rather than "Get OTP via WhatsApp", because the
                          latter reads as one option among several and there
                          is only one. Unticking blocks the send with an
                          explanation rather than silently doing nothing.

                          WhatsApp green on the tick, not the palette's `save`
                          green. This box names a specific third-party channel,
                          and the brand colour is what makes it recognisable at
                          a glance. See the note on WHATSAPP_GREEN above. */}
                      <label className="mt-4 flex cursor-pointer items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={waOptIn}
                          onChange={(e) => {
                            setWaOptIn(e.target.checked);
                            setError(null);
                          }}
                          className="peer sr-only"
                        />
                        <span
                          aria-hidden
                          style={
                            waOptIn
                              ? {
                                  backgroundColor: WHATSAPP_GREEN,
                                  borderColor: WHATSAPP_GREEN,
                                }
                              : undefined
                          }
                          className={cn(
                            "grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition-colors",
                            /* The ring is on this box rather than the input,
                               which is off-screen — without it a keyboard user
                               tabbing here sees no focus at all. */
                            "peer-focus-visible:ring-2 peer-focus-visible:ring-ink peer-focus-visible:ring-offset-2",
                            waOptIn
                              ? "text-white"
                              : "border-line bg-white text-transparent"
                          )}
                        >
                          <Check size={13} strokeWidth={3} />
                        </span>
                        <span className="text-[0.88rem] font-medium text-ink">
                          Send my code on WhatsApp
                        </span>
                      </label>

                      <button
                        onClick={sendCode}
                        disabled={busy}
                        className="mt-4 h-12 w-full rounded-xl bg-night text-[0.9rem] font-semibold text-white transition-colors hover:bg-night-soft active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
                      >
                        {busy ? "Sending…" : "Get code"}
                      </button>

                      <p className="mt-3 text-center text-[0.72rem] leading-relaxed text-muted">
                        By continuing you agree to our{" "}
                        <a
                          href="/resources/terms"
                          className="font-medium text-azure underline hover:text-azure-ink"
                        >
                          Terms
                        </a>{" "}
                        and{" "}
                        <a
                          href="/resources/privacy"
                          className="font-medium text-azure underline hover:text-azure-ink"
                        >
                          Privacy policy
                        </a>
                        .
                      </p>
                    </>
                  )}

                  {step === "otp" && (
                    <>
                      {/* The code panel, shown ONLY when the server sent one
                          back in `devCode` — which happens while WhatsApp is
                          unconfigured, for localhost or an allowlisted number.
                          For everyone else this block is absent and the code
                          arrives on WhatsApp, as it should.

                          Kept visually distinct — dashed border, tinted ground
                          — so nobody on the team mistakes it for finished
                          work. It disappears on its own the day WhatsApp
                          credentials are added; there is nothing to remember
                          to remove. */}
                      {devCode && (
                        <div className="mb-5 rounded-xl border-2 border-dashed border-accent/40 bg-accent-soft p-3 text-center">
                          <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-accent">
                            Code delivery is being set up
                          </p>
                          <p className="mt-1 font-mono text-[1.5rem] font-bold tracking-[0.3em] text-ink">
                            {devCode}
                          </p>
                          <p className="mt-1 text-[0.7rem] text-muted">
                            Use the code above for now.
                          </p>
                        </div>
                      )}

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
                        disabled={busy}
                        className="mt-4 h-12 w-full rounded-xl bg-night text-[0.9rem] font-semibold text-white transition-colors hover:bg-night-soft active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
                      >
                        {busy ? "Checking…" : "Verify"}
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
                          disabled={resendIn > 0 || busy}
                          className="font-semibold text-azure disabled:cursor-not-allowed disabled:text-muted"
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
