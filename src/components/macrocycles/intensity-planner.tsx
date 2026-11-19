"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Curve } from "@/domain/macrocycles/calculation";
import type {
  Macrocycle,
  WeekLevel,
} from "@/domain/macrocycles/macrocycle-types";
import { baseIntensity, intensityAt } from "./chart-geometry";
import { MacrocycleChart, type ChartWeek } from "./macrocycle-chart";

/**
 * Planning steps 3 and 4 on the macrocycle chart: the progression curve
 * ("curve") and the week levels and block borders ("weeks"), each change
 * saved.
 */
export function IntensityPlanner({
  mode,
  macrocycle,
  onSaved,
  onContinue,
  onBack,
}: {
  /** Step 3 shapes the curve, step 4 sets high/low weeks and borders. */
  mode: "curve" | "weeks";
  macrocycle: Macrocycle;
  /** The macrocycle as stored after each change. */
  onSaved: (macrocycle: Macrocycle) => void;
  /** "Continue to weeks" (step 3) or "Continue to exercises" (step 4). */
  onContinue: () => void;
  /** "Back to SWOT" (step 3) or "Back to curve" (step 4). */
  onBack: () => void;
}) {
  const t = useTranslations("Macrocycle.intensity");
  const [weeks, setWeeks] = useState<ChartWeek[]>(macrocycle.weeks);
  const [mesocycles, setMesocycles] = useState(macrocycle.mesocycles);
  const [failed, setFailed] = useState(false);
  const [curve, setCurve] = useState<Curve>(macrocycle.curve);

  async function changeCurve(next: Curve) {
    const previous = curve;
    setFailed(false);
    // Optimistic update; the server's answer replaces it.
    setCurve(next);
    const response = await fetch(
      `/api/athletes/${macrocycle.athleteId}/macrocycle/curve`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          entryValuePct: next.entryPct,
          entryT: next.entryT ?? 0,
          anchors: next.anchors,
          endValuePct: next.endPct ?? 100,
          endT: next.endT ?? 1,
        }),
      },
    ).catch(() => null);
    if (response?.ok) {
      const saved = (await response.json()) as Macrocycle;
      setCurve(saved.curve);
      setWeeks(saved.weeks);
      onSaved(saved);
    } else {
      setCurve(previous);
      setFailed(true);
    }
  }

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
      onSaved(saved);
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
      onSaved(saved);
    } else {
      setMesocycles(previous);
      setFailed(true);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-zinc-600 dark:text-zinc-400">
        {mode === "curve" ? t("helpCurve") : t("help")}
      </p>
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
        curveEditor={
          mode === "curve" ? { curve, onChange: changeCurve } : undefined
        }
        competition={{
          date: macrocycle.competitionDate,
          type: macrocycle.competitionType,
        }}
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex min-h-11 items-center rounded-full bg-zinc-900 px-6 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {mode === "curve" ? t("continueToWeeks") : t("continue")}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center rounded-full px-4 font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          {mode === "curve" ? t("back") : t("backToCurve")}
        </button>
      </div>
    </div>
  );
}
