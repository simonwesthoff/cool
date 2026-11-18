import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import type { TrainingWeeks } from "@/domain/week-plans/week-plan-types";

const button =
  "inline-flex min-h-11 items-center justify-center rounded-full px-5 font-medium";

/**
 * "Training week" on the athlete page, for whoever may plan: plan or edit
 * the next week, plan an unplanned current week, and the planned weeks.
 */
export function TrainingWeekSection({
  athleteId,
  weeks,
}: {
  athleteId: string;
  weeks: TrainingWeeks;
}) {
  const t = useTranslations("AthleteHome.trainingWeek");
  const format = useFormatter();
  const editor = (week: number, prefill: boolean) =>
    `/athletes/${athleteId}/macrocycle/weeks/${week}${prefill ? "?prefill=previous" : ""}`;
  const date = (iso: string) =>
    format.dateTime(new Date(`${iso}T00:00:00Z`), {
      dateStyle: "medium",
      timeZone: "UTC",
    });
  const { current, next, planned } = weeks;

  return (
    <section
      aria-labelledby="training-week-heading"
      className="mt-4 flex flex-col gap-3"
    >
      <h2 id="training-week-heading" className="text-lg font-semibold">
        {t("title")}
      </h2>
      <div className="flex flex-wrap gap-2">
        {next &&
          (next.planned ? (
            <Link
              href={editor(next.weekNumber, false)}
              className={`${button} border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900`}
            >
              {t("editNext", { week: next.weekNumber })}
            </Link>
          ) : (
            <Link
              href={editor(next.weekNumber, true)}
              className={`${button} bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300`}
            >
              {t("planNext", { week: next.weekNumber })}
            </Link>
          ))}
        {current && !current.planned && (
          <Link
            href={editor(current.weekNumber, true)}
            className={`${button} border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900`}
          >
            {t("planThis", { week: current.weekNumber })}
          </Link>
        )}
      </div>
      {planned.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("none")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-200 rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {planned.map((w) => (
            <li
              key={w.weekNumber}
              data-week={w.weekNumber}
              className="flex items-center justify-between gap-3 px-4 py-2"
            >
              <span>
                <span className="font-medium">
                  {t("week", { week: w.weekNumber })}
                </span>
                <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {t("from", { date: date(w.startDate) })}
                </span>
                {current?.weekNumber === w.weekNumber && (
                  <span className="ml-2 rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
                    {t("current")}
                  </span>
                )}
              </span>
              <Link
                href={editor(w.weekNumber, false)}
                aria-label={t("editWeek", { week: w.weekNumber })}
                className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                {t("edit")}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
