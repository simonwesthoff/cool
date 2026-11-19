"use client";

import { useFormatter, useTranslations } from "next-intl";
import type {
  MacrocycleWeekView,
  MesocycleView,
  WeekLevel,
} from "@/domain/macrocycles/macrocycle-types";
import { baseIntensity, intensityDomain } from "./chart-geometry";
import { useWeekDate, WeekChart } from "./week-chart";

export type ChartWeek = Pick<
  MacrocycleWeekView,
  "number" | "startDate" | "mesocycle" | "level" | "intensityPct" | "volume"
>;

type Props = {
  weeks: ChartWeek[];
  mesocycles: Pick<MesocycleView, "type" | "firstWeek" | "lastWeek">[];
  /** When set, the week handles can be moved (planning step 2). */
  onLevelChange?: (week: number, level: WeekLevel) => void;
  /** When set, the two mesocycle borders can be moved (planning step 2). */
  onBordersChange?: (specialStart: number, competitionStart: number) => void;
  /** The main competition, marked with a vertical line and its name. */
  competition?: { date: string; type: string };
};

/**
 * The planning chart: the week chart of the intensity per week with the
 * y-axis, axis titles, the legend, a handle per week and the sliders of
 * the mesocycle borders.
 */
export function MacrocycleChart({
  weeks,
  mesocycles,
  onLevelChange,
  onBordersChange,
  competition,
}: Props) {
  const t = useTranslations("Macrocycle.chart");
  const tm = useTranslations("Macrocycle.mesocycles");
  const format = useFormatter();
  const weekDate = useWeekDate();
  const bases = weeks.map((w) => baseIntensity(w.intensityPct, w.level));
  const levels = weeks.map((w) => w.level);
  const pct = (value: number) =>
    format.number(value / 100, { style: "percent", maximumFractionDigits: 1 });
  const levelAt =
    (week: number) =>
    // The level shown follows the value while a handle is dragged.
    (value: number) => {
      const i = weeks.findIndex((w) => w.number === week);
      const diff = value - bases[i]!;
      return diff > 0.01 ? "high" : diff < -0.01 ? "low" : "medium";
    };

  return (
    <WeekChart
      weeks={weeks}
      mesocycles={mesocycles}
      values={weeks.map((w) => w.intensityPct)}
      domain={intensityDomain(bases)}
      caption={t("intensity")}
      series="intensity"
      competition={competition}
      plotHeight={220}
      yAxis={{ formatTick: pct, title: t("axisIntensity") }}
      xAxisTitle={t("axisWeek")}
      legendExtra={[{ symbol: "▲▼", text: t("legendLevels") }]}
      handles={
        onLevelChange ? { bases, levels, onChange: onLevelChange } : undefined
      }
      onBordersChange={onBordersChange}
      pointLabel={(week, value) =>
        t("weekValue", {
          week: week.number,
          level: t(`levels.${levelAt(week.number)(value!)}`),
          intensity: pct(value!),
        })
      }
      tooltip={(week, value) => [
        t("tooltipValue", {
          intensity: pct(value!),
          level: t(`levelsShort.${levelAt(week.number)(value!)}`),
        }),
        t("tooltipWeek", {
          week: week.number,
          date: weekDate(week.startDate),
        }),
        tm(`abbr.${week.mesocycle}`),
      ]}
    />
  );
}
