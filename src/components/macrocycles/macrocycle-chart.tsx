"use client";

import { useFormatter, useTranslations } from "next-intl";
import type {
  MacrocycleWeekView,
  MesocycleView,
  WeekLevel,
} from "@/domain/macrocycles/macrocycle-types";
import { baseIntensity, intensityDomain } from "./chart-geometry";
import { useWeekDate, WeekChart, type CurveEditor } from "./week-chart";

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
  /**
   * Curve mode: the progression curve with its anchors instead of week
   * handles and border sliders.
   */
  curveEditor?: Omit<CurveEditor, "labels">;
};

/** Curve mode spans every allowed anchor value (0–100 %) plus high weeks. */
const CURVE_DOMAIN = {
  min: 0,
  max: 110,
  ticks: Array.from({ length: 12 }, (_, i) => i * 10),
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
  curveEditor,
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
      domain={curveEditor ? CURVE_DOMAIN : intensityDomain(bases)}
      caption={t("intensity")}
      series="intensity"
      competition={competition}
      plotHeight={220}
      yAxis={{ formatTick: pct, title: t("axisIntensity") }}
      xAxisTitle={t("axisWeek")}
      legendExtra={[{ symbol: "▲▼", text: t("legendLevels") }]}
      handles={
        onLevelChange && !curveEditor
          ? { bases, levels, onChange: onLevelChange }
          : undefined
      }
      onBordersChange={curveEditor ? undefined : onBordersChange}
      curveEditor={
        curveEditor && {
          ...curveEditor,
          labels: {
            entry: (value) => t("anchorEntry", { value: pct(value) }),
            anchor: (week, value) =>
              t("anchor", { week: format.number(week), value: pct(value) }),
            end: (value) => t("anchorEnd", { value: pct(value) }),
          },
        }
      }
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
