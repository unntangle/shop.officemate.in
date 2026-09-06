"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { useAuth } from "@/components/common/AuthProvider";
import { cn } from "@/lib/utils";

/**
 * Profile setup — name, then a code sent to the email address.
 *
 * ⚠ SAME STAND-IN AS THE SIGN-IN MODAL. The email code is generated in the
 * browser and shown on screen; no email is sent, and nothing is verified by a
 * server. Read the header of LoginModal before changing anything here — the
 * replacement work is the same two endpoints, and this screen should call
 * them rather than growing its own.
 *
 * A PAGE, NOT ANOTHER MODAL STEP. Two reasons. The sign-in modal exists to get
 * out of the shopper's way — it opens over a product grid and should close
 * fast. Setup is the opposite: it is the one moment the person is willing to
 * fill in a form, and giving it the whole viewport says so. It also gives the
 * flow a URL, so a refresh mid-setup does not drop them back to the grid.
 *
 * Guarded on `signedIn`, not on `profileComplete`. Someone who has finished
 * setup and navigates here on purpose is sent to the dashboard; someone who
 * has not verified a phone at all has no business here and goes home.
 */

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Step = "profile" | "verify";

export default function AccountSetupPage() {
  const router = useRouter();
  const { profile, signedIn, profileComplete, ready, saveProfile } = useAuth();

  const [step, setStep] = useState<Step>("profile");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resendIn, setResendIn] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* Redirects run in an effect, never during render. Calling router.replace
     while rendering throws in the App Router. */
  useEffect(() => {
    if (!ready) return;
    if (!signedIn) router.replace("/");
    else if (profileComplete) router.replace("/account");
  }, [ready, signedIn, profileComplete, router]);

  /* Prefill from whatever is already stored, so someone who dropped out
     halfway does not retype what they already gave. */
  useEffect(() => {
    if (!profile) return;
    setFirstName((v) => v || profile.firstName || "");
    setLastName((v) => v || profile.lastName || "");
    setEmail((v) => v || profile.email || "");
  }, [profile]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (step === "verify") otpRefs.current[0]?.focus();
  }, [step]);

  const sendCode = () => {
    const next: Record<string, string> = {};
    if (firstName.trim().length < 2) next.firstName = "Enter your first name";
    if (!EMAIL_RE.test(email)) next.email = "Enter a valid email address";
    setErrors(next);
    if (Object.keys(next).length) return;

    saveProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
    });

    /* DEMO ONLY — see the file header. */
    setSentCode(String(Math.floor(100000 + Math.random() * 900000)));
    setDigits(Array(OTP_LENGTH).fill(""));
    setResendIn(RESEND_SECONDS);
    setStep("verify");
  };

  const setDigit = (i: number, value: string) => {
    /* Handles paste as well as typing: six digits dropped into any box fill
       the row rather than truncating into one. */
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      setDigits((d) => d.map((v, idx) => (idx === i ? "" : v)));
      return;
    }
    setDigits((d) => {
      const nextDigits = [...d];
      for (let k = 0; k < clean.length && i + k < OTP_LENGTH; k++) {
        nextDigits[i + k] = clean[k];
      }
      return nextDigits;
    });
    setErrors({});
    otpRefs.current[Math.min(i + clean.length, OTP_LENGTH - 1)]?.focus();
  };

  const verify = () => {
    const entered = digits.join("");
    if (entered !== sentCode) {
      setErrors({ otp: "That code doesn't match. Try again." });
      setDigits(Array(OTP_LENGTH).fill(""));
      otpRefs.current[0]?.focus();
      return;
    }
    saveProfile({ emailVerified: true });
    router.push("/account");
  };

  const field = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts: { type?: string; placeholder?: string; error?: string } = {}
  ) => (
    <div>
      <label htmlFor={id} className="block text-[0.8rem] font-medium text-muted">
        {label}
      </label>
      <input
        id={id}
        type={opts.type ?? "text"}
        value={value}
        placeholder={opts.placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setErrors({});
        }}
        onKeyDown={(e) => e.key === "Enter" && sendCode()}
        aria-invalid={Boolean(opts.error)}
        className={cn(
          "mt-1.5 w-full rounded-2xl border-2 bg-surface px-4 py-3.5 text-[0.95rem] text-ink outline-none transition-colors placeholder:text-muted/60 focus-visible:outline-none",
          opts.error
            ? "border-accent"
            : "border-transparent [&:hover:not(:focus)]:border-line focus:border-ink focus:bg-white"
        )}
      />
      {opts.error && (
        <p role="alert" className="mt-1.5 text-[0.75rem] text-accent">
          {opts.error}
        </p>
      )}
    </div>
  );

  /* A skeleton rather than null while the guard effect decides. A blank white
     page in that gap reads as a crash. */
  if (!ready || !signedIn || profileComplete) {
    return (
      <div className="container py-24">
        <div className="mx-auto h-64 max-w-md animate-pulse rounded-2xl bg-surface" />
      </div>
    );
  }

  return (
    <div className="container py-12 md:py-16">
      <div className="mx-auto max-w-[26rem]">
        <button
          onClick={() => (step === "verify" ? setStep("profile") : router.back())}
          aria-label="Back"
          className="mb-8 flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface"
        >
          <ArrowLeft size={20} />
        </button>

        {step === "profile" ? (
          <>
            <p className="text-[0.9rem] text-muted">Profile setup</p>
            <h1 className="mt-1 text-[1.75rem] font-bold tracking-[-0.02em] text-ink">
              Tell us about you
            </h1>

            <div className="mt-7 space-y-4">
              {field("firstName", "First name", firstName, setFirstName, {
                error: errors.firstName,
              })}
              {/* Not required. A single-name legal identity is common in India,
                  and a required last name locks those people out of the flow
                  entirely for the sake of a tidier greeting. */}
              {field("lastName", "Last name (optional)", lastName, setLastName)}
              {field("email", "Email address", email, setEmail, {
                type: "email",
                placeholder: "you@company.com",
                error: errors.email,
              })}
            </div>

            <button
              onClick={sendCode}
              className="mt-7 w-full rounded-2xl bg-night py-4 text-[0.95rem] font-semibold text-white transition-colors hover:bg-night-deep active:scale-[0.99]"
            >
              Continue
            </button>

            <p className="mt-4 text-center text-[0.75rem] text-muted">
              Signed in as +91 {profile?.phone}
            </p>
          </>
        ) : (
          <>
            <p className="text-[0.9rem] text-muted">
              We&apos;ve sent a verification code to
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-[0.95rem] font-semibold text-ink">
              {email}
              <button
                onClick={() => setStep("profile")}
                className="text-[0.85rem] font-medium text-muted underline underline-offset-4 transition-colors hover:text-ink"
              >
                Edit
              </button>
            </p>

            {/* The code, on screen because nothing is sent yet. Kept visually
                distinct so nobody on the team mistakes it for finished work. */}
            <div className="mt-5 rounded-2xl border-2 border-dashed border-accent/40 bg-accent-soft p-3 text-center">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-accent">
                Email delivery is being set up
              </p>
              <p className="mt-1 font-mono text-[1.5rem] font-bold tracking-[0.3em] text-ink">
                {sentCode}
              </p>
            </div>

            <div className="mt-5 flex gap-2.5">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  value={d}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => {
                    /* Backspace on an empty box steps back, or clearing a
                       wrong code means clicking every box in turn. */
                    if (e.key === "Backspace" && !digits[i] && i > 0)
                      otpRefs.current[i - 1]?.focus();
                    if (e.key === "ArrowLeft" && i > 0)
                      otpRefs.current[i - 1]?.focus();
                    if (e.key === "ArrowRight" && i < OTP_LENGTH - 1)
                      otpRefs.current[i + 1]?.focus();
                  }}
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  maxLength={OTP_LENGTH}
                  aria-label={`Digit ${i + 1}`}
                  className="h-14 w-full rounded-2xl border-2 border-line text-center text-[1.15rem] font-semibold text-ink outline-none transition-colors [&:hover:not(:focus)]:border-ink/40 focus:border-ink focus-visible:outline-none"
                />
              ))}
            </div>

            {errors.otp && (
              <p role="alert" className="mt-2 text-[0.78rem] text-accent">
                {errors.otp}
              </p>
            )}

            <div className="mt-4 flex items-center justify-between text-[0.82rem]">
              <span className="flex items-center gap-1.5 text-muted">
                <Clock size={14} />
                {resendIn > 0
                  ? `00:${String(resendIn).padStart(2, "0")}`
                  : "Didn't get it?"}
              </span>
              <button
                onClick={sendCode}
                disabled={resendIn > 0}
                className="font-semibold text-ink underline underline-offset-4 transition-colors hover:text-muted disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
              >
                Resend code
              </button>
            </div>

            {/* Disabled until all six are in. A Verify button that can only
                fail is a button that teaches people to distrust buttons. */}
            <button
              onClick={verify}
              disabled={digits.some((d) => !d)}
              className="mt-6 w-full rounded-2xl bg-night py-4 text-[0.95rem] font-semibold text-white transition-colors hover:bg-night-deep active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
            >
              Verify
            </button>
          </>
        )}
      </div>
    </div>
  );
}
