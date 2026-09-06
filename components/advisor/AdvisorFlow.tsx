"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { ADVISOR_QUESTIONS, type QuestionId } from "@/constants/advisor";
import { recommend, summarise, type AnswerMap } from "@/lib/advisor";
import { ProductCard } from "@/components/products/ProductCard";
import { EnquireButton } from "@/components/common/EnquireButton";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

export function AdvisorFlow() {
  const params = useSearchParams();

  // Question one is usually answered on the homepage and arrives as ?hours=…
  const initial: AnswerMap = {};
  for (const q of ADVISOR_QUESTIONS) {
    const value = params.get(q.id);
    if (value && q.options.some((o) => o.value === value)) initial[q.id] = value;
  }

  const [answers, setAnswers] = useState<AnswerMap>(initial);

  const step = ADVISOR_QUESTIONS.findIndex((q) => !answers[q.id]);
  const done = step === -1;
  const current = done ? null : ADVISOR_QUESTIONS[step];
  const results = done ? recommend(answers) : [];

  const answer = (id: QuestionId, value: string) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const back = () => {
    const answered = ADVISOR_QUESTIONS.filter((q) => answers[q.id]);
    const last = answered[answered.length - 1];
    if (!last) return;
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[last.id];
      return next;
    });
  };

  const progress = Object.keys(answers).length / ADVISOR_QUESTIONS.length;

  return (
    <div>
      <AnimatePresence mode="wait">
        {/* ---------- Questions ---------- */}
        {current && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="mx-auto max-w-2xl rounded-3xl bg-card p-7 shadow-soft md:p-10"
          >
            {/* Progress */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sage text-xs font-bold text-white">
                  {step + 1}
                </span>
                <span className="text-xs font-semibold uppercase tracking-eyebrow text-muted">
                  of {ADVISOR_QUESTIONS.length}
                </span>
              </div>
              {Object.keys(answers).length > 0 && (
                <button
                  onClick={() => setAnswers({})}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink"
                >
                  <RotateCcw size={12} />
                  Start over
                </button>
              )}
            </div>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface">
              <motion.div
                className="h-full rounded-full bg-sage"
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.4, ease: EASE }}
              />
            </div>

            <h2 className="mt-7 text-xl font-bold text-ink md:text-2xl">
              {current.question}
            </h2>
            <p className="mt-2 text-sm text-muted">{current.helper}</p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {current.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => answer(current.id, option.value)}
                  className="group flex items-center justify-between gap-3 rounded-2xl border-2 border-line bg-canvas px-4 py-4 text-left text-sm font-semibold text-ink transition-all duration-300 hover:border-sage hover:bg-sage-soft"
                >
                  {option.label}
                  <ArrowRight
                    size={15}
                    className="shrink-0 -translate-x-1 text-sage-ink opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                  />
                </button>
              ))}
            </div>

            {step > 0 && (
              <button
                onClick={back}
                className="group mt-7 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
              >
                <ArrowLeft
                  size={15}
                  className="transition-transform group-hover:-translate-x-0.5"
                />
                Back
              </button>
            )}
          </motion.div>
        )}

        {/* ---------- Results ---------- */}
        {done && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-flex items-center rounded-full bg-sage-soft px-3.5 py-1.5 text-xs font-semibold text-sage-ink">
                Matched to your answers
              </div>
              <h2 className="display mt-5 text-3xl font-semibold text-ink sm:text-4xl">
                Chairs that fit how you work
              </h2>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {summarise(answers).map((label) => (
                  <span
                    key={label}
                    className="rounded-full bg-card px-3 py-1.5 text-xs font-medium text-muted"
                  >
                    {label}
                  </span>
                ))}
                <button
                  onClick={() => setAnswers({})}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-ink"
                >
                  <RotateCcw size={12} />
                  Start over
                </button>
              </div>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((rec, i) => (
                <motion.div
                  key={rec.product.slug}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08, ease: EASE }}
                  className="overflow-hidden rounded-3xl bg-card p-3 shadow-soft"
                >
                  <div
                    className={cn(
                      "mb-3 flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-xs font-semibold",
                      i === 0 ? "bg-sage text-white" : "bg-surface text-muted"
                    )}
                  >
                    <span>{i === 0 ? "Best match" : `Option ${i + 1}`}</span>
                    <span className="tabular-nums">{rec.fit.toFixed(1)}/10 fit</span>
                  </div>

                  <ProductCard product={rec.product} />

                  <div className="space-y-2 px-2 pb-2 pt-4">
                    {rec.reasons.map((r) => (
                      <div
                        key={r.label}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-muted">{r.label}</span>
                        <span className="font-bold tabular-nums text-ink">
                          {r.score.toFixed(1)}
                        </span>
                      </div>
                    ))}
                    {rec.overBudget && (
                      <p className="pt-1 text-xs text-honey-ink">
                        Above your stated budget — shown because it fits ergonomically.
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Hand-off */}
            <div className="mt-14 rounded-3xl bg-card p-8 text-center md:p-12">
              <h3 className="display text-2xl font-semibold text-ink">
                Want a second opinion from a human?
              </h3>
              <p className="mx-auto mt-3 max-w-lg leading-relaxed text-muted">
                Send these results to our team and we&apos;ll confirm the fit, quote
                bulk pricing, or arrange a trial chair at your office.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <EnquireButton
                  size="md"
                  variant="primary"
                  withArrow
                  label="Send my results"
                  product={results[0]?.product.name}
                />
                <Link
                  href="/categories"
                  className="group inline-flex items-center gap-2 rounded-full bg-surface px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-line/70"
                >
                  Browse the full range
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </div>
            </div>

            <p className="mx-auto mt-8 max-w-xl text-center text-xs leading-relaxed text-muted">
              Recommendations are generated from the Officemate Chair Health Score
              weighted against your answers. They&apos;re a guide to fit, not medical
              advice — if you have persistent pain, please speak to a physiotherapist.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
