import { useTranslations } from "next-intl";
import Link from "next/link";

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
  const currentIndex = steps.indexOf(current);
  return (
    <nav aria-label={t("label")}>
      <ol className="grid grid-cols-4">
        {steps.map((step, index) => {
          const isCurrent = index === currentIndex;
          const completed = index < currentIndex;
          const disabled = !available && step !== "base-data";
          const circle = `relative z-10 flex size-8 items-center justify-center rounded-full border-2 text-sm font-semibold ${
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
                  className={`absolute top-5 left-1/2 h-0.5 w-full -translate-y-1/2 ${
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
                  className={`${item} hover:bg-zinc-100 dark:hover:bg-zinc-900`}
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
