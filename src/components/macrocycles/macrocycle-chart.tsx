"use client";

import { useFormatter, useTranslations } from "next-intl";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
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
};

/** Width and height of the tooltip box, used to place it next to a point. */
const TOOLTIP = { width: 184, height: 104, gap: 12 };

const MARGIN = { left: 44, right: 12 };
const INTENSITY = { top: 28, height: 220, axis: 28 };
const VOLUME = { top: 12, height: 96, axis: 24 };
const MIN_COLUMN = 28;
const BAND_FILL = ["var(--band-1)", "var(--band-2)", "var(--band-3)"];

/**
 * The macrocycle chart: intensity per week (one handle per week) and, as a
 * separate chart on the same week axis, the volume per week. Mesocycles are
 * shown as background bands.
 */
export function MacrocycleChart({
  weeks,
  mesocycles: savedMesocycles,
  onLevelChange,
  onBordersChange,
}: Props) {
  const t = useTranslations("Macrocycle.chart");
  const tm = useTranslations("Macrocycle.mesocycles");
  const format = useFormatter();
  const container = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
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
  const column = Math.max(
    MIN_COLUMN,
    (available - MARGIN.left - MARGIN.right) / Math.max(n, 1),
  );
  const width = MARGIN.left + MARGIN.right + column * n;
  const bases = weeks.map((w) => baseIntensity(w.intensityPct, w.level));
  const domain = intensityDomain(bases);
  const y = (pct: number) =>
    INTENSITY.top +
    INTENSITY.height * (1 - (pct - domain.min) / (domain.max - domain.min));
  const valueAt = (svgY: number) =>
    domain.min +
    (1 - (svgY - INTENSITY.top) / INTENSITY.height) * (domain.max - domain.min);
  const x = (index: number) => MARGIN.left + column * (index + 0.5);
  const every = labelEvery(column);

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

  const volumes = weeks.map((w) => w.volume);
  const hasVolume = volumes.some((v) => v !== null);
  const maxVolume = Math.max(1, ...volumes.map((v) => v ?? 0));
  const barWidth = Math.min(24, column - 4);

  const pct = (value: number) =>
    format.number(value / 100, { style: "percent", maximumFractionDigits: 1 });
  const levelName = (level: WeekLevel) => t(`levels.${level}`);
  const describe = (w: ChartWeek) =>
    t("weekValue", {
      week: w.number,
      level: levelName(levelOf(w)),
      intensity: pct(
        intensityAt(baseIntensity(w.intensityPct, w.level), levelOf(w)),
      ),
    });

  function svgY(event: PointerEvent<SVGElement>) {
    const svg =
      event.currentTarget.ownerSVGElement ??
      (event.currentTarget as unknown as SVGSVGElement);
    const rect = svg.getBoundingClientRect();
    return event.clientY - rect.top;
  }

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
    const level = levelForValue(base, valueAt(svgY(event)));
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
      const tapped = valueAt(svgY(event));
      const current = intensityAt(base, w.level);
      level = tapped > current ? stepLevel(w.level, 1) : stepLevel(w.level, -1);
    }
    setDragging(null);
    if (level !== w.level) onLevelChange(w.number, level);
  }

  function onKeyDown(event: KeyboardEvent<SVGGElement>, w: ChartWeek) {
    if (!onLevelChange) return;
    const direction =
      event.key === "ArrowUp" ? 1 : event.key === "ArrowDown" ? -1 : 0;
    if (!direction) return;
    event.preventDefault();
    const level = stepLevel(w.level, direction);
    if (level !== w.level) onLevelChange(w.number, level);
  }

  /** Allowed weeks for a border: every block keeps at least one week. */
  function borderRange(border: 0 | 1): [number, number] {
    return border === 0 ? [2, savedBorders[1] - 1] : [savedBorders[0] + 1, n];
  }

  function borderWeekAt(event: PointerEvent<SVGElement>, border: 0 | 1) {
    const svg = event.currentTarget.ownerSVGElement!;
    const px = event.clientX - svg.getBoundingClientRect().left;
    const [min, max] = borderRange(border);
    return Math.min(
      max,
      Math.max(min, Math.round((px - MARGIN.left) / column) + 1),
    );
  }

  function commitBorders(next: [number, number]) {
    if (next[0] !== savedBorders[0] || next[1] !== savedBorders[1]) {
      onBordersChange?.(next[0], next[1]);
    }
  }

  function onBorderKeyDown(event: KeyboardEvent<SVGGElement>, border: 0 | 1) {
    const direction =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!direction) return;
    event.preventDefault();
    const [min, max] = borderRange(border);
    const week = Math.min(max, Math.max(min, savedBorders[border] + direction));
    commitBorders(
      border === 0 ? [week, savedBorders[1]] : [savedBorders[0], week],
    );
  }

  const shown =
    hovered === null ? null : weeks.find((w) => w.number === hovered);
  // Place the tooltip beside the point's column (never over the pointer,
  // which is in that column) and in the vertical half the point is not in.
  const tooltipPosition = (() => {
    if (!shown) return null;
    const index = weeks.indexOf(shown);
    const px = x(index);
    const py = y(intensityAt(bases[index]!, levelOf(shown)));
    const visibleRight = scrollLeft + Math.max(available, TOOLTIP.width);
    const rightOfColumn = px + column / 2 + TOOLTIP.gap;
    const leftOfColumn = px - column / 2 - TOOLTIP.gap - TOOLTIP.width;
    const fitsRight = rightOfColumn + TOOLTIP.width <= visibleRight;
    const fitsLeft = leftOfColumn >= scrollLeft;
    const preferLeft = px - scrollLeft > Math.max(available, 1) / 2;
    const left =
      (preferLeft && fitsLeft) || !fitsRight ? leftOfColumn : rightOfColumn;
    const upperHalf = py < INTENSITY.top + INTENSITY.height / 2;
    const top = upperHalf
      ? INTENSITY.top + INTENSITY.height - TOOLTIP.height
      : INTENSITY.top;
    return { left: Math.max(scrollLeft, left), top };
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
              className="inline-block size-3 rounded-sm border border-zinc-300 dark:border-zinc-700"
              style={{ background: BAND_FILL[i] }}
            />
            {tm(m.type)}
          </li>
        ))}
        <li className="flex items-center gap-2">
          <span aria-hidden="true">▲▼</span>
          {t("legendLevels")}
        </li>
      </ul>
      <div
        ref={container}
        className="relative overflow-x-auto"
        onPointerLeave={() => setHovered(null)}
        onScroll={(event) => setScrollLeft(event.currentTarget.scrollLeft)}
      >
        <svg
          width={width}
          height={INTENSITY.top + INTENSITY.height + INTENSITY.axis}
          role="group"
          aria-label={t("intensity")}
          className="block touch-none select-none"
        >
          {mesocycles.map((m, i) => (
            <g key={m.type}>
              <rect
                x={MARGIN.left + column * (m.firstWeek - 1)}
                y={INTENSITY.top}
                width={column * (m.lastWeek - m.firstWeek + 1)}
                height={INTENSITY.height}
                fill={BAND_FILL[i]}
              />
              {/* Only label a band when the name fits; the legend names it otherwise. */}
              {fitsLabel(
                tm(`short.${m.type}`),
                column * (m.lastWeek - m.firstWeek + 1),
              ) && (
                <text
                  x={MARGIN.left + column * (m.firstWeek - 1) + 4}
                  y={INTENSITY.top - 8}
                  className="fill-zinc-600 text-[11px] dark:fill-zinc-400"
                >
                  {tm(`short.${m.type}`)}
                </text>
              )}
            </g>
          ))}
          {domain.ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={width - MARGIN.right}
                y1={y(tick)}
                y2={y(tick)}
                className="stroke-zinc-200 dark:stroke-zinc-800"
                strokeWidth={1}
              />
              <text
                x={MARGIN.left - 6}
                y={y(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-zinc-500 text-[11px] tabular-nums"
              >
                {pct(tick)}
              </text>
            </g>
          ))}
          <path
            d={curvePath}
            fill="none"
            className="stroke-zinc-400 dark:stroke-zinc-600"
            strokeWidth={1}
          />
          <path
            d={linePath}
            fill="none"
            className="stroke-zinc-900 dark:stroke-zinc-100"
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
                {i % every === 0 && (
                  <text
                    x={x(i)}
                    y={INTENSITY.top + INTENSITY.height + 18}
                    textAnchor="middle"
                    className="fill-zinc-500 text-[11px] tabular-nums"
                  >
                    {w.number}
                  </text>
                )}
                {level !== "medium" && (
                  <text
                    x={p.x}
                    y={level === "high" ? p.y - 12 : p.y + 20}
                    textAnchor="middle"
                    className="fill-zinc-900 text-[10px] dark:fill-zinc-100"
                    aria-hidden="true"
                  >
                    {level === "high" ? "▲" : "▼"}
                  </text>
                )}
                <g
                  role={onLevelChange ? "slider" : "img"}
                  tabIndex={onLevelChange ? 0 : -1}
                  aria-label={describe(w)}
                  aria-valuetext={onLevelChange ? describe(w) : undefined}
                  aria-valuemin={onLevelChange ? -1 : undefined}
                  aria-valuemax={onLevelChange ? 1 : undefined}
                  aria-valuenow={
                    onLevelChange
                      ? level === "high"
                        ? 1
                        : level === "low"
                          ? -1
                          : 0
                      : undefined
                  }
                  aria-orientation={onLevelChange ? "vertical" : undefined}
                  onKeyDown={(event) => onKeyDown(event, w)}
                  onFocus={() => setHovered(w.number)}
                  onBlur={() => setHovered(null)}
                  className="outline-none [&:focus-visible>circle.ring]:stroke-zinc-900 dark:[&:focus-visible>circle.ring]:stroke-zinc-100"
                >
                  <circle
                    className="ring"
                    cx={p.x}
                    cy={p.y}
                    r={active ? 9 : 7}
                    fill="var(--surface)"
                    stroke="transparent"
                    strokeWidth={2}
                  />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={active ? 6 : 4.5}
                    className="fill-zinc-900 dark:fill-zinc-100"
                  />
                </g>
                <rect
                  data-week={w.number}
                  x={MARGIN.left + column * i}
                  y={INTENSITY.top}
                  width={column}
                  height={INTENSITY.height}
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
            const bx = MARGIN.left + column * (m.firstWeek - 1);
            const [min, max] = borderRange(border);
            const label = t("borderValue", {
              block: tm(m.type),
              week: m.firstWeek,
            });
            return (
              <g key={m.type}>
                <line
                  x1={bx}
                  x2={bx}
                  y1={INTENSITY.top}
                  y2={INTENSITY.top + INTENSITY.height}
                  className="pointer-events-none stroke-zinc-500"
                  strokeWidth={borderDrag?.border === border ? 2 : 1}
                />
                {onBordersChange && (
                  <g
                    role="slider"
                    tabIndex={0}
                    aria-label={t(
                      border === 0
                        ? "borderLabels.special_preparation"
                        : "borderLabels.competition_preparation",
                    )}
                    aria-valuetext={label}
                    aria-valuenow={m.firstWeek}
                    aria-valuemin={min}
                    aria-valuemax={max}
                    aria-orientation="horizontal"
                    onKeyDown={(event) => onBorderKeyDown(event, border)}
                    className="cursor-ew-resize outline-none [&:focus-visible>rect.grip]:stroke-zinc-900 dark:[&:focus-visible>rect.grip]:stroke-zinc-100"
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
                      y={INTENSITY.top}
                      width={28}
                      height={36}
                      fill="transparent"
                    />
                    <rect
                      className="grip fill-white stroke-zinc-500 dark:fill-zinc-950"
                      x={bx - 6}
                      y={INTENSITY.top + 6}
                      width={12}
                      height={24}
                      rx={4}
                      strokeWidth={2}
                    />
                    <line
                      x1={bx - 2}
                      x2={bx - 2}
                      y1={INTENSITY.top + 12}
                      y2={INTENSITY.top + 24}
                      className="stroke-zinc-500"
                      strokeWidth={1}
                    />
                    <line
                      x1={bx + 2}
                      x2={bx + 2}
                      y1={INTENSITY.top + 12}
                      y2={INTENSITY.top + 24}
                      className="stroke-zinc-500"
                      strokeWidth={1}
                    />
                  </g>
                )}
              </g>
            );
          })}
          {hovered !== null && (
            <line
              x1={x(weeks.findIndex((w) => w.number === hovered))}
              x2={x(weeks.findIndex((w) => w.number === hovered))}
              y1={INTENSITY.top}
              y2={INTENSITY.top + INTENSITY.height}
              className="pointer-events-none stroke-zinc-400"
              strokeWidth={1}
            />
          )}
        </svg>
        <svg
          width={width}
          height={VOLUME.top + VOLUME.height + VOLUME.axis}
          role="group"
          aria-label={t("volume")}
          className="block"
        >
          <text
            x={MARGIN.left}
            y={VOLUME.top - 2}
            className="fill-zinc-600 text-[11px] dark:fill-zinc-400"
          >
            {t("volume")}
          </text>
          <line
            x1={MARGIN.left}
            x2={width - MARGIN.right}
            y1={VOLUME.top + VOLUME.height}
            y2={VOLUME.top + VOLUME.height}
            className="stroke-zinc-300 dark:stroke-zinc-700"
            strokeWidth={1}
          />
          {!hasVolume && (
            <text
              x={MARGIN.left + 4}
              y={VOLUME.top + VOLUME.height / 2 + 4}
              className="fill-zinc-500 text-[12px]"
            >
              {t("noVolume")}
            </text>
          )}
          {hasVolume && (
            <text
              x={MARGIN.left - 6}
              y={VOLUME.top + 8}
              textAnchor="end"
              className="fill-zinc-500 text-[11px] tabular-nums"
            >
              {format.number(maxVolume)}
            </text>
          )}
          {weeks.map((w, i) => {
            if (w.volume === null || w.volume === 0) return null;
            const h = (VOLUME.height - 8) * (w.volume / maxVolume);
            const left = x(i) - barWidth / 2;
            const top = VOLUME.top + VOLUME.height - h;
            const r = Math.min(4, h, barWidth / 2);
            return (
              <path
                key={w.number}
                d={`M${left},${top + h}V${top + r}Q${left},${top} ${left + r},${top}H${left + barWidth - r}Q${left + barWidth},${top} ${left + barWidth},${top + r}V${top + h}Z`}
                className={
                  hovered === w.number
                    ? "fill-zinc-700 dark:fill-zinc-300"
                    : "fill-zinc-500"
                }
                onPointerEnter={() => setHovered(w.number)}
              />
            );
          })}
        </svg>
        {shown && (
          <div
            role="status"
            data-testid="week-tooltip"
            className="pointer-events-none absolute z-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-md dark:border-zinc-800 dark:bg-zinc-950"
            style={{
              // Content coordinates: the tooltip scrolls with the chart.
              left: tooltipPosition!.left,
              top: tooltipPosition!.top,
              width: TOOLTIP.width,
              minHeight: TOOLTIP.height,
            }}
          >
            <p className="font-semibold tabular-nums">
              {pct(
                intensityAt(
                  baseIntensity(shown.intensityPct, shown.level),
                  levelOf(shown),
                ),
              )}
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              {t("tooltipWeek", {
                week: shown.number,
                date: format.dateTime(
                  new Date(`${shown.startDate}T00:00:00Z`),
                  { dateStyle: "medium", timeZone: "UTC" },
                ),
              })}
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              {levelName(levelOf(shown))} · {tm(shown.mesocycle)}
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              {t("tooltipVolume", {
                volume:
                  shown.volume === null ? "–" : format.number(shown.volume),
              })}
            </p>
          </div>
        )}
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-zinc-600 dark:text-zinc-400">
          {t("showTable")}
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left tabular-nums">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-1 pr-3 font-medium">{t("table.week")}</th>
                <th className="py-1 pr-3 font-medium">{t("table.start")}</th>
                <th className="py-1 pr-3 font-medium">
                  {t("table.mesocycle")}
                </th>
                <th className="py-1 pr-3 font-medium">{t("table.level")}</th>
                <th className="py-1 pr-3 text-right font-medium">
                  {t("table.intensity")}
                </th>
                <th className="py-1 text-right font-medium">
                  {t("table.volume")}
                </th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((w) => (
                <tr
                  key={w.number}
                  className="border-t border-zinc-200 dark:border-zinc-800"
                >
                  <td className="py-1 pr-3">{w.number}</td>
                  <td className="py-1 pr-3">
                    {format.dateTime(new Date(`${w.startDate}T00:00:00Z`), {
                      dateStyle: "medium",
                      timeZone: "UTC",
                    })}
                  </td>
                  <td className="py-1 pr-3">{tm(`short.${w.mesocycle}`)}</td>
                  <td className="py-1 pr-3">{levelName(levelOf(w))}</td>
                  <td className="py-1 pr-3 text-right">
                    {pct(
                      intensityAt(
                        baseIntensity(w.intensityPct, w.level),
                        levelOf(w),
                      ),
                    )}
                  </td>
                  <td className="py-1 text-right">
                    {w.volume === null ? "–" : format.number(w.volume)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
