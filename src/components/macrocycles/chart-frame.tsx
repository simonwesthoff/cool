"use client";

/**
 * Parts of the week chart: width fitting, week layout, mesocycle start
 * lines with labels, the main competition marker, week numbers and tooltip
 * placement.
 */
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import type { MesocycleView } from "@/domain/macrocycles/macrocycle-types";
import { fitsLabel, labelEvery } from "./chart-geometry";

/** Estimated width of one character of an 11 px label. */
export const LABEL_CHAR = 6.2;
/** Width used before the container has been measured. */
const DEFAULT_WIDTH = 640;

export type Plot = { top: number; height: number };
export type ChartMesocycle = Pick<
  MesocycleView,
  "type" | "firstWeek" | "lastWeek"
>;

/** Measures the width of the chart's container. */
export function useContainerWidth() {
  const container = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(0);
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setAvailable(entry!.contentRect.width),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { container, width: available || DEFAULT_WIDTH };
}

export type WeekLayout = {
  width: number;
  margin: { left: number; right: number };
  /** Width of one week. */
  column: number;
  /** x of the week with the given index: the start of its column. */
  x: (index: number) => number;
  plotLeft: number;
  plotRight: number;
  /** Every how many weeks a number is shown. */
  every: number;
};

/**
 * Weeks across the whole width: the cycle always fits, no scrolling. The
 * plot ends at the last week's point, or `tail` weeks later (the main
 * competition within the last week).
 */
export function weekLayout(
  width: number,
  weekCount: number,
  extraRight = 0,
  {
    yAxis = true,
    tail = 0,
  }: {
    /** Without a y-axis the plot starts near the left edge. */
    yAxis?: boolean;
    tail?: number;
  } = {},
): WeekLayout {
  const narrow = width < 500;
  const margin = !yAxis
    ? { left: 12, right: 12 + extraRight }
    : narrow
      ? { left: 44, right: 12 + extraRight }
      : { left: 56, right: 16 + extraRight };
  const span = Math.max(weekCount - 1 + tail, 1);
  const column = (width - margin.left - margin.right) / span;
  const x = (index: number) => margin.left + column * index;
  return {
    width,
    margin,
    column,
    x,
    plotLeft: margin.left,
    plotRight: margin.left + column * Math.max(weekCount - 1 + tail, 0),
    every: labelEvery(column),
  };
}

/**
 * How far (in weeks, 0 to 1) the main competition lies after the start of
 * the last week: the chart continues to it. 0 without a competition or
 * when it is before the last week.
 */
export function competitionTail(
  date: string | undefined,
  startDate: string | undefined,
  weekCount: number,
): number {
  if (!date || !startDate || weekCount === 0) return 0;
  const days =
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) /
    86_400_000;
  if (Number.isNaN(days)) return 0;
  return Math.min(1, Math.max(0, days / 7 - (weekCount - 1)));
}

export type CompetitionMarker = {
  x: number;
  text: string;
  label: string;
  anchor: "start" | "end";
  textX: number;
  extent: [number, number];
};

/**
 * The main competition at its exact day, with its name above the plot that
 * ends at the line in the right half and starts at it in the left half.
 */
export function useCompetitionMarker(
  competition: { date: string; type: string } | undefined,
  startDate: string | undefined,
  weekCount: number,
  layout: WeekLayout,
): CompetitionMarker | null {
  const t = useTranslations("Macrocycle.chart");
  const format = useFormatter();
  if (!competition || !startDate || weekCount === 0) return null;
  const days =
    (Date.parse(`${competition.date}T00:00:00Z`) -
      Date.parse(`${startDate}T00:00:00Z`)) /
    86_400_000;
  if (Number.isNaN(days)) return null;
  const { plotLeft, plotRight, column } = layout;
  const mx = Math.min(plotRight, plotLeft + column * (Math.max(0, days) / 7));
  const date = format.dateTime(new Date(`${competition.date}T00:00:00Z`), {
    dateStyle: "medium",
    timeZone: "UTC",
  });
  // Only the name is written above the chart (user decision).
  const toLeft = mx > plotLeft + (plotRight - plotLeft) / 2;
  const room = toLeft ? mx - 4 - plotLeft : plotRight - mx - 4;
  const maxType = Math.max(4, Math.floor(room / LABEL_CHAR));
  const text =
    competition.type.length > maxType
      ? `${competition.type.slice(0, maxType - 1).trimEnd()}…`
      : competition.type;
  const textX = toLeft ? mx - 4 : mx + 4;
  const textWidth = text.length * LABEL_CHAR;
  return {
    x: mx,
    text,
    label: t("competitionValue", { type: competition.type, date }),
    anchor: toLeft ? "end" : "start",
    textX,
    extent: toLeft ? [textX - textWidth, textX] : [textX, textX + textWidth],
  };
}

/** Mesocycle labels give way to the competition's label. */
export function clearOfMarker(
  marker: CompetitionMarker | null,
  start: number,
  label: string,
) {
  return (
    !marker ||
    start + label.length * LABEL_CHAR + 8 < marker.extent[0] ||
    start > marker.extent[1] + 8
  );
}

/**
 * The first week of every block is always numbered; the other numbers
 * follow the regular spacing and give way when they come too close.
 */
export function weekLabelShown(mesocycles: ChartMesocycle[], every: number) {
  const blockStarts = mesocycles.map((m) => m.firstWeek);
  return (week: number) =>
    blockStarts.includes(week) ||
    ((week - 1) % every === 0 &&
      blockStarts.every((start) => Math.abs(start - week) >= every));
}

/**
 * Tooltip beside the point's column (never over the pointer, which is in
 * that column) and in the vertical half the point is not in.
 */
export function tooltipPlacement(
  px: number,
  py: number,
  layout: WeekLayout,
  plot: Plot,
  tooltip: { width: number; height: number; gap: number },
) {
  const { column, width } = layout;
  const rightOfColumn = px + column / 2 + tooltip.gap;
  const leftOfColumn = px - column / 2 - tooltip.gap - tooltip.width;
  const fitsRight = rightOfColumn + tooltip.width <= width;
  const fitsLeft = leftOfColumn >= 0;
  const preferLeft = px > width / 2;
  let left =
    (preferLeft && fitsLeft) || !fitsRight ? leftOfColumn : rightOfColumn;
  if (left < 0) left = 0;
  const upperHalf = py < plot.top + plot.height / 2;
  const top = upperHalf ? plot.top + plot.height - tooltip.height : plot.top;
  return { left, top };
}

/**
 * A thin vertical line where each mesocycle starts, with its abbreviation
 * above the plot; no colours (minimal exercise chart).
 */
export function MesocycleStarts({
  mesocycles,
  layout,
  plot,
  marker,
}: {
  mesocycles: ChartMesocycle[];
  layout: WeekLayout;
  plot: Plot;
  marker: CompetitionMarker | null;
}) {
  const tm = useTranslations("Macrocycle.mesocycles");
  const { x, column } = layout;
  return (
    <>
      {mesocycles.map((m) => {
        const label = tm(`abbr.${m.type}`);
        const start = x(m.firstWeek - 1);
        const blockWidth = column * (m.lastWeek - m.firstWeek + 1);
        return (
          <g key={m.type} data-block-start={m.firstWeek}>
            <line
              x1={start}
              x2={start}
              y1={plot.top}
              y2={plot.top + plot.height}
              stroke="var(--chart-ink)"
              strokeOpacity={0.25}
              strokeWidth={1}
            />
            {fitsLabel(label, blockWidth) &&
              clearOfMarker(marker, start + 4, label) && (
                <text
                  x={start + 4}
                  y={plot.top - 8}
                  className="fill-zinc-600 text-[11px] dark:fill-zinc-400"
                >
                  {label}
                </text>
              )}
          </g>
        );
      })}
    </>
  );
}

/** Dashed line at the main competition's day with its label above the plot. */
export function CompetitionMarkerLine({
  marker,
  plot,
}: {
  marker: CompetitionMarker;
  plot: Plot;
}) {
  return (
    <g
      data-competition
      role="img"
      aria-label={marker.label}
      className="pointer-events-none"
    >
      <line
        x1={marker.x}
        x2={marker.x}
        y1={plot.top}
        y2={plot.top + plot.height}
        stroke="var(--chart-ink)"
        strokeWidth={2}
        strokeDasharray="5 3"
      />
      <text
        x={marker.textX}
        y={plot.top - 8}
        textAnchor={marker.anchor}
        className="fill-zinc-600 text-[11px] dark:fill-zinc-400"
        aria-hidden="true"
      >
        {marker.text}
      </text>
    </g>
  );
}

/** Legend swatch of the main competition (dashed line). */
export function CompetitionSwatch() {
  return (
    <svg aria-hidden="true" width="12" height="14" className="shrink-0">
      <line
        x1="6"
        x2="6"
        y1="0"
        y2="14"
        className="stroke-zinc-900 dark:stroke-zinc-100"
        strokeWidth={2}
        strokeDasharray="3 2"
      />
    </svg>
  );
}
