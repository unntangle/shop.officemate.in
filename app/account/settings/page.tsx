"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import type { Address } from "@/components/common/AuthProvider";
import { useAuth } from "@/components/common/AuthProvider";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { cn } from "@/lib/utils";

/**
 * Account settings — edit the profile, manage saved addresses.
 *
 * ⚠ EVERYTHING HERE IS LOCAL. Both the profile and the addresses live in this
 * browser's localStorage; there is no endpoint to send them to. That is what
 * makes storing an address acceptable under demo auth — the sign-in flow is
 * not protecting it, but nothing else can reach it either. See AuthProvider.
 *
 * THE MOMENT ADDRESSES SYNC TO A SERVER, real auth has to land first.
 *
 * The phone number is shown but NOT editable. Changing it means re-verifying,
 * which means the OTP flow, which means the real one — an account whose phone
 * can be swapped in a text field is an account with no identity at all. When
 * that flow exists, "Change number" belongs here and should reuse it rather
 * than growing its own.
 *
 * These addresses do not yet prefill checkout. That is the obvious next step
 * and the reason the field names match `EMPTY_ADDRESS` in the checkout page —
 * wiring it is a mapping, not a rewrite.
 */

const PHONE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const BLANK: Omit<Address, "id"> = {
  label: "",
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

/** `crypto.randomUUID` is unavailable on http:// origins in some browsers. */
const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `addr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export default function AccountSettingsPage() {
  const router = useRouter();
  const {
    profile,
    signedIn,
    profileComplete,
    ready,
    saveProfile,
    saveAddress,
    removeAddress,
  } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileSaved, setProfileSaved] = useState(false);

  /** `null` when the address form is closed; otherwise the draft being edited. */
  const [draft, setDraft] = useState<Address | null>(null);
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!ready) return;
    if (!signedIn) router.replace("/");
    else if (!profileComplete) router.replace("/account/setup");
  }, [ready, signedIn, profileComplete, router]);

  useEffect(() => {
    if (!profile) return;
    setFirstName((v) => v || profile.firstName || "");
    setLastName((v) => v || profile.lastName || "");
    setEmail((v) => v || profile.email || "");
  }, [profile]);

  /* The "Saved" tick clears itself. A confirmation that stays forever stops
     being a confirmation — after a minute it just reads as a label. */
  useEffect(() => {
    if (!profileSaved) return;
    const t = window.setTimeout(() => setProfileSaved(false), 2200);
    return () => window.clearTimeout(t);
  }, [profileSaved]);

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

  const addresses = profile?.addresses ?? [];

  const submitProfile = () => {
    const errors: Record<string, string> = {};
    if (firstName.trim().length < 2) errors.firstName = "Enter your first name";
    if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address";
    setProfileErrors(errors);
    if (Object.keys(errors).length) return;

    /* Changing the email does NOT reset `emailVerified`. It should — a new
       address has not been verified — but doing that here would bounce the
       person straight back into the setup flow mid-edit. Handle it properly
       when the real email endpoint exists: save the new address as pending and
       verify it in place. */
    saveProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
    });
    setProfileSaved(true);
  };

  const submitAddress = () => {
    if (!draft) return;
    const errors: Record<string, string> = {};
    if (draft.label.trim().length < 2) errors.label = "Name this address";
    if (draft.name.trim().length < 2) errors.name = "Enter the recipient's name";
    if (!PHONE_RE.test(draft.phone.replace(/\s/g, "")))
      errors.phone = "Enter a valid 10-digit mobile number";
    if (draft.line1.trim().length < 4) errors.line1 = "Enter the street address";
    if (draft.city.trim().length < 2) errors.city = "Enter the city";
    if (draft.state.trim().length < 2) errors.state = "Enter the state";
    if (!/^\d{6}$/.test(draft.pincode)) errors.pincode = "Enter a 6-digit PIN code";

    setAddressErrors(errors);
    if (Object.keys(errors).length) return;

    saveAddress(draft);
    setDraft(null);
  };

  const field = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts: { error?: string; placeholder?: string; span?: boolean } = {}
  ) => (
    <div className={opts.span ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className="block text-[0.78rem] font-medium text-muted">
        {label}
      </label>
      <input
        id={id}
        value={value}
        placeholder={opts.placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(opts.error)}
        className={cn(
          "mt-1.5 h-12 w-full rounded-xl border-2 bg-surface px-3.5 text-[0.9rem] text-ink outline-none transition-colors placeholder:text-muted/60 focus-visible:outline-none",
          opts.error
            ? "border-accent"
            : "border-transparent [&:hover:not(:focus)]:border-line focus:border-ink focus:bg-white"
        )}
      />
      {opts.error && (
        <p role="alert" className="mt-1 text-[0.72rem] text-accent">
          {opts.error}
        </p>
      )}
    </div>
  );

  return (
    <div className="bg-surface py-8 md:py-10">
      <div className="container">
        <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
          <AccountSidebar />

          <div className="space-y-5">
            {/* ---------------------------------------------------- profile */}
            <section className="rounded-2xl bg-white p-5 md:p-6">
              <h1 className="text-[1.25rem] font-bold tracking-[-0.02em] text-ink">
                Profile
              </h1>
              <p className="mt-1 text-[0.82rem] text-muted">
                This is the name and email on your orders and invoices.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {field("firstName", "First name", firstName, setFirstName, {
                  error: profileErrors.firstName,
                })}
                {/* Optional. A single-name legal identity is common in India,
                    and requiring it locks those people out for the sake of a
                    tidier greeting. */}
                {field("lastName", "Last name (optional)", lastName, setLastName)}
                {field("email", "Email", email, setEmail, {
                  error: profileErrors.email,
                  span: true,
                })}

                <div className="sm:col-span-2">
                  <label className="block text-[0.78rem] font-medium text-muted">
                    Mobile number
                  </label>
                  {/* Read-only: changing it means re-verifying, and that flow
                      does not exist yet. See the file header. */}
                  <div className="mt-1.5 flex h-12 items-center rounded-xl border-2 border-transparent bg-surface px-3.5 text-[0.9rem] text-muted">
                    +91 {profile?.phone}
                    <span className="ml-auto text-[0.72rem]">Verified</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={submitProfile}
                  className="rounded-xl bg-night px-6 py-3 text-[0.88rem] font-semibold text-white transition-colors hover:bg-night-deep"
                >
                  Save changes
                </button>
                {profileSaved && (
                  <span className="flex items-center gap-1.5 text-[0.82rem] font-medium text-save">
                    <Check size={15} />
                    Saved
                  </span>
                )}
              </div>
            </section>

            {/* -------------------------------------------------- addresses */}
            <section className="rounded-2xl bg-white p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-[1.25rem] font-bold tracking-[-0.02em] text-ink">
                    Saved addresses
                  </h2>
                  <p className="mt-1 text-[0.82rem] text-muted">
                    Stored on this device only.
                  </p>
                </div>

                {!draft && (
                  <button
                    onClick={() => {
                      /* Prefill the recipient from the profile. Most people are
                         ordering for themselves, and retyping a name you have
                         already given is the fastest way to lose someone in a
                         seven-field form. */
                      setDraft({
                        ...BLANK,
                        id: newId(),
                        name: [profile?.firstName, profile?.lastName]
                          .filter(Boolean)
                          .join(" "),
                        phone: profile?.phone ?? "",
                      });
                      setAddressErrors({});
                    }}
                    className="flex items-center gap-2 rounded-xl border-2 border-line px-4 py-2.5 text-[0.85rem] font-semibold text-ink transition-colors hover:border-ink"
                  >
                    <Plus size={16} />
                    Add address
                  </button>
                )}
              </div>

              {draft && (
                <div className="mt-5 rounded-2xl border-2 border-line p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {field(
                      "label",
                      "Address name",
                      draft.label,
                      (v) => setDraft({ ...draft, label: v }),
                      { placeholder: "Home, Office…", error: addressErrors.label }
                    )}
                    {field(
                      "name",
                      "Recipient",
                      draft.name,
                      (v) => setDraft({ ...draft, name: v }),
                      { error: addressErrors.name }
                    )}
                    {field(
                      "phone",
                      "Mobile number",
                      draft.phone,
                      (v) =>
                        setDraft({ ...draft, phone: v.replace(/\D/g, "").slice(0, 10) }),
                      { placeholder: "00000 00000", error: addressErrors.phone }
                    )}
                    {field(
                      "pincode",
                      "PIN code",
                      draft.pincode,
                      (v) =>
                        setDraft({ ...draft, pincode: v.replace(/\D/g, "").slice(0, 6) }),
                      { placeholder: "600017", error: addressErrors.pincode }
                    )}
                    {field(
                      "line1",
                      "Address line 1",
                      draft.line1,
                      (v) => setDraft({ ...draft, line1: v }),
                      { span: true, error: addressErrors.line1 }
                    )}
                    {field(
                      "line2",
                      "Address line 2 (optional)",
                      draft.line2 ?? "",
                      (v) => setDraft({ ...draft, line2: v }),
                      { span: true }
                    )}
                    {field("city", "City", draft.city, (v) =>
                      setDraft({ ...draft, city: v })
                    )}
                    {field("state", "State", draft.state, (v) =>
                      setDraft({ ...draft, state: v })
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={submitAddress}
                      className="rounded-xl bg-night px-6 py-3 text-[0.88rem] font-semibold text-white transition-colors hover:bg-night-deep"
                    >
                      Save address
                    </button>
                    <button
                      onClick={() => setDraft(null)}
                      className="flex items-center gap-1.5 rounded-xl px-4 py-3 text-[0.85rem] font-medium text-muted transition-colors hover:bg-surface hover:text-ink"
                    >
                      <X size={15} />
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {addresses.length === 0 && !draft ? (
                <div className="mt-6 flex flex-col items-center py-10 text-center">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-surface">
                    <MapPin size={22} className="text-muted" />
                  </span>
                  <p className="mt-3 text-[0.9rem] font-semibold text-ink">
                    No saved addresses
                  </p>
                  <p className="mt-1 max-w-xs text-[0.82rem] leading-relaxed text-muted">
                    Add one and it will be ready the next time you check out.
                  </p>
                </div>
              ) : (
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {addresses.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-2xl border-2 border-line p-4 text-[0.85rem] leading-relaxed text-muted"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-ink">{a.label}</p>
                        <div className="flex shrink-0 gap-1">
                          <button
                            onClick={() => {
                              setDraft(a);
                              setAddressErrors({});
                            }}
                            aria-label={`Edit ${a.label}`}
                            className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => removeAddress(a.id)}
                            aria-label={`Delete ${a.label}`}
                            className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-accent-soft hover:text-accent"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-ink">{a.name}</p>
                      <p>
                        {a.line1}
                        {a.line2 ? `, ${a.line2}` : ""}
                      </p>
                      <p>
                        {a.city}, {a.state} {a.pincode}
                      </p>
                      <p className="mt-1">+91 {a.phone}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
