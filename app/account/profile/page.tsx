"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/common/AuthProvider";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { cn } from "@/lib/utils";

/**
 * My profile — the name and email on file.
 *
 * Saves through to the Shopify customer record via the Customer Account API,
 * so what shows here is what the admin sees and what appears on invoices.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ONLY THE NAME IS EDITABLE. Email and phone are shown read-only, and that is
 * a property of the platform rather than a decision we get to make.
 *
 * On new customer accounts the EMAIL IS THE IDENTITY — it is the address the
 * sign-in code was sent to, and the thing Shopify authenticated. Changing it
 * is an identity change, which Shopify handles on its own account pages with
 * its own re-verification. An email field here would either be rejected by
 * the API or, worse, succeed and orphan the session the customer is currently
 * using.
 *
 * That is also why there is no email verification step in this codebase any
 * more. There is nothing left to verify: Shopify verified the address before
 * the customer ever reached this page.
 * ─────────────────────────────────────────────────────────────────────────
 */

export default function AccountProfilePage() {
  const router = useRouter();
  const { auth, signedIn, profileComplete, ready, saveProfile, deleteAccount } =
    useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  /* Two-step rather than a `window.confirm`. A native dialog is easy to
     dismiss by reflex and cannot state what deletion does and does not
     remove — which here is the part that matters. */
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  /**
   * Typed confirmation.
   *
   * A second button is easy to hit twice by momentum; typing a word is not.
   * It forces the person to read what they are agreeing to and makes an
   * accidental deletion effectively impossible — which matters because there
   * is no undo and no soft-delete behind this.
   *
   * UPPERCASE "CLOSE" rather than a sentence. Short enough that nobody
   * mistypes it into frustration, distinct enough that it cannot be produced
   * by leaning on a key, and the capitals signal the weight of the action
   * before the word is even read.
   *
   * Compared case-insensitively and trimmed: the point is deliberate intent,
   * not exact keystrokes, and failing someone over a trailing space or a
   * lowercase letter is petty rather than careful.
   */
  const [confirmText, setConfirmText] = useState("");

  /* Redirects run in an effect, never during render. Calling router.replace
     while rendering throws in the App Router. */
  useEffect(() => {
    if (!ready) return;
    if (!signedIn) router.replace("/");
    else if (!profileComplete) router.replace("/account/setup");
  }, [ready, signedIn, profileComplete, router]);

  /* Seeded once — the `v ||` guard means a background refresh cannot
     overwrite what someone is halfway through typing. */
  useEffect(() => {
    if (!auth) return;
    setFirstName((v) => v || auth.firstName || "");
    setLastName((v) => v || auth.lastName || "");
  }, [auth]);

  /* The "Saved" tick clears itself. A confirmation that stays forever stops
     being a confirmation — after a minute it just reads as a label. */
  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(false), 2200);
    return () => window.clearTimeout(t);
  }, [saved]);

  if (!ready || !signedIn || !profileComplete) {
    return (
      <div className="container py-16">
        <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <div className="h-96 animate-pulse rounded-2xl bg-surface" />
          <div className="h-96 animate-pulse rounded-2xl bg-surface" />
        </div>
      </div>
    );
  }

  const submit = async () => {
    if (firstName.trim().length < 2) {
      setErrors({ firstName: "Enter your first name" });
      return;
    }
    setErrors({});
    setBusy(true);
    const result = await saveProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
    setBusy(false);

    if (!result.ok) {
      setErrors({ form: result.error ?? "Couldn't save your details." });
      return;
    }
    setSaved(true);
  };

  /** Trimmed and case-insensitive — see the note on `confirmText`. */
  const canDelete = confirmText.trim().toLowerCase() === "close";

  const runDelete = async () => {
    if (!canDelete || deleting) return;

    setDeleting(true);
    const result = await deleteAccount();
    setDeleting(false);

    if (!result.ok) {
      setErrors({ delete: result.error ?? "Couldn't close your account." });
      /* The panel stays OPEN on failure, with the typed phrase intact.
         Collapsing it would make the person start the whole confirmation
         over to retry something that failed for reasons of ours. */
      return;
    }
    /* On success the provider navigates away, so there is nothing to reset —
       this component is about to unmount. */
  };

  const field = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    error?: string
  ) => (
    <div>
      <label htmlFor={id} className="block text-[0.78rem] font-medium text-muted">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setErrors({});
        }}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        aria-invalid={Boolean(error)}
        className={cn(
          "mt-1.5 h-12 w-full rounded-xl border-2 bg-surface px-3.5 text-[0.9rem] text-ink outline-none transition-colors focus-visible:outline-none",
          error
            ? "border-accent"
            : "border-transparent [&:hover:not(:focus)]:border-line focus:border-ink focus:bg-white"
        )}
      />
      {error && (
        <p role="alert" className="mt-1 text-[0.72rem] text-accent">
          {error}
        </p>
      )}
    </div>
  );

  /** Shown read-only, with the reason. See the file header. */
  const locked = (label: string, value: string, note: string) => (
    <div className="sm:col-span-2">
      <label className="block text-[0.78rem] font-medium text-muted">
        {label}
      </label>
      <div className="mt-1.5 flex h-12 items-center gap-2 rounded-xl border-2 border-transparent bg-surface px-3.5 text-[0.9rem] text-muted">
        {value || "—"}
        {value && (
          <span className="ml-auto flex items-center gap-1.5 text-[0.72rem] font-medium text-save">
            <ShieldCheck size={14} />
            Verified
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[0.72rem] text-muted">{note}</p>
    </div>
  );

  return (
    <div className="bg-surface py-8 md:py-10">
      <div className="container">
        <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
          <AccountSidebar />

          <section className="rounded-2xl bg-white p-5 md:p-6">
            <h1 className="text-[1.25rem] font-bold tracking-[-0.02em] text-ink">
              My profile
            </h1>
            <p className="mt-1 text-[0.82rem] text-muted">
              This is the name that appears on your orders and invoices.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {field(
                "firstName",
                "First name",
                firstName,
                setFirstName,
                errors.firstName
              )}
              {/* Optional. A single-name legal identity is common in India,
                  and requiring a surname locks those people out of their own
                  profile for the sake of a tidier greeting. */}
              {field("lastName", "Last name (optional)", lastName, setLastName)}

              {locked(
                "Email",
                auth?.email ?? "",
                "This is how you sign in, so it can't be changed here."
              )}

              {auth?.phone &&
                locked(
                  "Mobile number",
                  auth.phone,
                  "Added from your last order. Update it at checkout."
                )}
            </div>

            {errors.form && (
              <p role="alert" className="mt-3 text-[0.78rem] text-accent">
                {errors.form}
              </p>
            )}

            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={submit}
                disabled={busy}
                className="rounded-xl bg-night px-6 py-3 text-[0.88rem] font-semibold text-white transition-colors hover:bg-night-deep disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
              >
                {busy ? "Saving…" : "Save changes"}
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 text-[0.82rem] font-medium text-save">
                  <Check size={15} />
                  Saved
                </span>
              )}
            </div>
          </section>
        </div>

        {/* ------------------------------------------------------ close account

            Its own card, below the form and outside it, so a destructive
            action can never be reached by tabbing past Save. Bordered rather
            than filled: a solid red block at the foot of a settings page reads
            as an error state on a page where nothing is wrong. */}
        <div className="mt-5 grid lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-5">
          <div className="hidden lg:block" aria-hidden />

          <section className="rounded-2xl border-2 border-line bg-white p-5 md:p-6">
            <h2 className="flex items-center gap-2 text-[0.95rem] font-semibold text-ink">
              <AlertTriangle size={16} className="text-accent" />
              Close your account
            </h2>

            {!confirmingDelete ? (
              <>
                <p className="mt-2 max-w-lg text-[0.82rem] leading-relaxed text-muted">
                  This removes your profile and saved addresses from
                  Officemate. You can sign up again with the same number
                  whenever you like.
                </p>
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className="mt-4 rounded-xl border-2 border-line px-5 py-2.5 text-[0.85rem] font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  Close account
                </button>
              </>
            ) : (
              <>
                <p className="mt-2 max-w-lg text-[0.85rem] font-semibold text-ink">
                  Are you sure?
                </p>

                {/* Spelled out rather than glossed. Saying "deletes
                    everything" would be untrue — order records stay with
                    Shopify, and someone deleting an account is entitled to
                    know exactly what survives. */}
                <ul className="mt-2 max-w-lg space-y-1 text-[0.82rem] leading-relaxed text-muted">
                  <li>
                    · Your name, email and saved addresses are deleted from
                    Officemate.
                  </li>
                  <li>
                    · Past orders are kept, as invoices and delivery records we
                    are required to hold.
                  </li>
                  <li>· Your wishlist stays in this browser until you clear it.</li>
                </ul>

                <label
                  htmlFor="confirm-delete"
                  className="mt-4 block text-[0.82rem] text-ink"
                >
                  {/* The word itself is red, not the whole line. It is the one
                      thing on this panel that has to be read exactly, and
                      colouring only the token that must be typed makes it
                      unmissable without turning the instruction into a
                      warning banner. */}
                  Type <span className="font-bold text-accent">CLOSE</span> to
                  confirm
                </label>
                <input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(e) => {
                    setConfirmText(e.target.value);
                    setErrors({});
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canDelete) void runDelete();
                  }}
                  autoComplete="off"
                  placeholder="CLOSE"
                  className="mt-2 h-12 w-full max-w-[12rem] rounded-xl border-2 border-line bg-surface px-3.5 text-[0.9rem] tracking-[0.08em] text-ink outline-none transition-colors placeholder:tracking-[0.08em] placeholder:text-muted/50 [&:hover:not(:focus)]:border-ink/40 focus:border-ink focus:bg-white focus-visible:outline-none"
                />

                {errors.delete && (
                  <p role="alert" className="mt-3 text-[0.78rem] text-accent">
                    {errors.delete}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={runDelete}
                    /* Disabled until the phrase matches, so the button itself
                       states the requirement — nobody has to press it and be
                       told off to find out. */
                    disabled={deleting || !canDelete}
                    className="rounded-xl bg-accent px-5 py-2.5 text-[0.85rem] font-semibold text-white transition-colors hover:bg-accent-deep disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
                  >
                    {deleting ? "Closing…" : "Yes, close my account"}
                  </button>
                  {/* Cancel is the plain-but-present option. Making it the
                      louder of the two would be manipulative in the other
                      direction; both are legible, and the destructive one is
                      the only red thing on the page. */}
                  <button
                    onClick={() => {
                      setConfirmingDelete(false);
                      setConfirmText("");
                      setErrors({});
                    }}
                    disabled={deleting}
                    className="rounded-xl border-2 border-line px-5 py-2.5 text-[0.85rem] font-semibold text-ink transition-colors hover:border-ink"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
