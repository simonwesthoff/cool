import { useFormatter, useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  localized,
  type Exercise,
  type ExerciseGroup,
} from "@/domain/exercises/catalog-types";
import { formatRange } from "./format";

type Props = {
  exercise: Exercise;
  group: Omit<ExerciseGroup, "exercises">;
};

/** All information about one exercise of the catalog. */
export function ExerciseDetails({ exercise, group }: Props) {
  const t = useTranslations("Catalog");
  const format = useFormatter();
  const locale = useLocale();
  const percent = (value: number | null) =>
    value === null
      ? null
      : format.number(value / 100, {
          style: "percent",
          maximumFractionDigits: 1,
        });

  const items: [string, ReactNode | null][] = [
    [t("group"), `${group.code} · ${localized(group.name, locale)}`],
    [
      t("referenceLift"),
      exercise.referenceLift ? t(`lifts.${exercise.referenceLift}`) : null,
    ],
    [t("bestValueLong"), percent(exercise.bestValuePct)],
    [t("maxWeeklyAverageWeight"), percent(exercise.maxWeeklyAverageWeightPct)],
    [t("repsPerSet"), formatRange(exercise.repsPerSet)],
    [t("repsPerWeek"), formatRange(exercise.repsPerWeek)],
    [
      t("comment"),
      exercise.comment ? localized(exercise.comment, locale) : null,
    ],
  ];

  return (
    <section className="flex flex-col gap-4">
      <Link
        href="/exercises"
        className="self-start text-sm font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        <span aria-hidden="true" className="mr-1">
          ‹
        </span>
        {t("back")}
      </Link>
      <div className="flex items-baseline gap-3">
        <span className="text-lg text-zinc-500 tabular-nums">
          {exercise.number}
        </span>
        <h1 className="text-2xl font-semibold break-words">
          {localized(exercise.name, locale)}
        </h1>
      </div>
      <dl className="divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-4"
          >
            <dt className="text-sm text-zinc-600 sm:w-64 sm:shrink-0 dark:text-zinc-400">
              {label}
            </dt>
            <dd className={value === null ? "text-zinc-500 italic" : ""}>
              {value ?? t("notDefined")}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
