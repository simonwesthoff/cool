"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import type {
  MacrocycleWeekView,
  MesocycleView,
  WeekLevel,
} from "@/domain/macrocycles/macrocycle-types";
import {
  baseIntensity,
  fitsLabel,
  intensityAt,
  intensityDomain,
  labelEvery,
  levelForValue,
  stepLevel,
} from "./chart-geometry";

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
  /** The main competition, marked with a vertical line and an annotation. */
  competition?: { date: string; type: string };
};

/** Width and height of the tooltip box, used to place it next to a point. */
const TOOLTIP = { width: 208, height: 84, gap: 10 };
const PLOT = { top: 28, height: 220 };
/** Space below the plot for the week numbers and the axis title. */
const X_AXIS = 44;
const BAND_FILL = ["var(--band-1)", "var(--band-2)", "var(--band-3)"];
/** Estimated width of one character of an 11 px label. */
const LABEL_CHAR = 6.2;
/** Width used before the container has been measured. */
const DEFAULT_WIDTH = 640;

/**
 * The macrocycle chart: intensity per week with one handle per week on the
 * mesocycle bands. It always fits its container's width.
 */
export function MacrocycleChart({
  weeks,
  mesocycles: savedMesocycles,
  onLevelChange,
  onBordersChange,
  competition,
}: Props) {
  const t = useTranslations("Macrocycle.chart");
  const tm = useTranslations("Macrocycle.mesocycles");
  const format = useFormatter();
  const container = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(0);
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
  const titleId = useId();

  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setAvailable(entry!.contentRect.width),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const n = weeks.length;
  const width = available || DEFAULT_WIDTH;
  const narrow = width < 500;
  const margin = narrow ? { left: 44, right: 10 } : { left: 56, right: 16 };
  // The whole cycle always fits: no horizontal scrolling.
  const column = (width - margin.left - margin.right) / Math.max(n, 1);
  const height = PLOT.top + PLOT.height + X_AXIS;

  // Borders = first weeks of the special and competition preparation blocks.
  const savedBorders: [number, number] = [
    savedMesocycles[1]!.firstWeek,
    savedMesocycles[2]!.firstWeek,
  ];
  const borders: [number, number] = borderDrag
    ? borderDrag.border === 0
      ? [borderDrag.week, savedBorders[1]]
      : [savedBorders[0], borderDrag.week]
    : savedBorders;
  const mesocycles = [
    { type: savedMesocycles[0]!.type, firstWeek: 1, lastWeek: borders[0] - 1 },
    {
      type: savedMesocycles[1]!.type,
      firstWeek: borders[0],
      lastWeek: borders[1] - 1,
    },
    { type: savedMesocycles[2]!.type, firstWeek: borders[1], lastWeek: n },
  ];

  const bases = weeks.map((w) => baseIntensity(w.intensityPct, w.level));
  const domain = intensityDomain(bases);
  const y = (pct: number) =>
    PLOT.top +
    PLOT.height * (1 - (pct - domain.min) / (domain.max - domain.min));
  const valueAt = (svgY: number) =>
    domain.min +
    (1 - (svgY - PLOT.top) / PLOT.height) * (domain.max - domain.min);
  // A week's point sits at the start (left edge) of its column, so a
  // mesocycle border is exactly at the point of the block's first week.
  const x = (index: number) => margin.left + column * index;
  const plotRight = margin.left + column * n;
  const every = labelEvery(column);
  // Points shrink with narrow columns, so many weeks still fit side by side.
  const radius = Math.min(4.5, Math.max(2.5, column * 0.3));

  const levelOf = (w: ChartWeek) =>
    dragging?.week === w.number ? dragging.level : w.level;
  const points = weeks.map((w, i) => ({
    x: x(i),
    y: y(intensityAt(bases[i]!, levelOf(w))),
  }));
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const curvePath = weeks
    .map(
      (_, i) =>
        `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(bases[i]!).toFixed(1)}`,
    )
    .join(" ");

  const pct = (value: number) =>
    format.number(value / 100, { style: "percent", maximumFractionDigits: 1 });
  const levelName = (level: WeekLevel) => t(`levels.${level}`);
  const intensityOf = (w: ChartWeek) =>
    intensityAt(baseIntensity(w.intensityPct, w.level), levelOf(w));
  const describe = (w: ChartWeek) =>
    t("weekValue", {
      week: w.number,
      level: levelName(levelOf(w)),
      intensity: pct(intensityOf(w)),
    });

  function svgPoint(event: PointerEvent<SVGElement>) {
    const svg = event.currentTarget.ownerSVGElement!;
    const rect = svg.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  // --- Week handles: drag up/down, or tap above/below the point -------------
  function onPointerDown(event: PointerEvent<SVGRectElement>, w: ChartWeek) {
    if (!onLevelChange) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragging({ week: w.number, level: w.level, moved: false });
  }

  function onPointerMove(
    event: PointerEvent<SVGRectElement>,
    w: ChartWeek,
    base: number,
  ) {
    if (!dragging || dragging.week !== w.number) return;
    const level = levelForValue(base, valueAt(svgPoint(event).y));
    if (level !== dragging.level)
      setDragging({ ...dragging, level, moved: true });
  }

  function onPointerUp(
    event: PointerEvent<SVGRectElement>,
    w: ChartWeek,
    base: number,
  ) {
    if (!dragging || dragging.week !== w.number || !onLevelChange) return;
    let level = dragging.level;
    if (!dragging.moved) {
      // A tap above the week's point moves it one step up, below one step down.
      const tapped = valueAt(svgPoint(event).y);
      level =
        tapped > intensityAt(base, w.level)
          ? stepLevel(w.level, 1)
          : stepLevel(w.level, -1);
    }
    setDragging(null);
    if (level !== w.level) onLevelChange(w.number, level);
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

  function commitBorders(next: [number, number]) {
    if (next[0] !== savedBorders[0] || next[1] !== savedBorders[1]) {
      onBordersChange?.(next[0], next[1]);
    }
  }

  // --- Week labels and tooltip -------------------------------------------------
  // The first week of every block is always numbered; the other numbers
  // follow the regular spacing and give way when they come too close.
  const blockStarts = mesocycles.map((m) => m.firstWeek);
  const showWeekLabel = (week: number) =>
    blockStarts.includes(week) ||
    ((week - 1) % every === 0 &&
      blockStarts.every((start) => Math.abs(start - week) >= every));

  // --- Main competition marker -------------------------------------------------
  const marker = (() => {
    if (!competition || n === 0) return null;
    const days =
      (Date.parse(`${competition.date}T00:00:00Z`) -
        Date.parse(`${weeks[0]!.startDate}T00:00:00Z`)) /
      86_400_000;
    if (Number.isNaN(days)) return null;
    const mx = Math.min(
      plotRight,
      margin.left + column * (Math.max(0, days) / 7),
    );
    const date = format.dateTime(new Date(`${competition.date}T00:00:00Z`), {
      dateStyle: "medium",
      timeZone: "UTC",
    });
    // The label sits above the plot like the mesocycle labels: ending at
    // the line in the right half, starting at it in the left half.
    const toLeft = mx > margin.left + (plotRight - margin.left) / 2;
    const room = toLeft ? mx - 4 - margin.left : plotRight - mx - 4;
    const fixed = t("competitionLabel", { type: "", date }).length;
    const maxType = Math.max(4, Math.floor(room / LABEL_CHAR) - fixed);
    const type =
      competition.type.length > maxType
        ? `${competition.type.slice(0, maxType - 1).trimEnd()}…`
        : competition.type;
    const text = t("competitionLabel", { type, date });
    const textX = toLeft ? mx - 4 : mx + 4;
    const textWidth = text.length * LABEL_CHAR;
    return {
      x: mx,
      text,
      label: t("competitionValue", { type: competition.type, date }),
      anchor: toLeft ? ("end" as const) : ("start" as const),
      textX,
      extent: toLeft ? [textX - textWidth, textX] : [textX, textX + textWidth],
    };
  })();
  /** Mesocycle labels give way to the competition's label. */
  const clearOfMarker = (start: number, label: string) =>
    !marker ||
    start + label.length * LABEL_CHAR + 8 < marker.extent[0]! ||
    start > marker.extent[1]! + 8;

  const shown =
    hovered === null ? null : weeks.find((w) => w.number === hovered);
  // Place the tooltip beside the point's column (never over the pointer,
  // which is in that column) and in the vertical half the point is not in.
  const tooltipPosition = (() => {
    if (!shown) return null;
    const index = weeks.indexOf(shown);
    const px = x(index);
    const py = y(intensityOf(shown));
    const rightOfColumn = px + column / 2 + TOOLTIP.gap;
    const leftOfColumn = px - column / 2 - TOOLTIP.gap - TOOLTIP.width;
    const fitsRight = rightOfColumn + TOOLTIP.width <= width;
    const fitsLeft = leftOfColumn >= 0;
    const preferLeft = px > width / 2;
    let left =
      (preferLeft && fitsLeft) || !fitsRight ? leftOfColumn : rightOfColumn;
    if (left < 0) left = 0;
    const upperHalf = py < PLOT.top + PLOT.height / 2;
    const top = upperHalf ? PLOT.top + PLOT.height - TOOLTIP.height : PLOT.top;
    return { left, top };
  })();

  return (
    <figure
      className="macrocycle-chart flex flex-col gap-3"
      aria-labelledby={titleId}
    >
      <figcaption id={titleId} className="sr-only">
        {t("caption")}
      </figcaption>
      <ul
        className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400"
        aria-label={t("legend")}
      >
        {mesocycles.map((m, i) => (
          <li key={m.type} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block size-3 rounded-sm"
              style={{ background: BAND_FILL[i] }}
            />
            {tm(m.type)}
          </li>
        ))}
        <li className="flex items-center gap-2">
          <span aria-hidden="true">▲▼</span>
          {t("legendLevels")}
        </li>
        {marker && (
          <li className="flex items-center gap-2">
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
            {t("legendCompetition")}
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
          aria-label={t("intensity")}
          className="block touch-none select-none"
        >
          {mesocycles.map((m, i) => (
            <g key={m.type}>
              <rect
                x={x(m.firstWeek - 1)}
                y={PLOT.top}
                width={column * (m.lastWeek - m.firstWeek + 1)}
                height={PLOT.height}
                fill={BAND_FILL[i]}
              />
              {/* Only label a band when the name fits; the legend names it otherwise. */}
              {fitsLabel(
                tm(`abbr.${m.type}`),
                column * (m.lastWeek - m.firstWeek + 1),
              ) &&
                clearOfMarker(x(m.firstWeek - 1) + 4, tm(`abbr.${m.type}`)) && (
                  <text
                    x={x(m.firstWeek - 1) + 4}
                    y={PLOT.top - 8}
                    className="fill-zinc-600 text-[11px] dark:fill-zinc-400"
                  >
                    {tm(`abbr.${m.type}`)}
                  </text>
                )}
            </g>
          ))}
          {domain.ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={margin.left}
                x2={plotRight}
                y1={y(tick)}
                y2={y(tick)}
                className="stroke-black/20"
                strokeWidth={1}
              />
              <text
                x={margin.left - 6}
                y={y(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-zinc-500 text-[11px] tabular-nums"
              >
                {pct(tick)}
              </text>
            </g>
          ))}
          {/* Axis titles. */}
          <text
            transform={`translate(12 ${PLOT.top + PLOT.height / 2}) rotate(-90)`}
            textAnchor="middle"
            className="fill-zinc-600 text-[11px] dark:fill-zinc-400"
          >
            {t("axisIntensity")}
          </text>
          <text
            x={margin.left + (plotRight - margin.left) / 2}
            y={PLOT.top + PLOT.height + 38}
            textAnchor="middle"
            className="fill-zinc-600 text-[11px] dark:fill-zinc-400"
          >
            {t("axisWeek")}
          </text>
          {/* White marks with a dark halo stay readable on every band colour. */}
          <path
            d={curvePath}
            fill="none"
            stroke="var(--chart-halo)"
            strokeOpacity={0.5}
            strokeWidth={3}
          />
          <path
            d={curvePath}
            fill="none"
            className="stroke-white/70"
            strokeWidth={1}
          />
          <path
            d={linePath}
            fill="none"
            stroke="var(--chart-halo)"
            strokeWidth={5}
            strokeOpacity={0.85}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d={linePath}
            fill="none"
            className="stroke-white"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {weeks.map((w, i) => {
            const level = levelOf(w);
            const p = points[i]!;
            const active = hovered === w.number || dragging?.week === w.number;
            return (
              <g key={w.number}>
                {showWeekLabel(w.number) && (
                  <text
                    x={x(i)}
                    y={PLOT.top + PLOT.height + 18}
                    textAnchor="middle"
                    className="fill-zinc-500 text-[11px] tabular-nums"
                  >
                    {w.number}
                  </text>
                )}
                {level !== "medium" && (
                  <text
                    x={p.x}
                    y={level === "high" ? p.y - radius - 6 : p.y + radius + 14}
                    textAnchor="middle"
                    className={
                      column < 12
                        ? "fill-white text-[9px]"
                        : "fill-white text-[11px]"
                    }
                    stroke="var(--chart-halo)"
                    strokeWidth={3}
                    paintOrder="stroke"
                    aria-hidden="true"
                  >
                    {level === "high" ? "▲" : "▼"}
                  </text>
                )}
                <g
                  data-week-point={w.number}
                  role="img"
                  aria-label={describe(w)}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={(active ? radius + 1.5 : radius) + 2.5}
                    fill="var(--chart-halo)"
                  />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={active ? radius + 1.5 : radius}
                    className="fill-white"
                  />
                </g>
                {/* The week's hit area: its whole column, centred on the point. */}
                <rect
                  data-week={w.number}
                  x={x(i) - column / 2}
                  y={PLOT.top}
                  width={column}
                  height={PLOT.height}
                  fill="transparent"
                  className={onLevelChange ? "cursor-ns-resize" : undefined}
                  onPointerEnter={() => setHovered(w.number)}
                  onPointerDown={(event) => onPointerDown(event, w)}
                  onPointerMove={(event) => onPointerMove(event, w, bases[i]!)}
                  onPointerUp={(event) => onPointerUp(event, w, bases[i]!)}
                  onPointerCancel={() => setDragging(null)}
                />
              </g>
            );
          })}
          {mesocycles.slice(1).map((m, index) => {
            const border = index as 0 | 1;
            const bx = x(m.firstWeek - 1);
            return (
              <g key={m.type}>
                <line
                  x1={bx}
                  x2={bx}
                  y1={PLOT.top}
                  y2={PLOT.top + PLOT.height}
                  className="pointer-events-none stroke-white/80"
                  strokeWidth={borderDrag?.border === border ? 2 : 1}
                />
                {onBordersChange && (
                  <g
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
                      commitBorders(
                        border === 0
                          ? [week, savedBorders[1]]
                          : [savedBorders[0], week],
                      );
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
                      strokeWidth={2}
                    />
                    <line
                      x1={bx - 2}
                      x2={bx - 2}
                      y1={PLOT.top + 12}
                      y2={PLOT.top + 24}
                      className="stroke-zinc-500"
                      strokeWidth={1}
                    />
                    <line
                      x1={bx + 2}
                      x2={bx + 2}
                      y1={PLOT.top + 12}
                      y2={PLOT.top + 24}
                      className="stroke-zinc-500"
                      strokeWidth={1}
                    />
                  </g>
                )}
              </g>
            );
          })}
          {marker && (
            <g
              data-competition
              role="img"
              aria-label={marker.label}
              className="pointer-events-none"
            >
              <line
                x1={marker.x}
                x2={marker.x}
                y1={PLOT.top}
                y2={PLOT.top + PLOT.height}
                stroke="var(--chart-halo)"
                strokeOpacity={0.6}
                strokeWidth={4}
              />
              <line
                x1={marker.x}
                x2={marker.x}
                y1={PLOT.top}
                y2={PLOT.top + PLOT.height}
                className="stroke-white"
                strokeWidth={2}
                strokeDasharray="5 3"
              />
              <text
                x={marker.textX}
                y={PLOT.top - 8}
                textAnchor={marker.anchor}
                className="fill-zinc-600 text-[11px] dark:fill-zinc-400"
                aria-hidden="true"
              >
                {marker.text}
              </text>
            </g>
          )}
          {hovered !== null && (
            <line
              x1={x(weeks.findIndex((w) => w.number === hovered))}
              x2={x(weeks.findIndex((w) => w.number === hovered))}
              y1={PLOT.top}
              y2={PLOT.top + PLOT.height}
              className="pointer-events-none stroke-white/80"
              strokeWidth={1}
            />
          )}
        </svg>
        {shown && tooltipPosition && (
          <div
            role="status"
            data-testid="week-tooltip"
            className="pointer-events-none absolute z-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-md dark:border-zinc-800 dark:bg-zinc-950"
            style={{
              left: tooltipPosition.left,
              top: tooltipPosition.top,
              width: TOOLTIP.width,
              minHeight: TOOLTIP.height,
            }}
          >
            <p className="font-semibold tabular-nums">
              {t("tooltipValue", {
                intensity: pct(intensityOf(shown)),
                level: t(`levelsShort.${levelOf(shown)}`),
              })}
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
