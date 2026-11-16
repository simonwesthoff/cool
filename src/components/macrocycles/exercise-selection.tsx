"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import {
  localized,
  type ExerciseGroup,
} from "@/domain/exercises/catalog-types";
import type {
  Macrocycle,
  MesocycleType,
} from "@/domain/macrocycles/macrocycle-types";

type Props = { macrocycle: Macrocycle; catalog: ExerciseGroup[] };

/** Planning step 3: exercises per mesocycle, saved with every change. */
export function ExerciseSelection({ macrocycle, catalog }: Props) {
  const t = useTranslations("Macrocycle.exercises");
  const tm = useTranslations("Macrocycle.mesocycles");
  const locale = useLocale();
  const [active, setActive] = useState<MesocycleType>("general_preparation");
  const [chosen, setChosen] = useState<Record<MesocycleType, number[]>>(
    () =>
      Object.fromEntries(
        macrocycle.mesocycles.map((m) => [m.type, m.exerciseNumbers]),
      ) as Record<MesocycleType, number[]>,
  );
  const [failed, setFailed] = useState(false);

  async function toggle(number: number) {
    const previous = chosen[active];
    const next = previous.includes(number)
      ? previous.filter((n) => n !== number)
      : [...previous, number].sort((a, b) => a - b);
    setFailed(false);
    setChosen((current) => ({ ...current, [active]: next }));
    const response = await fetch(
      `/api/athletes/${macrocycle.athleteId}/macrocycle/mesocycles/${active}/exercises`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ exerciseNumbers: next }),
      },
    ).catch(() => null);
    if (!response?.ok) {
      setChosen((current) => ({ ...current, [active]: previous }));
      setFailed(true);
    }
  }

  const mesocycle = macrocycle.mesocycles.find((m) => m.type === active)!;
  const base = `/athletes/${macrocycle.athleteId}`;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-zinc-600 dark:text-zinc-400">{t("help")}</p>
      <div
        role="tablist"
        aria-label={t("tabsLabel")}
        className="flex flex-wrap gap-2"
      >
        {macrocycle.mesocycles.map((m) => (
          <button
            key={m.type}
            role="tab"
            type="button"
            aria-selected={m.type === active}
            onClick={() => setActive(m.type)}
            className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium ${
              m.type === active
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            }`}
          >
            {t("tab", {
              name: tm(`short.${m.type}`),
              count: chosen[m.type].length,
            })}
          </button>
        ))}
      </div>
      <section
        role="tabpanel"
        aria-label={tm(active)}
        className="flex flex-col gap-6"
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t("weeks", {
            name: tm(active),
            first: mesocycle.firstWeek,
            last: mesocycle.lastWeek,
          })}
        </p>
        {failed && (
          <p
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
          >
            {t("saveFailed")}
          </p>
        )}
        {catalog.map((group) => (
          <fieldset key={group.number} className="flex flex-col gap-1">
            <legend className="mb-1 font-semibold">
              {group.code}
              {" · "}
              {localized(group.name, locale)}
            </legend>
            {group.exercises.map((exercise) => {
              const checked = chosen[active].includes(exercise.number);
              return (
                <label
                  key={exercise.number}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(exercise.number)}
                    className="size-5 accent-zinc-900 dark:accent-zinc-100"
                  />
                  <span className="w-7 text-sm text-zinc-500 tabular-nums">
                    {exercise.number}
                  </span>
                  <span>{localized(exercise.name, locale)}</span>
                </label>
              );
            })}
          </fieldset>
        ))}
      </section>
      <div className="flex flex-wrap gap-3">
        <Link
          href={base}
          className="inline-flex min-h-11 items-center rounded-full bg-zinc-900 px-6 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {t("finish")}
        </Link>
        <Link
          href={`${base}/macrocycle/intensity`}
          className="inline-flex min-h-11 items-center rounded-full px-4 font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          {t("back")}
        </Link>
      </div>
    </div>
  );
}
