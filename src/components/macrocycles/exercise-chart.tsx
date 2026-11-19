"use client";

import { useFormatter, useTranslations } from "next-intl";
import type {
  ExerciseWeek,
  MacrocycleWeekView,
} from "@/domain/macrocycles/macrocycle-types";
import type { ChartMesocycle } from "./chart-frame";
import { niceDomain } from "./chart-geometry";
import { useWeekDate, WeekChart } from "./week-chart";

/** The planned values the chart can draw, with their unit. */
export const VALUES = [
  { key: "bestKg", unit: "kg" },
  { key: "averageKg", unit: "kg" },
  { key: "setSize", unit: "reps" },
  { key: "weeklyReps", unit: "reps" },
] as const;
export type ValueKey = (typeof VALUES)[number]["key"];

type Props = {
  /** The macrocycle's weeks (dates and mesocycles). */
  weeks: Pick<MacrocycleWeekView, "number" | "startDate" | "mesocycle">[];
  mesocycles: ChartMesocycle[];
  /** The chosen exercise's planned values, one entry per week. */
  values: ExerciseWeek[];
  /** The value drawn as the curve. */
  value: ValueKey;
  competition?: { date: string; type: string };
  /** Today (YYYY-MM-DD) for the current-week line. */
  today: string;
  /** While another exercise loads, the curve is dimmed. */
  dimmed?: boolean;
};

/**
 * Read-only chart of one planned value of one exercise for every week
 * (athlete page and macrocycle view): the week chart without a y-axis,
 * with the current week.
 */
export function ExerciseChart({
  weeks,
  mesocycles,
  values,
  value,
  competition,
  today,
  dimmed = false,
}: Props) {
  const t = useTranslations("MacrocycleView.chart");
  const tm = useTranslations("Macrocycle.mesocycles");
  const format = useFormatter();
  const weekDate = useWeekDate();
  const unit = VALUES.find((v) => v.key === value)!.unit;
  const byWeek = new Map(values.map((v) => [v.number, v[value]]));
  const perWeek = weeks.map((w) => byWeek.get(w.number) ?? null);
  const domain = niceDomain(
    perWeek.filter((v): v is number => v !== null),
    { fromZero: unit === "reps" },
  );
  const valueText = (v: number | null) =>
    v === null
      ? t("none")
      : unit === "kg"
        ? t("kg", { value: format.number(v) })
        : format.number(v);

  return (
    <WeekChart
      weeks={weeks}
      mesocycles={mesocycles}
      values={perWeek}
      domain={domain}
      caption={t("caption", { value: t(`series.${value}`) })}
      series={value}
      competition={competition}
      today={today}
      dimmed={dimmed}
      tooltip={(week, v) => [
        t(`tooltip.${value}`, { value: valueText(v) }),
        t("tooltipWeek", { week: week.number, date: weekDate(week.startDate) }),
        tm(`abbr.${week.mesocycle}`),
      ]}
    />
  );
}
