"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useId, useState } from "react";
import {
  localized,
  type LocalizedText,
} from "@/domain/exercises/catalog-types";
import type {
  ExerciseWeeks,
  Macrocycle,
} from "@/domain/macrocycles/macrocycle-types";
import { ExerciseChart } from "./exercise-chart";
import { MacrocycleSummary } from "./macrocycle-summary";

export type ExerciseOption = { number: number; name: LocalizedText };

type Props = {
  macrocycle: Macrocycle;
  /** Values of the exercise shown first (the snatch). */
  initialValues: ExerciseWeeks;
  /** Exercises that can be chosen (those with reference values). */
  exercises: ExerciseOption[];
  /** Today (YYYY-MM-DD) for the current-week line. */
  today: string;
  /** Only for the coach: link to change the planning. */
  editHref?: string;
  back: { href: string; label: string };
};

const button =
  "inline-flex min-h-11 items-center rounded-full px-5 font-medium";

/** Read-only macrocycle view for the coach and the linked athlete. */
export function MacrocycleView({
  macrocycle,
  initialValues,
  exercises,
  today,
  editHref,
  back,
}: Props) {
  const t = useTranslations("MacrocycleView");
  const locale = useLocale();
  const selectId = useId();
  const [selected, setSelected] = useState(initialValues.exerciseNumber);
  // Values per exercise, so switching back to an exercise is instant.
  const [loaded, setLoaded] = useState<Record<number, ExerciseWeeks>>({
    [initialValues.exerciseNumber]: initialValues,
  });
  const [shown, setShown] = useState(initialValues.exerciseNumber);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function choose(number: number) {
    setSelected(number);
    setFailed(false);
    if (loaded[number]) {
      setShown(number);
      return;
    }
    setLoading(true);
    const response = await fetch(
      `/api/athletes/${macrocycle.athleteId}/macrocycle/exercises/${number}`,
    ).catch(() => null);
    setLoading(false);
    if (!response?.ok) {
      // Keep the previous exercise.
      setSelected(shown);
      setFailed(true);
      return;
    }
    const values = (await response.json()) as ExerciseWeeks;
    setLoaded((current) => ({ ...current, [number]: values }));
    setShown(number);
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3" aria-label={t("chartTitle")}>
        <div className="flex flex-col gap-1">
          <label htmlFor={selectId} className="text-sm font-medium">
            {t("exercise")}
          </label>
          <select
            id={selectId}
            value={selected}
            onChange={(event) => choose(Number(event.target.value))}
            className="min-h-11 w-full max-w-sm rounded-lg border border-zinc-300 bg-transparent px-3 dark:border-zinc-700 dark:bg-zinc-950"
          >
            {exercises.map((e) => (
              <option key={e.number} value={e.number}>
                {t("exerciseOption", {
                  number: e.number,
                  name: localized(e.name, locale),
                })}
              </option>
            ))}
          </select>
        </div>
        {failed && (
          <p
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
          >
            {t("loadFailed")}
          </p>
        )}
        <ExerciseChart
          weeks={macrocycle.weeks}
          mesocycles={macrocycle.mesocycles}
          values={loaded[shown]!.weeks}
          competition={{
            date: macrocycle.competitionDate,
            type: macrocycle.competitionType,
          }}
          today={today}
          dimmed={loading}
        />
      </section>
      <MacrocycleSummary macrocycle={macrocycle} />
      <div className="flex flex-wrap gap-3">
        {editHref && (
          <Link
            href={editHref}
            className={`${button} bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300`}
          >
            {t("change")}
          </Link>
        )}
        <Link
          href={back.href}
          className={`${button} text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900`}
        >
          {back.label}
        </Link>
      </div>
    </div>
  );
}
