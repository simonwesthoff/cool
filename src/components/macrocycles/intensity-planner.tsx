"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import type {
  Macrocycle,
  WeekLevel,
} from "@/domain/macrocycles/macrocycle-types";
import { baseIntensity, intensityAt } from "./chart-geometry";
import { MacrocycleChart, type ChartWeek } from "./macrocycle-chart";

/** Planning step 2: week levels on the macrocycle chart, saved per change. */
export function IntensityPlanner({ macrocycle }: { macrocycle: Macrocycle }) {
  const t = useTranslations("Macrocycle.intensity");
  const [weeks, setWeeks] = useState<ChartWeek[]>(macrocycle.weeks);
  const [mesocycles, setMesocycles] = useState(macrocycle.mesocycles);
  const [failed, setFailed] = useState(false);

  async function changeLevel(week: number, level: WeekLevel) {
    const previous = weeks;
    setFailed(false);
    // Optimistic update; the server's answer replaces it.
    setWeeks((current) =>
      current.map((w) =>
        w.number === week
          ? {
              ...w,
              level,
              intensityPct: intensityAt(
                baseIntensity(w.intensityPct, w.level),
                level,
              ),
            }
          : w,
      ),
    );
    const response = await fetch(
      `/api/athletes/${macrocycle.athleteId}/macrocycle/weeks/${week}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ level }),
      },
    ).catch(() => null);
    if (response?.ok) {
      const saved = (await response.json()) as Macrocycle;
      setWeeks(saved.weeks);
    } else {
      setWeeks(previous);
      setFailed(true);
    }
  }

  async function changeBorders(specialStart: number, competitionStart: number) {
    const previous = mesocycles;
    setFailed(false);
    setMesocycles((current) => [
      { ...current[0]!, firstWeek: 1, lastWeek: specialStart - 1 },
      {
        ...current[1]!,
        firstWeek: specialStart,
        lastWeek: competitionStart - 1,
      },
      { ...current[2]!, firstWeek: competitionStart },
    ]);
    const response = await fetch(
      `/api/athletes/${macrocycle.athleteId}/macrocycle/mesocycles/borders`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          specialPreparationStart: specialStart,
          competitionPreparationStart: competitionStart,
        }),
      },
    ).catch(() => null);
    if (response?.ok) {
      const saved = (await response.json()) as Macrocycle;
      setMesocycles(saved.mesocycles);
      setWeeks(saved.weeks);
    } else {
      setMesocycles(previous);
      setFailed(true);
    }
  }

  const base = `/athletes/${macrocycle.athleteId}/macrocycle`;
  return (
    <div className="flex flex-col gap-6">
      <p className="text-zinc-600 dark:text-zinc-400">{t("help")}</p>
      {failed && (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
        >
          {t("saveFailed")}
        </p>
      )}
      <MacrocycleChart
        weeks={weeks}
        mesocycles={mesocycles}
        onLevelChange={changeLevel}
        onBordersChange={changeBorders}
      />
      <div className="flex flex-wrap gap-3">
        <Link
          href={`${base}/exercises`}
          className="inline-flex min-h-11 items-center rounded-full bg-zinc-900 px-6 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {t("continue")}
        </Link>
        <Link
          href={`${base}/base-data`}
          className="inline-flex min-h-11 items-center rounded-full px-4 font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          {t("back")}
        </Link>
      </div>
    </div>
  );
}
