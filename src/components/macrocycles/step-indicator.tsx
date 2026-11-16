import { useTranslations } from "next-intl";
import Link from "next/link";

const steps = ["base-data", "intensity", "exercises"] as const;
export type PlanningStep = (typeof steps)[number];

/** "1 Base data · 2 Intensity · 3 Exercises" with the current step marked. */
export function StepIndicator({
  athleteId,
  current,
  available,
}: {
  athleteId: string;
  current: PlanningStep;
  /** Steps 2 and 3 need an existing macrocycle. */
  available: boolean;
}) {
  const t = useTranslations("Macrocycle.steps");
  return (
    <nav aria-label={t("label")}>
      <ol className="flex flex-wrap gap-2 text-sm">
        {steps.map((step, index) => {
          const isCurrent = step === current;
          const label = `${index + 1} ${t(step)}`;
          const className = `inline-flex min-h-11 items-center rounded-full px-4 font-medium ${
            isCurrent
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "border border-zinc-300 dark:border-zinc-700"
          }`;
          return (
            <li key={step}>
              {isCurrent || (!available && step !== "base-data") ? (
                <span
                  aria-current={isCurrent ? "step" : undefined}
                  className={`${className} ${!isCurrent ? "opacity-40" : ""}`}
                >
                  {label}
                </span>
              ) : (
                <Link
                  href={`/athletes/${athleteId}/macrocycle/${step}`}
                  className={className}
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
