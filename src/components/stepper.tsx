"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";

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

export type StepperItem = {
  key: string;
  label: string;
  /** A link to the step, or … */
  href?: string;
  /** … a button action; with `href`, a click handler that may cancel. */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
};

/**
 * Numbered circles joined by a line, the label below each. Steps before
 * the current one are completed (check mark), the current one is filled,
 * later ones are outlined. Used by the macrocycle planning and the week
 * editor.
 */
export function Stepper({
  label,
  items,
  current,
  completedText,
}: {
  /** Accessible name of the navigation. */
  label: string;
  items: StepperItem[];
  /** Index of the current step. */
  current: number;
  /** Spoken after completed steps, e.g. "completed". */
  completedText: string;
}) {
  return (
    <nav aria-label={label}>
      <ol
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        }}
      >
        {items.map((step, index) => {
          const isCurrent = index === current;
          const completed = index < current;
          const circle = `relative z-[2] flex size-8 items-center justify-center rounded-full border-2 text-sm font-semibold ${
            isCurrent
              ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
              : completed
                ? "border-zinc-900 bg-white text-zinc-900 dark:border-zinc-100 dark:bg-zinc-950 dark:text-zinc-100"
                : "border-zinc-300 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400"
          }`;
          // Screen readers hear "1 Base data, completed"; the circle is visual.
          const spoken = `${index + 1} ${step.label}${completed ? `, ${completedText}` : ""}`;
          const content: ReactNode = (
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
                {step.label}
              </span>
            </>
          );
          const item = "flex flex-col items-center gap-2 rounded-lg px-1 py-1";
          const hover = "hover:bg-zinc-100 dark:hover:bg-zinc-900";
          return (
            <li key={step.key} className="relative">
              {/* Connector to the next step, from circle centre to centre. */}
              {index < items.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`absolute top-5 left-1/2 z-[1] h-0.5 w-full -translate-y-1/2 ${
                    index < current
                      ? "bg-zinc-900 dark:bg-zinc-100"
                      : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                />
              )}
              {isCurrent || step.disabled ? (
                <span
                  aria-current={isCurrent ? "step" : undefined}
                  aria-disabled={step.disabled || undefined}
                  className={`${item} ${step.disabled ? "opacity-40" : ""}`}
                >
                  {content}
                </span>
              ) : step.href ? (
                <Link
                  href={step.href}
                  onClick={step.onClick}
                  className={`${item} ${hover}`}
                >
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={step.onClick}
                  className={`${item} w-full ${hover}`}
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
