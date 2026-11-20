import { useFormatter, useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  localized,
  type LiftCategory,
  type LocalizedText,
} from "@/domain/exercises/catalog-types";
import type { CurrentWeek } from "@/domain/week-plans/week-plan-types";
import { WeekViewTable } from "../week-plans/week-view-table";

const button =
  "inline-flex min-h-11 items-center justify-center rounded-full px-5 font-medium";
const primary = `${button} bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300`;
const secondary = `${button} border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900`;

/** Monday 2024-01-01 plus `weekday - 1` days, for localized weekday names. */
const dayDate = (weekday: number) => new Date(Date.UTC(2024, 0, weekday));

/**
 * "Training week" on the athlete page: the plan of the current week,
 * read-only, with the athlete's feedback per exercise. Whoever may plan
 * also gets "Edit week" / "Plan this week" and "Plan next week".
 */
export function TrainingWeekSection({
  athleteId,
  current,
  names,
  categories,
  canEdit,
  canGiveFeedback,
}: {
  athleteId: string;
  current: CurrentWeek;
  /** Catalog names of the week's exercises. */
  names: Record<number, LocalizedText>;
  /** Lift categories of the week's exercises. */
  categories: Record<number, LiftCategory[]>;
  canEdit: boolean;
  canGiveFeedback: boolean;
}) {
  const t = useTranslations("WeekView");
  const tm = useTranslations("Macrocycle.mesocycles");
  const tl = useTranslations("Macrocycle.chart.levels");
  const te = useTranslations("WeekEditor");
  const ta = useTranslations("AthleteHome.trainingWeek");
  const format = useFormatter();
  const locale = useLocale();
  const date = (iso: string) =>
    format.dateTime(new Date(`${iso}T00:00:00Z`), {
      dateStyle: "medium",
      timeZone: "UTC",
    });
  const editor = (week: number, prefill: boolean) =>
    `/athletes/${athleteId}/macrocycle/weeks/${week}${prefill ? "?prefill=previous" : ""}`;

  return (
    <section
      aria-labelledby="training-week-heading"
      className="mt-4 flex flex-col gap-3"
    >
      <h2 id="training-week-heading" className="text-lg font-semibold">
        {ta("title")}
      </h2>
      {current.state === "before" && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t("before", { date: date(current.startDate) })}
        </p>
      )}
      {current.state === "after" && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("after")}</p>
      )}
      {current.state === "week" && (
        <WeekContent
          athleteId={athleteId}
          current={current}
          canEdit={canEdit}
          canGiveFeedback={canGiveFeedback}
          header={[
            t("weekOf", {
              week: current.week.weekNumber,
              weeks: current.week.durationWeeks,
            }),
            t("from", { date: date(current.week.startDate) }),
            t("calendarWeek", { week: current.calendarWeek }),
            t("blockAndLevel", {
              block: tm(current.week.mesocycle),
              level: tl(current.week.level),
            }),
          ]}
          labels={{
            notPlanned: t("notPlanned"),
            editWeek: t("editWeek"),
            planThis: t("planThis"),
            next: current.next
              ? current.next.planned
                ? t("editNext")
                : t("planNext")
              : null,
          }}
          editor={editor}
          sessionLabel={(weekday, slot, several) => {
            const day = format.dateTime(dayDate(weekday), {
              weekday: "long",
              timeZone: "UTC",
            });
            return several ? te("sessionLabel", { day, slot }) : day;
          }}
          categories={categories}
          names={Object.fromEntries(
            Object.entries(names).map(([n, name]) => [
              n,
              `${n} ${localized(name, locale)}`,
            ]),
          )}
          variations={current.week.variations}
        />
      )}
    </section>
  );
}

function WeekContent({
  athleteId,
  current,
  canEdit,
  canGiveFeedback,
  header,
  labels,
  editor,
  sessionLabel,
  names,
  variations,
  categories,
}: {
  athleteId: string;
  current: Extract<CurrentWeek, { state: "week" }>;
  canEdit: boolean;
  canGiveFeedback: boolean;
  header: string[];
  labels: {
    notPlanned: string;
    editWeek: string;
    planThis: string;
    next: string | null;
  };
  editor: (week: number, prefill: boolean) => string;
  sessionLabel: (weekday: number, slot: number, several: boolean) => string;
  names: Record<string, string>;
  variations: Record<number, string>;
  categories: Record<number, LiftCategory[]>;
}) {
  const { week, next } = current;
  // The same set columns in every table: the most sets of any exercise.
  const setColumns = Math.max(
    1,
    ...week.sessions.flatMap((s) =>
      s.exercises.map((e) => e.setGroups.reduce((sum, g) => sum + g.sets, 0)),
    ),
  );
  const perDay = (weekday: number) =>
    week.sessions.filter((s) => s.weekday === weekday).length;
  return (
    <>
      <p
        data-week-header
        className="flex flex-wrap gap-x-3 text-sm text-zinc-600 dark:text-zinc-400"
      >
        {header.map((part) => (
          <span key={part}>{part}</span>
        ))}
      </p>
      {!week.planned ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {labels.notPlanned}
        </p>
      ) : (
        week.sessions.map((s) => (
          <WeekViewTable
            key={`${s.weekday}.${s.slot}`}
            athleteId={athleteId}
            weekNumber={week.weekNumber}
            session={s}
            label={sessionLabel(s.weekday, s.slot, perDay(s.weekday) > 1)}
            names={names}
            variations={variations}
            setColumns={setColumns}
            categories={categories}
            canGiveFeedback={canGiveFeedback}
          />
        ))
      )}
      {canEdit && (
        // Below the week: edit (or plan) this week on the left, the next
        // week on the right.
        <div data-week-actions className="flex flex-wrap justify-between gap-2">
          {week.planned ? (
            <Link href={editor(week.weekNumber, false)} className={primary}>
              {labels.editWeek}
            </Link>
          ) : (
            <Link href={editor(week.weekNumber, true)} className={primary}>
              {labels.planThis}
            </Link>
          )}
          {next && labels.next && (
            <Link
              href={editor(next.weekNumber, !next.planned)}
              className={secondary}
            >
              {labels.next}
            </Link>
          )}
        </div>
      )}
    </>
  );
}
