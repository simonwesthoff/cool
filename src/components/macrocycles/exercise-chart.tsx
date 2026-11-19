"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useId, useState } from "react";
import type {
  ExerciseWeek,
  MacrocycleWeekView,
} from "@/domain/macrocycles/macrocycle-types";
import {
  CompetitionMarkerLine,
  CompetitionSwatch,
  MesocycleStarts,
  tooltipPlacement,
  useCompetitionMarker,
  useContainerWidth,
  weekLabelShown,
  weekLayout,
  type ChartMesocycle,
} from "./chart-frame";
import { currentWeekIndex, niceDomain, smoothPath } from "./chart-geometry";

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

const PLOT = { top: 28, height: 240 };
/** Space below the plot for the week numbers. */
const X_AXIS = 28;
const TOOLTIP = { width: 208, height: 84, gap: 10 };

/**
 * Read-only chart of one planned value of one exercise for every week:
 * one smooth pink curve with a gradient fading downwards, a thin line where
 * each mesocycle starts, and no y-axis (minimal, user decision).
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
  const titleId = useId();
  const { container, width } = useContainerWidth();
  const [hovered, setHovered] = useState<number | null>(null);

  const n = weeks.length;
  const layout = weekLayout(width, n, 0, { yAxis: false });
  const { x, column } = layout;
  const gradientId = useId();
  const height = PLOT.top + PLOT.height + X_AXIS;
  const unit = VALUES.find((v) => v.key === value)!.unit;
  const byWeek = new Map(values.map((v) => [v.number, v[value]]));
  const valueOf = (week: number) => byWeek.get(week) ?? null;

  const domain = niceDomain(
    weeks.map((w) => valueOf(w.number)).filter((v): v is number => v !== null),
    { fromZero: unit === "reps" },
  );
  const y = (v: number) =>
    PLOT.top + PLOT.height * (1 - (v - domain.min) / (domain.max - domain.min));

  // The dot on the hovered week (there are no point handles otherwise).
  const radius = Math.min(4.5, Math.max(3, column * 0.3));
  const showWeekLabel = weekLabelShown(mesocycles, layout.every);
  const marker = useCompetitionMarker(
    competition,
    weeks[0]?.startDate,
    n,
    layout,
  );
  const current = weeks[0]
    ? currentWeekIndex(weeks[0].startDate, n, today)
    : null;

  // The curve, broken where a week has no value: one run per stretch.
  const runs: { x: number; y: number }[][] = [];
  let run: { x: number; y: number }[] | null = null;
  weeks.forEach((w, i) => {
    const v = valueOf(w.number);
    if (v === null) {
      run = null;
      return;
    }
    if (!run) runs.push((run = []));
    run.push({ x: x(i), y: y(v) });
  });
  const path = runs.map(smoothPath).join(" ");
  // The area below each run, down to the bottom of the plot.
  const bottom = PLOT.top + PLOT.height;
  const area = runs
    .filter((r) => r.length > 1)
    .map(
      (r) =>
        `${smoothPath(r)} L${r.at(-1)!.x.toFixed(1)},${bottom} L${r[0]!.x.toFixed(1)},${bottom} Z`,
    )
    .join(" ");

  const valueText = (v: number | null) =>
    v === null
      ? t("none")
      : unit === "kg"
        ? t("kg", { value: format.number(v) })
        : format.number(v);

  const shown =
    hovered === null ? null : weeks.find((w) => w.number === hovered);
  const shownIndex = shown ? weeks.indexOf(shown) : -1;
  const shownValue = shown ? valueOf(shown.number) : null;
  const tooltipPosition = shown
    ? tooltipPlacement(
        x(shownIndex),
        shownValue === null ? PLOT.top : y(shownValue),
        layout,
        PLOT,
        TOOLTIP,
      )
    : null;
  const caption = t("caption", { value: t(`series.${value}`) });

  return (
    <figure className="flex flex-col gap-3" aria-labelledby={titleId}>
      <figcaption id={titleId} className="sr-only">
        {caption}
      </figcaption>
      {/* Legend hidden for now (user decision); screen readers keep it. */}
      <ul className="sr-only" aria-label={t("legend")}>
        {mesocycles.map((m) => (
          <li key={m.type}>{tm(m.type)}</li>
        ))}
        {marker && (
          <li className="flex items-center gap-2">
            <CompetitionSwatch />
            {t("competition")}
          </li>
        )}
        {current !== null && (
          <li className="flex items-center gap-2">
            <svg aria-hidden="true" width="12" height="14" className="shrink-0">
              <line
                x1="6"
                x2="6"
                y1="0"
                y2="14"
                stroke="var(--chart-ink)"
                strokeWidth={2}
              />
            </svg>
            {t("currentWeek")}
          </li>
        )}
      </ul>
      <div
        ref={container}
        className="relative w-full"
        onPointerLeave={() => setHovered(null)}
      >
        <svg
          width={width}
          height={height}
          role="group"
          aria-label={caption}
          className="block select-none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="0"
                stopColor="var(--chart-curve)"
                stopOpacity={0.3}
              />
              <stop offset="1" stopColor="var(--chart-curve)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <MesocycleStarts
            mesocycles={mesocycles}
            layout={layout}
            plot={PLOT}
            marker={marker}
          />
          <line
            data-baseline
            x1={layout.plotLeft}
            x2={layout.plotRight - column}
            y1={bottom}
            y2={bottom}
            stroke="var(--chart-ink)"
            strokeOpacity={0.25}
          />
          {weeks.map(
            (w, i) =>
              showWeekLabel(w.number) && (
                <text
                  key={w.number}
                  x={x(i)}
                  y={PLOT.top + PLOT.height + 18}
                  textAnchor="middle"
                  className="fill-zinc-500 text-[11px] tabular-nums"
                >
                  {w.number}
                </text>
              ),
          )}
          {marker && <CompetitionMarkerLine marker={marker} plot={PLOT} />}
          {current !== null && (
            <line
              data-current-week={weeks[current]!.number}
              x1={x(current)}
              x2={x(current)}
              y1={PLOT.top}
              y2={PLOT.top + PLOT.height}
              stroke="var(--chart-ink)"
              strokeWidth={2}
              className="pointer-events-none"
            />
          )}
          {/* One pink stroke, no point handles; the gradient fades downwards. */}
          <g data-curve={value} opacity={dimmed ? 0.35 : 1}>
            <path data-area d={area} fill={`url(#${gradientId})`} />
            <path
              data-line
              d={path}
              fill="none"
              stroke="var(--chart-curve)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {weeks.map((w, i) => {
              const v = valueOf(w.number);
              if (v === null) return null;
              return (
                <g key={w.number} data-point={w.number} data-value={v}>
                  {hovered === w.number && (
                    <circle
                      cx={x(i)}
                      cy={y(v)}
                      r={radius}
                      fill="var(--chart-curve)"
                      stroke="var(--surface)"
                      strokeWidth={2}
                    />
                  )}
                </g>
              );
            })}
          </g>
          {weeks.map((w, i) => (
            <rect
              key={w.number}
              data-week={w.number}
              x={x(i) - column / 2}
              y={PLOT.top}
              width={column}
              height={PLOT.height}
              fill="transparent"
              onPointerEnter={() => setHovered(w.number)}
            />
          ))}
          {shown && (
            <line
              x1={x(shownIndex)}
              x2={x(shownIndex)}
              y1={PLOT.top}
              y2={PLOT.top + PLOT.height}
              className="pointer-events-none"
              stroke="var(--chart-ink)"
              strokeOpacity={0.5}
              strokeWidth={1}
            />
          )}
        </svg>
        {shown && tooltipPosition && (
          <div
            role="status"
            data-testid="exercise-tooltip"
            className="pointer-events-none absolute z-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-md dark:border-zinc-800 dark:bg-zinc-950"
            style={{
              left: tooltipPosition.left,
              top: tooltipPosition.top,
              width: TOOLTIP.width,
              minHeight: TOOLTIP.height,
            }}
          >
            <p className="font-semibold tabular-nums">
              {t(`tooltip.${value}`, { value: valueText(shownValue) })}
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              {t("tooltipWeek", {
                week: shown.number,
                date: format.dateTime(
                  new Date(`${shown.startDate}T00:00:00Z`),
                  {
                    dateStyle: "medium",
                    timeZone: "UTC",
                  },
                ),
              })}
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              {tm(`abbr.${shown.mesocycle}`)}
            </p>
          </div>
        )}
      </div>
    </figure>
  );
}
