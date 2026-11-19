"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useId, useState, type PointerEvent } from "react";
import type {
  MacrocycleWeekView,
  WeekLevel,
} from "@/domain/macrocycles/macrocycle-types";
import {
  CompetitionMarkerLine,
  CompetitionSwatch,
  competitionTail,
  MesocycleStarts,
  tooltipPlacement,
  useCompetitionMarker,
  useContainerWidth,
  weekLabelShown,
  weekLayout,
  type ChartMesocycle,
} from "./chart-frame";
import {
  currentWeekIndex,
  intensityAt,
  levelForValue,
  smoothPath,
  stepLevel,
} from "./chart-geometry";

export type WeekChartWeek = Pick<
  MacrocycleWeekView,
  "number" | "startDate" | "mesocycle"
>;
export type ChartDomain = { min: number; max: number; ticks: number[] };

/** Week handles of the planning: each week's level, dragged up or down. */
export type LevelHandles = {
  /** Intensity of the curve itself per week (without the high/low step). */
  bases: number[];
  levels: WeekLevel[];
  onChange: (week: number, level: WeekLevel) => void;
};

export type WeekChartProps = {
  weeks: WeekChartWeek[];
  mesocycles: ChartMesocycle[];
  /** The drawn value per week (same order as `weeks`); null leaves a gap. */
  values: (number | null)[];
  domain: ChartDomain;
  /** Accessible name of the chart. */
  caption: string;
  /** Marks the curve (`data-curve`), e.g. the chosen value. */
  series?: string;
  competition?: { date: string; type: string };
  /** Today (YYYY-MM-DD): draws the current-week line when set. */
  today?: string;
  /** While other data loads, the curve is dimmed. */
  dimmed?: boolean;
  plotHeight?: number;
  /** Values on the y-axis, formatted by `formatTick`. */
  yAxis?: { formatTick: (value: number) => string; title?: string };
  /** Title below the week numbers. */
  xAxisTitle?: string;
  /** Show the legend on screen (it is always there for screen readers). */
  legendVisible?: boolean;
  /** Extra legend entries before the competition, e.g. "▲▼ High/low week". */
  legendExtra?: { symbol: string; text: string }[];
  /** Lines of the hover tooltip; the first one is bold. */
  tooltip: (week: WeekChartWeek, value: number | null) => string[];
  /** Accessible name of a week's point. */
  pointLabel?: (week: WeekChartWeek, value: number | null) => string;
  /** Draggable week handles (planning). */
  handles?: LevelHandles;
  /** Draggable sliders for the two mesocycle borders (planning). */
  onBordersChange?: (specialStart: number, competitionStart: number) => void;
};

const TOOLTIP = { width: 208, height: 84, gap: 10 };
/** Content width on desktop: the chart's proportions at this width are kept. */
const DESKTOP_WIDTH = 960;
/** Estimated width of one character of a bold 11 px label. */
const BOLD_CHAR = 6.8;

/**
 * The one chart of the app's macrocycle screens: a value per week as one
 * smoothed pink curve with a gradient fading downwards, a thin line where
 * each mesocycle starts, the main competition and week numbers. Parts are
 * switched on by props: the y-axis, axis titles, the legend, the current
 * week, week handles and border sliders. When the main competition falls
 * after the start of the last week, the curve continues to it and the
 * chart ends there.
 */
export function WeekChart({
  weeks,
  mesocycles: savedMesocycles,
  values,
  domain,
  caption,
  series,
  competition,
  today,
  dimmed = false,
  plotHeight = 240,
  yAxis,
  xAxisTitle,
  legendVisible = false,
  legendExtra = [],
  tooltip,
  pointLabel,
  handles,
  onBordersChange,
}: WeekChartProps) {
  const t = useTranslations("Macrocycle.chart");
  const tm = useTranslations("Macrocycle.mesocycles");
  const tv = useTranslations("MacrocycleView.chart");
  const titleId = useId();
  const gradientId = useId();
  const { container, width } = useContainerWidth();
  const [hovered, setHovered] = useState<number | null>(null);
  const [dragging, setDragging] = useState<{
    week: number;
    level: WeekLevel;
    moved: boolean;
  } | null>(null);
  const [borderDrag, setBorderDrag] = useState<{
    border: 0 | 1;
    week: number;
  } | null>(null);

  const n = weeks.length;
  const current =
    today && weeks[0] ? currentWeekIndex(weeks[0].startDate, n, today) : null;
  const tail = competitionTail(competition?.date, weeks[0]?.startDate, n);
  const layout = weekLayout(width, n, 0, { yAxis: Boolean(yAxis), tail });
  const { x, column, margin, plotLeft, plotRight } = layout;
  const marker = useCompetitionMarker(
    competition,
    weeks[0]?.startDate,
    n,
    layout,
  );
  // The competition's name has its own row above the block labels, so they
  // never hide each other. Narrower than the desktop content width, the
  // plot shrinks in height too: the chart keeps its desktop proportions.
  const PLOT = {
    top: marker ? 44 : 28,
    height: plotHeight * Math.min(1, width / DESKTOP_WIDTH),
  };
  const bottom = PLOT.top + PLOT.height;
  // Room below the plot for the week numbers, the "Current" line under the
  // current week's number and the axis title.
  const height =
    bottom + 28 + (current !== null ? 14 : 0) + (xAxisTitle ? 16 : 0);

  // Mesocycles, with a border being dragged moved already.
  const savedBorders: [number, number] = [
    savedMesocycles[1]?.firstWeek ?? 0,
    savedMesocycles[2]?.firstWeek ?? 0,
  ];
  const borders: [number, number] = borderDrag
    ? borderDrag.border === 0
      ? [borderDrag.week, savedBorders[1]]
      : [savedBorders[0], borderDrag.week]
    : savedBorders;
  const mesocycles =
    onBordersChange && savedMesocycles.length === 3
      ? [
          { ...savedMesocycles[0]!, firstWeek: 1, lastWeek: borders[0] - 1 },
          {
            ...savedMesocycles[1]!,
            firstWeek: borders[0],
            lastWeek: borders[1] - 1,
          },
          { ...savedMesocycles[2]!, firstWeek: borders[1], lastWeek: n },
        ]
      : savedMesocycles;

  const y = (v: number) =>
    PLOT.top + PLOT.height * (1 - (v - domain.min) / (domain.max - domain.min));
  const valueAtY = (svgY: number) =>
    domain.min +
    (1 - (svgY - PLOT.top) / PLOT.height) * (domain.max - domain.min);

  const levelOf = (i: number): WeekLevel | undefined =>
    handles
      ? dragging?.week === weeks[i]!.number
        ? dragging.level
        : handles.levels[i]
      : undefined;
  const valueOf = (i: number): number | null =>
    handles && dragging?.week === weeks[i]!.number
      ? intensityAt(handles.bases[i]!, dragging.level)
      : (values[i] ?? null);

  // The curve, broken where a week has no value; it continues to the
  // competition when that falls after the start of the last week.
  const runs: { x: number; y: number }[][] = [];
  let run: { x: number; y: number }[] | null = null;
  weeks.forEach((_, i) => {
    const v = valueOf(i);
    if (v === null) {
      run = null;
      return;
    }
    if (!run) runs.push((run = []));
    run.push({ x: x(i), y: y(v) });
  });
  const lastValue = n > 0 ? valueOf(n - 1) : null;
  if (tail > 0 && lastValue !== null)
    runs.at(-1)!.push({ x: plotRight, y: y(lastValue) });
  const path = runs.map(smoothPath).join(" ");
  const area = runs
    .filter((r) => r.length > 1)
    .map(
      (r) =>
        `${smoothPath(r)} L${r.at(-1)!.x.toFixed(1)},${bottom} L${r[0]!.x.toFixed(1)},${bottom} Z`,
    )
    .join(" ");

  const radius = Math.min(4.5, Math.max(3, column * 0.3));
  const showWeekLabel = weekLabelShown(mesocycles, layout.every);

  function svgPoint(event: PointerEvent<SVGElement>) {
    const svg = event.currentTarget.ownerSVGElement!;
    const rect = svg.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  // --- Week handles: drag up/down, or tap above/below the point -------------
  function onPointerDown(event: PointerEvent<SVGRectElement>, i: number) {
    if (!handles) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragging({
      week: weeks[i]!.number,
      level: handles.levels[i]!,
      moved: false,
    });
  }
  function onPointerMove(event: PointerEvent<SVGRectElement>, i: number) {
    if (!handles || dragging?.week !== weeks[i]!.number) return;
    const level = levelForValue(handles.bases[i]!, valueAtY(svgPoint(event).y));
    if (level !== dragging.level)
      setDragging({ ...dragging, level, moved: true });
  }
  function onPointerUp(event: PointerEvent<SVGRectElement>, i: number) {
    if (!handles || dragging?.week !== weeks[i]!.number) return;
    const saved = handles.levels[i]!;
    let level = dragging.level;
    if (!dragging.moved) {
      // A tap above the week's point moves it one step up, below one down.
      const tapped = valueAtY(svgPoint(event).y);
      level =
        tapped > intensityAt(handles.bases[i]!, saved)
          ? stepLevel(saved, 1)
          : stepLevel(saved, -1);
    }
    setDragging(null);
    if (level !== saved) handles.onChange(weeks[i]!.number, level);
  }

  // --- Mesocycle borders: drag left/right ------------------------------------
  /** Allowed weeks for a border: every block keeps at least one week. */
  function borderRange(border: 0 | 1): [number, number] {
    return border === 0 ? [2, savedBorders[1] - 1] : [savedBorders[0] + 1, n];
  }
  function borderWeekAt(event: PointerEvent<SVGElement>, border: 0 | 1) {
    const [min, max] = borderRange(border);
    const week = Math.round((svgPoint(event).x - margin.left) / column) + 1;
    return Math.min(max, Math.max(min, week));
  }

  // --- Tooltip ---------------------------------------------------------------
  const shownIndex =
    hovered === null ? -1 : weeks.findIndex((w) => w.number === hovered);
  const shown = shownIndex >= 0 ? weeks[shownIndex]! : null;
  const shownValue = shown ? valueOf(shownIndex) : null;
  const tooltipPosition = shown
    ? tooltipPlacement(
        x(shownIndex),
        shownValue === null ? PLOT.top : y(shownValue),
        layout,
        PLOT,
        TOOLTIP,
      )
    : null;
  const tooltipLines = shown ? tooltip(shown, shownValue) : [];

  return (
    <figure className="flex flex-col gap-3" aria-labelledby={titleId}>
      <figcaption id={titleId} className="sr-only">
        {caption}
      </figcaption>
      <ul
        className={
          legendVisible
            ? "flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400"
            : "sr-only"
        }
        aria-label={t("legend")}
      >
        {mesocycles.map((m) => (
          <li key={m.type}>{tm(m.type)}</li>
        ))}
        {legendExtra.map((item) => (
          <li key={item.text} className="flex items-center gap-2">
            <span aria-hidden="true">{item.symbol}</span>
            {item.text}
          </li>
        ))}
        {marker && (
          <li className="flex items-center gap-2">
            <CompetitionSwatch />
            {tv("competition")}
          </li>
        )}
        {current !== null && <li>{tv("currentWeek")}</li>}
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
          className={`block select-none ${handles || onBordersChange ? "touch-none" : ""}`}
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
          />
          {yAxis &&
            domain.ticks
              // Every other value when the plot is too low for all of them.
              .filter(
                (_, i) =>
                  PLOT.height / Math.max(domain.ticks.length - 1, 1) >= 18 ||
                  i % 2 === 0,
              )
              .map((tick) => (
                <text
                  key={tick}
                  data-axis
                  x={plotLeft - 6}
                  y={y(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-zinc-500 text-[11px] tabular-nums"
                >
                  {yAxis.formatTick(tick)}
                </text>
              ))}
          {yAxis?.title && (
            <text
              data-axis-title
              transform={`translate(12 ${PLOT.top + PLOT.height / 2}) rotate(-90)`}
              textAnchor="middle"
              className="fill-zinc-600 text-[11px] dark:fill-zinc-400"
            >
              {yAxis.title}
            </text>
          )}
          <line
            data-baseline
            x1={plotLeft}
            x2={plotRight}
            y1={bottom}
            y2={bottom}
            stroke="var(--chart-ink)"
            strokeOpacity={0.25}
          />
          {weeks.map((w, i) => {
            const isCurrent = i === current;
            // The current week's number is always shown; numbers too close
            // to it give way.
            const shownLabel =
              isCurrent ||
              (showWeekLabel(w.number) &&
                (current === null || Math.abs(i - current) >= layout.every));
            if (!shownLabel) return null;
            const label = tv("current");
            // "Current" stays inside the chart at both ends.
            const half = (label.length * BOLD_CHAR) / 2;
            const anchor =
              x(i) - half < 0
                ? "start"
                : x(i) + half > width
                  ? "end"
                  : "middle";
            return (
              <g key={w.number}>
                <text
                  data-week-label={w.number}
                  data-current={isCurrent || undefined}
                  x={x(i)}
                  y={bottom + 18}
                  textAnchor="middle"
                  className={`text-[11px] tabular-nums ${
                    isCurrent
                      ? "fill-zinc-900 font-bold dark:fill-zinc-100"
                      : "fill-zinc-500"
                  }`}
                >
                  {w.number}
                </text>
                {isCurrent && (
                  <text
                    data-current-label
                    x={
                      anchor === "start"
                        ? Math.max(0, x(i) - 6)
                        : anchor === "end"
                          ? Math.min(width, x(i) + 6)
                          : x(i)
                    }
                    y={bottom + 32}
                    textAnchor={anchor}
                    className="fill-zinc-900 text-[11px] font-bold dark:fill-zinc-100"
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          })}
          {xAxisTitle && (
            <text
              data-axis-title
              x={plotLeft + (plotRight - plotLeft) / 2}
              y={bottom + (current !== null ? 52 : 38)}
              textAnchor="middle"
              className="fill-zinc-600 text-[11px] dark:fill-zinc-400"
            >
              {xAxisTitle}
            </text>
          )}
          {marker && <CompetitionMarkerLine marker={marker} plot={PLOT} />}
          {current !== null && (
            <line
              data-current-week={weeks[current]!.number}
              x1={x(current)}
              x2={x(current)}
              y1={PLOT.top}
              y2={bottom}
              stroke="var(--chart-ink)"
              strokeWidth={2}
              className="pointer-events-none"
            />
          )}
          {/* One pink stroke; the gradient below fades downwards. */}
          <g data-curve={series} opacity={dimmed ? 0.35 : 1}>
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
              const v = valueOf(i);
              if (v === null) return null;
              const level = levelOf(i);
              const active =
                hovered === w.number || dragging?.week === w.number;
              // Only handles have visible points; otherwise just the hovered one.
              const dot = handles || active;
              return (
                <g
                  key={w.number}
                  data-point={w.number}
                  data-value={v}
                  data-level={level}
                  role={pointLabel ? "img" : undefined}
                  aria-label={pointLabel?.(w, v)}
                >
                  {level && level !== "medium" && (
                    <text
                      x={x(i)}
                      y={
                        level === "high"
                          ? y(v) - radius - 6
                          : y(v) + radius + 14
                      }
                      textAnchor="middle"
                      className={`fill-zinc-600 dark:fill-zinc-400 ${column < 12 ? "text-[9px]" : "text-[11px]"}`}
                      aria-hidden="true"
                    >
                      {level === "high" ? "▲" : "▼"}
                    </text>
                  )}
                  {dot && (
                    <circle
                      cx={x(i)}
                      cy={y(v)}
                      r={active && handles ? radius + 1.5 : radius}
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
            // The week's hit area: its whole column, centred on the point.
            <rect
              key={w.number}
              data-week={w.number}
              x={x(i) - column / 2}
              y={PLOT.top}
              width={column}
              height={PLOT.height}
              fill="transparent"
              className={handles ? "cursor-ns-resize" : undefined}
              onPointerEnter={() => setHovered(w.number)}
              onPointerDown={(event) => onPointerDown(event, i)}
              onPointerMove={(event) => onPointerMove(event, i)}
              onPointerUp={(event) => onPointerUp(event, i)}
              onPointerCancel={() => setDragging(null)}
            />
          ))}
          {onBordersChange &&
            mesocycles.slice(1).map((m, index) => {
              const border = index as 0 | 1;
              const bx = x(m.firstWeek - 1);
              return (
                <g
                  key={m.type}
                  data-border={border}
                  role="img"
                  aria-label={t("borderValue", {
                    block: tm(m.type),
                    week: m.firstWeek,
                  })}
                  className="cursor-ew-resize"
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture?.(event.pointerId);
                    setBorderDrag({ border, week: savedBorders[border] });
                  }}
                  onPointerMove={(event) => {
                    if (borderDrag?.border !== border) return;
                    const week = borderWeekAt(event, border);
                    if (week !== borderDrag.week)
                      setBorderDrag({ border, week });
                  }}
                  onPointerUp={() => {
                    if (borderDrag?.border !== border) return;
                    const week = borderDrag.week;
                    setBorderDrag(null);
                    const next: [number, number] =
                      border === 0
                        ? [week, savedBorders[1]]
                        : [savedBorders[0], week];
                    if (
                      next[0] !== savedBorders[0] ||
                      next[1] !== savedBorders[1]
                    )
                      onBordersChange(next[0], next[1]);
                  }}
                  onPointerCancel={() => setBorderDrag(null)}
                >
                  {/* Large transparent hit area around the grip. */}
                  <rect
                    x={bx - 14}
                    y={PLOT.top}
                    width={28}
                    height={36}
                    fill="transparent"
                  />
                  <rect
                    className="fill-white stroke-zinc-500 dark:fill-zinc-950"
                    x={bx - 6}
                    y={PLOT.top + 6}
                    width={12}
                    height={24}
                    rx={4}
                    strokeWidth={borderDrag?.border === border ? 2.5 : 1.5}
                  />
                  {[-2, 2].map((dx) => (
                    <line
                      key={dx}
                      x1={bx + dx}
                      x2={bx + dx}
                      y1={PLOT.top + 12}
                      y2={PLOT.top + 24}
                      className="stroke-zinc-500"
                      strokeWidth={1}
                    />
                  ))}
                </g>
              );
            })}
          {shown && (
            <line
              x1={x(shownIndex)}
              x2={x(shownIndex)}
              y1={PLOT.top}
              y2={bottom}
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
            data-testid="chart-tooltip"
            className="pointer-events-none absolute z-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-md dark:border-zinc-800 dark:bg-zinc-950"
            style={{
              left: tooltipPosition.left,
              top: tooltipPosition.top,
              width: TOOLTIP.width,
              minHeight: TOOLTIP.height,
            }}
          >
            {tooltipLines.map((line, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? "font-semibold tabular-nums"
                    : "text-zinc-600 dark:text-zinc-400"
                }
              >
                {line}
              </p>
            ))}
          </div>
        )}
      </div>
    </figure>
  );
}

/** The tooltip's second line: the week and its start date. */
export function useWeekDate() {
  const format = useFormatter();
  return (startDate: string) =>
    format.dateTime(new Date(`${startDate}T00:00:00Z`), {
      dateStyle: "medium",
      timeZone: "UTC",
    });
}
