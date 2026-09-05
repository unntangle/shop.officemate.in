"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Banknote,
  Check,
  CreditCard,
  Landmark,
  Lock,
  Package,
  Smartphone,
} from "lucide-react";
import { useCart } from "@/components/commerce/CartProvider";
import { OrderSummary } from "@/components/commerce/OrderSummary";
import { ProductRender } from "@/components/common/ProductRender";
import { deliveryEstimate, formatINR } from "@/lib/commerce";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------
   PLACEHOLDER CHECKOUT

   There is no backend and no payment gateway wired up. "Place order" runs a
   simulated 1.6s delay and shows a confirmation, exactly as the old enquiry
   form did.

   Before launch this needs: server-side price recalculation (never trust the
   client's totals), a real PSP integration, address validation against a
   pincode serviceability API, and order persistence. The form below collects
   the right fields for all of that, but it posts nowhere.

   Note this file deliberately collects NO card details. Card capture belongs
   inside the PSP's hosted fields or iframe, never in our own inputs — doing it
   here would drag the whole site into PCI-DSS scope for no benefit.
------------------------------------------------------------------------- */

type Step = "address" | "payment" | "done";

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI", detail: "GPay, PhonePe, Paytm", icon: Smartphone },
  { id: "card", label: "Card", detail: "Credit or debit", icon: CreditCard },
  { id: "netbanking", label: "Net banking", detail: "All major banks", icon: Landmark },
  { id: "cod", label: "Cash on delivery", detail: "Pay on installation", icon: Banknote },
] as const;

const EMPTY_ADDRESS = {
  name: "",
  phone: "",
  email: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

export default function CheckoutPage() {
  const { lines, totals, ready, clearCart } = useCart();

  const [step, setStep] = useState<Step>("address");
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [method, setMethod] = useState<string>("upi");
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateAddress = () => {
    const next: Record<string, string> = {};

    if (address.name.trim().length < 2) next.name = "Enter your full name";
    /* Accepts an optional +91 and exactly ten digits. Kept permissive about
       spacing because people paste numbers formatted every possible way. */
    if (!/^(\+?91[-\s]?)?[6-9]\d{9}$/.test(address.phone.replace(/[\s-]/g, "")))
      next.phone = "Enter a valid 10-digit mobile number";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address.email))
      next.email = "Enter a valid email for the invoice";
    if (address.line1.trim().length < 4) next.line1 = "Enter the street address";
    if (address.city.trim().length < 2) next.city = "Enter the city";
    if (address.state.trim().length < 2) next.state = "Enter the state";
    if (!/^\d{6}$/.test(address.pincode)) next.pincode = "Enter a 6-digit PIN code";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const placeOrder = async () => {
    setPlacing(true);

    /* Simulated. See the note at the top of this file. */
    await new Promise((r) => setTimeout(r, 1600));

    const id = `OM${Date.now().toString().slice(-8)}`;
    console.info("[checkout] simulated order", {
      orderId: id,
      lines,
      totals,
      address,
      method,
    });

    setOrderId(id);
    setStep("done");
    setPlacing(false);
    clearCart();
  };

  /* ---------------------------------------------------------------- done */
  if (step === "done" && orderId) {
    return (
      <div className="container py-20">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-md text-center"
        >
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-save-soft">
            <Check size={34} className="text-save" />
          </span>
          <h1 className="mt-6 text-2xl font-bold text-ink">Order confirmed</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Thanks — we've sent the invoice to {address.email || "your email"}.
            Our team will call to schedule installation.
          </p>

          <div className="mt-6 rounded-2xl border border-line bg-white p-5 text-left">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Order number</span>
              <span className="font-bold text-ink">{orderId}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted">Estimated delivery</span>
              <span className="font-medium text-ink">{deliveryEstimate()}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted">Payment</span>
              <span className="font-medium text-ink">
                {PAYMENT_METHODS.find((m) => m.id === method)?.label}
              </span>
            </div>
          </div>

          <Link
            href="/products"
            className="mt-7 inline-flex h-12 items-center rounded-full bg-accent px-7 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
          >
            Continue shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  /* --------------------------------------------------------------- empty */
  if (ready && lines.length === 0) {
    return (
      <div className="container py-20 text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-surface">
          <Package size={30} className="text-muted" />
        </span>
        <h1 className="mt-6 text-2xl font-bold text-ink">Nothing to check out</h1>
        <p className="mt-2 text-sm text-muted">Your cart is empty.</p>
        <Link
          href="/products"
          className="mt-6 inline-flex h-12 items-center rounded-full bg-accent px-7 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
        >
          Shop the range
        </Link>
      </div>
    );
  }

  const field = (
    key: keyof typeof EMPTY_ADDRESS,
    label: string,
    opts: { type?: string; span?: boolean; placeholder?: string } = {}
  ) => (
    <div className={opts.span ? "sm:col-span-2" : undefined}>
      <label
        htmlFor={key}
        className="mb-1.5 block text-[0.78rem] font-medium text-ink"
      >
        {label}
      </label>
      <input
        id={key}
        type={opts.type ?? "text"}
        value={address[key]}
        placeholder={opts.placeholder}
        onChange={(e) => {
          setAddress((a) => ({ ...a, [key]: e.target.value }));
          setErrors((p) => ({ ...p, [key]: "" }));
        }}
        aria-invalid={Boolean(errors[key])}
        className={cn(
          "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-muted",
          errors[key] ? "border-accent" : "border-line focus:border-accent"
        )}
      />
      {errors[key] && (
        <p className="mt-1 text-[0.72rem] text-accent">{errors[key]}</p>
      )}
    </div>
  );

  return (
    <div className="bg-surface py-8 md:py-10">
      <div className="container">
        <Link
          href="/cart"
          className="group inline-flex items-center gap-1.5 text-[0.82rem] font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft
            size={15}
            className="transition-transform duration-300 group-hover:-translate-x-0.5"
          />
          Back to cart
        </Link>

        <h1 className="mt-3 text-[1.6rem] font-bold tracking-[-0.02em] text-ink md:text-[2rem]">
          Checkout
        </h1>

        {/* Step indicator */}
        <ol className="mt-4 flex items-center gap-2 text-[0.78rem]">
          {(["address", "payment"] as const).map((s, i) => {
            const done = step === "payment" && s === "address";
            const active = step === s;
            return (
              <li key={s} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[0.7rem] font-bold",
                    done
                      ? "bg-save text-white"
                      : active
                        ? "bg-accent text-white"
                        : "bg-line text-muted"
                  )}
                >
                  {done ? <Check size={13} /> : i + 1}
                </span>
                <span
                  className={cn(
                    "font-medium capitalize",
                    active ? "text-ink" : "text-muted"
                  )}
                >
                  {s}
                </span>
                {i === 0 && <span className="mx-1 h-px w-8 bg-line" />}
              </li>
            );
          })}
        </ol>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="space-y-4">
            {/* ------------------------------------------------ address */}
            <section className="rounded-2xl border border-line bg-white p-5">
              <h2 className="text-[0.95rem] font-bold text-ink">
                Delivery address
              </h2>

              {step === "address" ? (
                <>
                  <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                    {field("name", "Full name", { span: true })}
                    {field("phone", "Mobile number", {
                      type: "tel",
                      placeholder: "9876543210",
                    })}
                    {field("email", "Email", {
                      type: "email",
                      placeholder: "you@company.com",
                    })}
                    {field("line1", "Address line 1", { span: true })}
                    {field("line2", "Address line 2 (optional)", { span: true })}
                    {field("city", "City")}
                    {field("state", "State")}
                    {field("pincode", "PIN code", { placeholder: "600017" })}
                  </div>

                  <button
                    onClick={() => {
                      if (validateAddress()) setStep("payment");
                    }}
                    className="mt-5 h-12 w-full rounded-full bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent-deep sm:w-auto sm:px-10"
                  >
                    Continue to payment
                  </button>
                </>
              ) : (
                <div className="mt-3 flex items-start justify-between gap-4">
                  <div className="text-[0.82rem] leading-relaxed text-muted">
                    <p className="font-semibold text-ink">{address.name}</p>
                    <p>
                      {address.line1}
                      {address.line2 && `, ${address.line2}`}
                    </p>
                    <p>
                      {address.city}, {address.state} {address.pincode}
                    </p>
                    <p className="mt-1">
                      {address.phone} · {address.email}
                    </p>
                  </div>
                  <button
                    onClick={() => setStep("address")}
                    className="shrink-0 text-[0.8rem] font-semibold text-accent hover:text-accent-deep"
                  >
                    Change
                  </button>
                </div>
              )}
            </section>

            {/* ------------------------------------------------ payment */}
            <section
              className={cn(
                "rounded-2xl border bg-white p-5 transition-opacity",
                step === "payment"
                  ? "border-line"
                  : "pointer-events-none border-line opacity-45"
              )}
            >
              <h2 className="text-[0.95rem] font-bold text-ink">Payment method</h2>

              <div className="mt-4 space-y-2">
                {PAYMENT_METHODS.map((m) => {
                  const Icon = m.icon;
                  const selected = method === m.id;
                  return (
                    <label
                      key={m.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-all",
                        selected
                          ? "border-accent bg-accent-soft"
                          : "border-line hover:border-ink/25"
                      )}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={m.id}
                        checked={selected}
                        onChange={() => setMethod(m.id)}
                        className="sr-only"
                      />
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                          selected ? "bg-accent text-white" : "bg-surface text-muted"
                        )}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.85rem] font-semibold text-ink">
                          {m.label}
                        </span>
                        <span className="block text-[0.72rem] text-muted">
                          {m.detail}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "h-4 w-4 shrink-0 rounded-full border-2 transition-colors",
                          selected ? "border-accent bg-accent" : "border-line"
                        )}
                      />
                    </label>
                  );
                })}
              </div>

              <p className="mt-4 flex items-center gap-1.5 text-[0.72rem] text-muted">
                <Lock size={12} />
                Card details are entered on our payment provider's secure page,
                never on this site.
              </p>
            </section>
          </div>

          {/* ------------------------------------------------- summary */}
          <div className="lg:sticky lg:top-28">
            <div className="mb-3 rounded-2xl border border-line bg-white p-4">
              <p className="mb-3 text-[0.85rem] font-bold text-ink">
                {totals.itemCount} {totals.itemCount === 1 ? "item" : "items"}
              </p>
              <ul className="space-y-2.5">
                {lines.map((line) => (
                  <li key={line.lineId} className="flex items-center gap-3">
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
                      {line.image ? (
                        <Image
                          src={line.image}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <ProductRender
                          category={line.category}
                          color={line.colorHex}
                        />
                      )}
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-night px-1 text-[0.6rem] font-bold text-white">
                        {line.qty}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="clamp-1 block text-[0.78rem] font-medium text-ink">
                        {line.name}
                      </span>
                      <span className="block text-[0.7rem] text-muted">
                        {line.color}
                      </span>
                    </span>
                    <span className="shrink-0 text-[0.8rem] font-semibold text-ink">
                      {formatINR(line.price * line.qty)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <OrderSummary
              action={
                <button
                  onClick={placeOrder}
                  disabled={step !== "payment" || placing}
                  className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-sm font-semibold uppercase tracking-[0.04em] text-white shadow-accent transition-all hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
                >
                  {placing ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Placing order…
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      Place order · {formatINR(totals.total)}
                    </>
                  )}
                </button>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
