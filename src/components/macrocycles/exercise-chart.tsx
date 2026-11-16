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

type Props = {
  /** The macrocycle's weeks (dates and mesocycles). */
  weeks: Pick<MacrocycleWeekView, "number" | "startDate" | "mesocycle">[];
  mesocycles: ChartMesocycle[];
  /** The chosen exercise's planned values, one entry per week. */
  values: ExerciseWeek[];
  competition?: { date: string; type: string };
  /** Today (YYYY-MM-DD) for the current-week line. */
  today: string;
  /** While another exercise loads, the curves are dimmed. */
  dimmed?: boolean;
};

type SeriesKey = "bestKg" | "averageKg" | "setSize" | "weeklyReps";
type Shape = "circle" | "square" | "triangle" | "diamond";

/**
 * The four planned values. Colours follow the app-wide association; line
 * style and point shape keep the curves apart without colour (purple and
 * magenta are close for colour-vision deficiencies).
 */
const SERIES: {
  key: SeriesKey;
  axis: "kg" | "reps";
  colour: string;
  dash?: string;
  shape: Shape;
}[] = [
  { key: "bestKg", axis: "kg", colour: "var(--value-best)", shape: "circle" },
  {
    key: "averageKg",
    axis: "kg",
    colour: "var(--value-average)",
    dash: "7 4",
    shape: "square",
  },
  {
    key: "setSize",
    axis: "reps",
    colour: "var(--value-set-size)",
    dash: "1.5 4",
    shape: "triangle",
  },
  {
    key: "weeklyReps",
    axis: "reps",
    colour: "var(--value-weekly-reps)",
    dash: "8 3 1.5 3",
    shape: "diamond",
  },
];

const PLOT = { top: 28, height: 240 };
/** Space below the plot for the week numbers. */
const X_AXIS = 28;
/** Extra room on the right for the reps axis. */
const RIGHT_AXIS = 34;
const TOOLTIP = { width: 208, height: 150, gap: 10 };

function Marker({
  shape,
  x,
  y,
  size,
  fill,
}: {
  shape: Shape;
  x: number;
  y: number;
  size: number;
  fill: string;
}) {
  switch (shape) {
    case "circle":
      return <circle cx={x} cy={y} r={size} fill={fill} />;
    case "square":
      return (
        <rect
          x={x - size * 0.9}
          y={y - size * 0.9}
          width={size * 1.8}
          height={size * 1.8}
          fill={fill}
        />
      );
    case "triangle":
      return (
        <path
          d={`M${x},${y - size * 1.15} L${x + size},${y + size * 0.75} L${x - size},${y + size * 0.75} Z`}
          fill={fill}
        />
      );
    case "diamond":
      return (
        <path
          d={`M${x},${y - size * 1.2} L${x + size},${y} L${x},${y + size * 1.2} L${x - size},${y} Z`}
          fill={fill}
        />
      );
  }
}

/** Legend sample: a short line in the series' style with its point shape. */
function SeriesSwatch({ series }: { series: (typeof SERIES)[number] }) {
  return (
    <svg aria-hidden="true" width="28" height="14" className="shrink-0">
      <line
        x1="1"
        x2="27"
        y1="7"
        y2="7"
        stroke="var(--curve-outline)"
        strokeWidth={4}
        strokeDasharray={series.dash}
      />
      <line
        x1="1"
        x2="27"
        y1="7"
        y2="7"
        stroke={series.colour}
        strokeWidth={2}
        strokeDasharray={series.dash}
      />
      <Marker
        shape={series.shape}
        x={14}
        y={7}
        size={5}
        fill="var(--curve-outline)"
      />
      <Marker
        shape={series.shape}
        x={14}
        y={7}
        size={3.5}
        fill={series.colour}
      />
    </svg>
  );
}

/**
 * Read-only chart of one exercise's planned best value and average weight
 * (kg, left axis) and set size and weekly reps (reps, right axis) for every
 * week, on the grey mesocycle bands (macrocycle view).
 */
export function ExerciseChart({
  weeks,
  mesocycles,
  values,
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
  const layout = weekLayout(width, n, RIGHT_AXIS);
  const { x, plotLeft, plotRight, column } = layout;
  const height = PLOT.top + PLOT.height + X_AXIS;
  const byWeek = new Map(values.map((v) => [v.number, v]));
  const valueOf = (week: number, key: SeriesKey) =>
    byWeek.get(week)?.[key] ?? null;

  const collect = (axis: "kg" | "reps") =>
    weeks.flatMap((w) =>
      SERIES.filter((s) => s.axis === axis)
        .map((s) => valueOf(w.number, s.key))
        .filter((v): v is number => v !== null),
    );
  const kg = niceDomain(collect("kg"));
  const reps = niceDomain(collect("reps"), { fromZero: true });
  const scale = (domain: { min: number; max: number }) => (value: number) =>
    PLOT.top +
    PLOT.height * (1 - (value - domain.min) / (domain.max - domain.min));
  const yOf = { kg: scale(kg), reps: scale(reps) };

  // Points shrink with narrow columns, so many weeks still fit side by side.
  const size = Math.min(4, Math.max(2.5, column * 0.28));
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

  /** Path of one series, broken where a week has no value. */
  const pathOf = (series: (typeof SERIES)[number]) => {
    let d = "";
    let open = false;
    weeks.forEach((w, i) => {
      const v = valueOf(w.number, series.key);
      if (v === null) {
        open = false;
        return;
      }
      d += `${open ? "L" : "M"}${x(i).toFixed(1)},${yOf[series.axis](v).toFixed(1)} `;
      open = true;
    });
    return d.trim();
  };

  const kgText = (v: number | null) =>
    v === null ? t("none") : t("kg", { value: format.number(v) });
  const repsText = (v: number | null) =>
    v === null ? t("none") : format.number(v);
  const valueText: Record<SeriesKey, (v: number | null) => string> = {
    bestKg: kgText,
    averageKg: kgText,
    setSize: repsText,
    weeklyReps: repsText,
  };

  const shown =
    hovered === null ? null : weeks.find((w) => w.number === hovered);
  const shownIndex = shown ? weeks.indexOf(shown) : -1;
  const tooltipPosition = shown
    ? tooltipPlacement(
        x(shownIndex),
        // The tooltip goes to the half without most of the curves.
        PLOT.top + PLOT.height / 4,
        layout,
        PLOT,
        TOOLTIP,
      )
    : null;

  return (
    <figure className="flex flex-col gap-3" aria-labelledby={titleId}>
      <figcaption id={titleId} className="sr-only">
        {t("caption")}
      </figcaption>
      <ul
        className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400"
        aria-label={t("legend")}
      >
        {SERIES.map((s) => (
          <li
            key={s.key}
            data-series={s.key}
            className="flex items-center gap-2"
          >
            <SeriesSwatch series={s} />
            {t(`series.${s.key}`)}
          </li>
        ))}
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
          aria-label={t("caption")}
          className="block select-none"
        >
          <MesocycleBands
            mesocycles={mesocycles}
            layout={layout}
            plot={PLOT}
            marker={marker}
          />
          {kg.ticks.map((tick) => (
            <g key={`kg-${tick}`}>
              <line
                x1={plotLeft}
                x2={plotRight}
                y1={yOf.kg(tick)}
                y2={yOf.kg(tick)}
                stroke="var(--chart-ink)"
                strokeOpacity={0.12}
              />
              <text
                data-axis="kg"
                x={plotLeft - 6}
                y={yOf.kg(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-zinc-500 text-[11px] tabular-nums"
              >
                {format.number(tick)}
              </text>
            </g>
          ))}
          {reps.ticks.map((tick) => (
            <text
              key={`reps-${tick}`}
              data-axis="reps"
              x={plotRight + 6}
              y={yOf.reps(tick)}
              dominantBaseline="middle"
              className="fill-zinc-500 text-[11px] tabular-nums"
            >
              {format.number(tick)}
            </text>
          ))}
          {/* Axis titles with their units. */}
          <text
            transform={`translate(12 ${PLOT.top + PLOT.height / 2}) rotate(-90)`}
            textAnchor="middle"
            className="fill-zinc-600 text-[11px] dark:fill-zinc-400"
          >
            {t("axisKg")}
          </text>
          <text
            transform={`translate(${width - 8} ${PLOT.top + PLOT.height / 2}) rotate(90)`}
            textAnchor="middle"
            className="fill-zinc-600 text-[11px] dark:fill-zinc-400"
          >
            {t("axisReps")}
          </text>
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
          <g opacity={dimmed ? 0.35 : 1}>
            {SERIES.map((s) => (
              <g key={s.key} data-curve={s.key}>
                {/* Outline in the surface's opposite keeps every colour readable on every grey. */}
                <path
                  d={pathOf(s)}
                  fill="none"
                  stroke="var(--curve-outline)"
                  strokeWidth={3.5}
                  strokeDasharray={s.dash}
                  strokeLinejoin="round"
                />
                <path
                  data-line
                  d={pathOf(s)}
                  fill="none"
                  stroke={s.colour}
                  strokeWidth={2}
                  strokeDasharray={s.dash}
                  strokeLinejoin="round"
                />
                {weeks.map((w, i) => {
                  const v = valueOf(w.number, s.key);
                  if (v === null) return null;
                  const py = yOf[s.axis](v);
                  return (
                    <g key={w.number} data-point={w.number} data-value={v}>
                      <Marker
                        shape={s.shape}
                        x={x(i)}
                        y={py}
                        size={size + 1.5}
                        fill="var(--curve-outline)"
                      />
                      <Marker
                        shape={s.shape}
                        x={x(i)}
                        y={py}
                        size={size}
                        fill={s.colour}
                      />
                    </g>
                  );
                })}
              </g>
            ))}
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
            }}
          >
            <p className="font-semibold">
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
            {SERIES.map((s) => (
              <p key={s.key} className="flex items-center gap-2 tabular-nums">
                <SeriesSwatch series={s} />
                {t(`tooltip.${s.key}`, {
                  value: valueText[s.key](valueOf(shown.number, s.key)),
                })}
              </p>
            ))}
          </div>
        )}
      </div>
    </figure>
  );
}
