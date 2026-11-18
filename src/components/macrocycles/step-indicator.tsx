"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type MouseEvent } from "react";
import { useCurrentGuard } from "./unsaved-changes";

const steps = ["base-data", "swot", "intensity", "exercises"] as const;
export type PlanningStep = (typeof steps)[number];

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3.5 8.5 3 3 6-7" />
    </svg>
  );
}

/**
 * Stepper of the macrocycle planning: numbered circles joined by a line,
 * the label below each. Steps before the current one are completed (check
 * mark), the current one is filled, later ones are outlined.
 */
export function StepIndicator({
  athleteId,
  current,
  available,
}: {
  athleteId: string;
  current: PlanningStep;
  /** Steps 2 to 4 need an existing macrocycle. */
  available: boolean;
}) {
  const t = useTranslations("Macrocycle.steps");
  const tu = useTranslations("Macrocycle.unsaved");
  const router = useRouter();
  const guard = useCurrentGuard();
  const dialog = useRef<HTMLDialogElement>(null);
  // The step to open once the user decided about the unsaved changes.
  const [target, setTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const currentIndex = steps.indexOf(current);

  function go(href: string) {
    router.push(href);
    router.refresh();
  }

  function leave(event: MouseEvent<HTMLAnchorElement>, href: string) {
    // Plain navigation without unsaved changes (and for new tabs).
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    if (!guard()?.isDirty()) return;
    event.preventDefault();
    setTarget(href);
    dialog.current?.showModal();
  }

  async function saveAndLeave() {
    const current = guard();
    if (!current || !target) return;
    setSaving(true);
    const saved = await current.save();
    setSaving(false);
    dialog.current?.close();
    // When saving failed the form shows why, and the step stays open.
    if (saved) go(target);
  }

  function discardAndLeave() {
    dialog.current?.close();
    if (target) go(target);
  }

  return (
    <nav aria-label={t("label")}>
      <ol className="grid grid-cols-4">
        {steps.map((step, index) => {
          const isCurrent = index === currentIndex;
          const completed = index < currentIndex;
          const disabled = !available && step !== "base-data";
          const circle = `relative z-[2] flex size-8 items-center justify-center rounded-full border-2 text-sm font-semibold ${
            isCurrent
              ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
              : completed
                ? "border-zinc-900 bg-white text-zinc-900 dark:border-zinc-100 dark:bg-zinc-950 dark:text-zinc-100"
                : "border-zinc-300 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400"
          }`;
          // Screen readers hear "1 Base data, completed"; the circle is visual.
          const spoken = `${index + 1} ${t(step)}${completed ? `, ${t("completed")}` : ""}`;
          const content = (
            <>
              <span aria-hidden="true" className={circle}>
                {completed ? <CheckIcon /> : index + 1}
              </span>
              <span className="sr-only">{spoken}</span>
              <span
                aria-hidden="true"
                className={`text-center text-xs sm:text-sm ${
                  isCurrent
                    ? "font-semibold"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {t(step)}
              </span>
            </>
          );
          const item = "flex flex-col items-center gap-2 rounded-lg px-1 py-1";
          return (
            <li key={step} className="relative">
              {/* Connector to the next step, from circle centre to centre. */}
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`absolute top-5 left-1/2 z-[1] h-0.5 w-full -translate-y-1/2 ${
                    index < currentIndex
                      ? "bg-zinc-900 dark:bg-zinc-100"
                      : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                />
              )}
              {isCurrent || disabled ? (
                <span
                  aria-current={isCurrent ? "step" : undefined}
                  aria-disabled={disabled || undefined}
                  className={`${item} ${disabled ? "opacity-40" : ""}`}
                >
                  {content}
                </span>
              ) : (
                <Link
                  href={`/athletes/${athleteId}/macrocycle/${step}`}
                  onClick={(event) =>
                    leave(event, `/athletes/${athleteId}/macrocycle/${step}`)
                  }
                  className={`${item} hover:bg-zinc-100 dark:hover:bg-zinc-900`}
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      <dialog
        ref={dialog}
        aria-labelledby="unsaved-title"
        aria-describedby="unsaved-text"
        onClose={() => setTarget(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 backdrop:bg-black/60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
      >
        <h2 id="unsaved-title" className="text-lg font-semibold">
          {tu("title")}
        </h2>
        <p id="unsaved-text" className="mt-2 text-zinc-600 dark:text-zinc-400">
          {tu("text")}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="inline-flex min-h-11 items-center justify-center rounded-full px-3 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            {tu("cancel")}
          </button>
          <button
            type="button"
            onClick={discardAndLeave}
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-300 px-3 font-medium hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            {tu("discard")}
          </button>
          <button
            type="button"
            onClick={saveAndLeave}
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-zinc-900 px-3 font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {tu("save")}
          </button>
        </div>
      </dialog>
    </nav>
  );
}
