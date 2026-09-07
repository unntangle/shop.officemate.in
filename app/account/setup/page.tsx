"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { useAuth } from "@/components/common/AuthProvider";
import { OtpInput } from "@/components/common/OtpInput";
import { cn } from "@/lib/utils";

/**
 * Profile setup — name, then a code sent to the email.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * NOTHING IS SAVED UNTIL THE EMAIL IS VERIFIED.
 *
 * The name and email live in this component's state until the code checks
 * out. The server persists them only inside /api/auth/email/verify, so an
 * abandoned or failed verification leaves no trace.
 *
 * That ordering matters more here than on most forms: the SHOPIFY CUSTOMER is
 * created from this email, and on a passwordless store we cannot correct a
 * customer record afterwards. An unverified typo would become permanent — a
 * real customer in the admin, at an address nobody reads.
 *
 * The code is generated and checked on the SERVER, hashed, with a five-minute
 * expiry, a five-attempt cap and rate limits. It is not the browser-side
 * stand-in this screen used to have; that one proved nothing and was removed.
 * ─────────────────────────────────────────────────────────────────────────
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

type Step = "details" | "verify";

export default function AccountSetupPage() {
  const router = useRouter();
  const { auth, signedIn, profileComplete, ready, signOut } = useAuth();

  const [step, setStep] = useState<Step>("details");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [devCode, setDevCode] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (!ready) return;
    if (!signedIn) router.replace("/");
    else if (profileComplete) router.replace("/account");
  }, [ready, signedIn, profileComplete, router]);

  useEffect(() => {
    if (!auth) return;
    setFirstName((v) => v || auth.firstName || "");
    setLastName((v) => v || auth.lastName || "");
    setEmail((v) => v || auth.email || "");
  }, [auth]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  const sendCode = async () => {
    if (firstName.trim().length < 2) {
      setErrors({ firstName: "Enter your first name" });
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setErrors({ email: "Enter a valid email address" });
      return;
    }

    setErrors({});
    setBusy(true);
    try {
      const res = await fetch("/api/auth/email/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        /* The "already linked" message belongs on the email field, where the
           person can act on it. Anything else is a transport problem and
           belongs at form level. */
        setErrors(
          res.status === 409
            ? { email: data.error }
            : { form: data.error ?? "We couldn't send the code." }
        );
        return;
      }

      setDevCode(data.devCode ?? null);
      setDigits(Array(OTP_LENGTH).fill(""));
      setResendIn(RESEND_SECONDS);
      setStep("verify");
    } catch {
      setErrors({ form: "Couldn't reach the server. Check your connection." });
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    const entered = digits.join("");
    if (entered.length < OTP_LENGTH) return;

    setErrors({});
    setBusy(true);
    try {
      const res = await fetch("/api/auth/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          code: entered,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setErrors({ otp: data.error ?? "That code doesn't match." });
        setDigits(Array(OTP_LENGTH).fill(""));
        return;
      }

      /* Full navigation, not router.push. The profile was written on the
         server, and this forces the provider to re-read it rather than
         landing on /account with a stale "setup incomplete" state that would
         bounce straight back here. */
      window.location.href = "/account";
    } catch {
      setErrors({ form: "Couldn't reach the server. Check your connection." });
    } finally {
      setBusy(false);
    }
  };

  /* Submits on the sixth digit — same reasoning as the sign-in modal. The ref
     stops the effect resubmitting identical digits and burning the attempt
     cap. */
  const autoSubmitted = useRef<string | null>(null);
  useEffect(() => {
    if (step !== "verify" || busy) return;
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

  if (!ready || !signedIn || profileComplete) {
    return (
      <div className="container py-24">
        <div className="mx-auto h-80 max-w-md animate-pulse rounded-2xl bg-surface" />
      </div>
    );
  }

  const field = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts: { error?: string; type?: string; placeholder?: string } = {}
  ) => (
    <div>
      <label htmlFor={id} className="block text-[0.82rem] font-semibold text-ink">
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
          "mt-2 h-12 w-full rounded-xl border-2 px-3.5 text-[0.95rem] text-ink outline-none transition-colors placeholder:text-muted/60 focus-visible:outline-none",
          opts.error
            ? "border-accent"
            : "border-line [&:hover:not(:focus)]:border-ink/40 focus:border-ink"
        )}
      />
      {opts.error && (
        <p role="alert" className="mt-1.5 text-[0.78rem] text-accent">
          {opts.error}
        </p>
      )}
    </div>
  );

  return (
    <div className="container py-16 md:py-24">
      <div className="mx-auto max-w-md">
        {step === "details" ? (
          <>
            <p className="text-[0.82rem] font-medium text-muted">
              Profile setup
            </p>
            <h1 className="mt-1 text-[1.6rem] font-bold tracking-[-0.02em] text-ink">
              Tell us about you
            </h1>
            <p className="mt-2 text-[0.88rem] leading-relaxed text-muted">
              This is the name and email that appear on your orders and
              invoices. We&apos;ll send a code to confirm the address.
            </p>

            <div className="mt-7 space-y-5">
              {field("firstName", "First name", firstName, setFirstName, {
                error: errors.firstName,
              })}
              {/* Optional. A single-name legal identity is common in India,
                  and requiring a surname locks those people out of their own
                  account for the sake of a tidier greeting. */}
              {field("lastName", "Last name (optional)", lastName, setLastName)}
              {field("email", "Email address", email, setEmail, {
                error: errors.email,
                type: "email",
                placeholder: "you@company.com",
              })}

              {errors.form && (
                <p role="alert" className="text-[0.78rem] text-accent">
                  {errors.form}
                </p>
              )}

              <button
                onClick={sendCode}
                disabled={busy}
                className="h-12 w-full rounded-xl bg-night text-[0.9rem] font-semibold text-white transition-colors hover:bg-night-deep active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
              >
                {busy ? "Sending…" : "Send code"}
              </button>

              <p className="text-center text-[0.78rem] text-muted">
                Signed in as +91 {auth?.phone}
                {" · "}
                {/* The only exit from this screen — the account sidebar only
                    renders on pages that require a COMPLETE profile. */}
                <button
                  onClick={signOut}
                  className="font-medium text-azure underline underline-offset-4 hover:text-azure-ink"
                >
                  Not you? Sign out
                </button>
              </p>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                setStep("details");
                setErrors({});
              }}
              aria-label="Back"
              className="mb-6 flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface"
            >
              <ArrowLeft size={20} />
            </button>

            <h1 className="text-[1.6rem] font-bold tracking-[-0.02em] text-ink">
              Confirm your email
            </h1>
            <p className="mt-2 text-[0.88rem] leading-relaxed text-muted">
              We&apos;ve sent a six-digit code to{" "}
              <span className="font-semibold text-ink">{email}</span>.
            </p>

            {devCode && (
              <div className="mt-5 rounded-xl border-2 border-dashed border-accent/40 bg-accent-soft p-3 text-center">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-accent">
                  Email delivery is being set up
                </p>
                <p className="mt-1 font-mono text-[1.5rem] font-bold tracking-[0.3em] text-ink">
                  {devCode}
                </p>
              </div>
            )}

            <div className="mt-6">
              <OtpInput
                value={digits}
                onChange={(next) => {
                  setDigits(next);
                  setErrors({});
                }}
                length={OTP_LENGTH}
                autoFocus
                invalid={Boolean(errors.otp)}
              />

              {(errors.otp || errors.form) && (
                <p role="alert" className="mt-2 text-[0.78rem] text-accent">
                  {errors.otp ?? errors.form}
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
                  disabled={resendIn > 0 || busy}
                  className="font-semibold text-azure disabled:cursor-not-allowed disabled:text-muted"
                >
                  Resend code
                </button>
              </div>

              <button
                onClick={verify}
                disabled={busy || digits.some((d) => !d)}
                className="mt-6 h-12 w-full rounded-xl bg-night text-[0.9rem] font-semibold text-white transition-colors hover:bg-night-deep active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
              >
                {busy ? "Checking…" : "Verify and finish"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
