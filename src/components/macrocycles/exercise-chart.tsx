"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useId, useState } from "react";
import type {
  ExerciseWeek,
  MacrocycleWeekView,
} from "@/domain/macrocycles/macrocycle-types";
import {
  BandSwatch,
  CompetitionMarkerLine,
  CompetitionSwatch,
  MesocycleBands,
  tooltipPlacement,
  useCompetitionMarker,
  useContainerWidth,
  weekLabelShown,
  weekLayout,
  type ChartMesocycle,
} from "./chart-frame";
import { currentWeekIndex, niceDomain } from "./chart-geometry";

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
 * Read-only chart of one planned value of one exercise for every week, as
 * a single curve on one y-axis over the mesocycle bands (macrocycle view).
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
  const layout = weekLayout(width, n);
  const { x, plotLeft, plotRight, column } = layout;
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

  // Points shrink with narrow columns, so many weeks still fit side by side.
  const radius = Math.min(4.5, Math.max(2.5, column * 0.3));
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

  // The curve, broken where a week has no value.
  let path = "";
  let open = false;
  weeks.forEach((w, i) => {
    const v = valueOf(w.number);
    if (v === null) {
      open = false;
      return;
    }
    path += `${open ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)} `;
    open = true;
  });
  path = path.trim();

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
      <ul
        className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400"
        aria-label={t("legend")}
      >
        {mesocycles.map((m, i) => (
          <li key={m.type} className="flex items-center gap-2">
            <BandSwatch index={i} />
            {tm(m.type)}
          </li>
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
          <MesocycleBands
            mesocycles={mesocycles}
            layout={layout}
            plot={PLOT}
            marker={marker}
          />
          {domain.ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={plotLeft}
                x2={plotRight}
                y1={y(tick)}
                y2={y(tick)}
                stroke="var(--chart-ink)"
                strokeOpacity={0.12}
              />
              <text
                data-axis
                x={plotLeft - 6}
                y={y(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-zinc-500 text-[11px] tabular-nums"
              >
                {format.number(tick)}
              </text>
            </g>
          ))}
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
          {/* White curve with a dark halo, readable on every band colour. */}
          <g data-curve={value} opacity={dimmed ? 0.35 : 1}>
            <path
              d={path}
              fill="none"
              stroke="var(--chart-halo)"
              strokeOpacity={0.85}
              strokeWidth={5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              data-line
              d={path}
              fill="none"
              className="stroke-white"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {weeks.map((w, i) => {
              const v = valueOf(w.number);
              if (v === null) return null;
              const active = hovered === w.number;
              return (
                <g key={w.number} data-point={w.number} data-value={v}>
                  <circle
                    cx={x(i)}
                    cy={y(v)}
                    r={(active ? radius + 1.5 : radius) + 2.5}
                    fill="var(--chart-halo)"
                  />
                  <circle
                    cx={x(i)}
                    cy={y(v)}
                    r={active ? radius + 1.5 : radius}
                    className="fill-white"
                  />
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
