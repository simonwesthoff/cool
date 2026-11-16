import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import type { MacrocycleBaseData } from "@/domain/macrocycles/macrocycle-types";

function addDays(isoDate: string, days: number): Date {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

const button =
  "inline-flex min-h-11 items-center self-start rounded-full px-5 font-medium";

/**
 * Macrocycle section of the athlete details page (placeholder until the
 * macrocycle chart section of the details page exists). A planned
 * macrocycle opens the macrocycle view.
 */
export function MacrocycleSection({
  athleteId,
  macrocycle,
}: {
  athleteId: string;
  macrocycle: Pick<
    MacrocycleBaseData,
    "startDate" | "durationWeeks" | "competitionDate" | "competitionType"
  > | null;
}) {
  const t = useTranslations("AthleteDetails.macrocycle");
  const format = useFormatter();
  const date = (value: Date) =>
    format.dateTime(value, { dateStyle: "medium", timeZone: "UTC" });
  const planning = `/athletes/${athleteId}/macrocycle/base-data`;

  return (
    <section
      aria-labelledby="macrocycle-heading"
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <h2 id="macrocycle-heading" className="text-lg font-semibold">
        {t("title")}
      </h2>
      {macrocycle ? (
        <>
          {/* The planned macrocycle opens the macrocycle view. */}
          <Link
            href={`/athletes/${athleteId}/macrocycle`}
            aria-label={t("open")}
            className="-mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            <span className="flex flex-col gap-1">
              <p>
                {t("period", {
                  start: date(addDays(macrocycle.startDate, 0)),
                  end: date(
                    addDays(
                      macrocycle.startDate,
                      7 * macrocycle.durationWeeks - 1,
                    ),
                  ),
                  weeks: macrocycle.durationWeeks,
                })}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                {t("competition", {
                  type: macrocycle.competitionType,
                  date: date(addDays(macrocycle.competitionDate, 0)),
                })}
              </p>
            </span>
            <span aria-hidden="true" className="text-2xl text-zinc-400">
              ›
            </span>
          </Link>
          <Link
            href={planning}
            className={`${button} border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900`}
          >
            {t("change")}
          </Link>
        </>
      ) : (
        <>
          <p className="text-zinc-600 dark:text-zinc-400">{t("none")}</p>
          <Link
            href={planning}
            className={`${button} bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300`}
          >
            {t("plan")}
          </Link>
        </>
      )}
    </section>
  );
}
