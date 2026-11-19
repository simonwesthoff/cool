import type { WeekLevel } from "@/domain/macrocycles/calculation";

/** Percentage points a high/low week differs from the curve. */
export const STEP_PCT = 5;

const OFFSET: Record<WeekLevel, number> = {
  high: STEP_PCT,
  medium: 0,
  low: -STEP_PCT,
};
const ORDER: WeekLevel[] = ["low", "medium", "high"];

/** Intensity of the curve itself (without the week's high/low step). */
export function baseIntensity(intensityPct: number, level: WeekLevel): number {
  return Math.round((intensityPct - OFFSET[level]) * 10) / 10;
}

export function intensityAt(basePct: number, level: WeekLevel): number {
  return Math.round((basePct + OFFSET[level]) * 10) / 10;
}

/** One step up or down, never beyond high or low. */
export function stepLevel(level: WeekLevel, direction: 1 | -1): WeekLevel {
  const index = Math.min(2, Math.max(0, ORDER.indexOf(level) + direction));
  return ORDER[index]!;
}

/** The level whose position is closest to the pointer's intensity value. */
export function levelForValue(basePct: number, valuePct: number): WeekLevel {
  const diff = valuePct - basePct;
  if (diff >= STEP_PCT / 2) return "high";
  if (diff <= -STEP_PCT / 2) return "low";
  return "medium";
}

/** y-axis domain in % with clean 10 % ticks, covering every low and high week. */
export function intensityDomain(basePcts: number[]): {
  min: number;
  max: number;
  ticks: number[];
} {
  const lowest = Math.min(...basePcts) - STEP_PCT;
  const min = Math.max(0, Math.floor(lowest / 10) * 10);
  const max = 110;
  const ticks: number[] = [];
  for (let v = min; v <= max; v += 10) ticks.push(v);
  return { min, max, ticks };
}

/** Show every n-th week label so labels never collide (at least 36 px apart). */
export function labelEvery(columnWidth: number): number {
  return Math.max(1, Math.ceil(36 / columnWidth));
}

/**
 * Whether an 11 px label fits into a band of the given width (estimated at
 * 6.2 px per character plus padding; generous for the app's sans-serif font).
 */
export function fitsLabel(label: string, bandWidth: number): boolean {
  return label.length * 6.2 + 8 <= bandWidth;
}

/** A clean step (1, 2 or 5 × 10^k) giving about `count` intervals. */
export function niceStep(range: number, count = 5): number {
  const raw = Math.max(range, 1) / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const factor = [1, 2, 5, 10].find((f) => f * power >= raw) ?? 10;
  return factor * power;
}

/**
 * Axis from a clean step below `min` (or from 0) to a clean step above `max`,
 * with its ticks. Without values the axis is 0–10.
 */
export function niceDomain(
  values: number[],
  options: { fromZero?: boolean } = {},
): { min: number; max: number; ticks: number[] } {
  if (values.length === 0) return { min: 0, max: 10, ticks: [0, 5, 10] };
  const low = options.fromZero ? 0 : Math.min(...values);
  const high = Math.max(...values);
  const step = niceStep(high - low || high || 1);
  const min = options.fromZero
    ? 0
    : Math.max(0, Math.floor(low / step) * step - step);
  const max = Math.ceil(high / step) * step + (high % step === 0 ? step : 0);
  const ticks: number[] = [];
  for (let v = min; v <= max + 1e-9; v += step)
    ticks.push(Math.round(v * 1000) / 1000);
  return { min, max, ticks };
}

/** Index of the week containing `today` (YYYY-MM-DD), or null outside the cycle. */
export function currentWeekIndex(
  startDate: string,
  weekCount: number,
  today: string,
): number | null {
  const days =
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) /
    86_400_000;
  if (Number.isNaN(days) || days < 0) return null;
  const index = Math.floor(days / 7);
  return index < weekCount ? index : null;
}

/**
 * A smooth SVG path through the points that never overshoots them
 * (monotone cubic, Fritsch–Butland tangents): rises and falls stay where
 * the values are. A single point becomes a dot (with a round line cap).
 */
export function smoothPath(points: { x: number; y: number }[]): string {
  const p = points;
  if (p.length === 0) return "";
  const f = (v: number) => v.toFixed(1);
  if (p.length === 1) return `M${f(p[0]!.x)},${f(p[0]!.y)} l0.01,0`;
  const slope = p.slice(1).map((b, i) => (b.y - p[i]!.y) / (b.x - p[i]!.x));
  const tangent = p.map((_, i) => {
    if (i === 0) return slope[0]!;
    if (i === p.length - 1) return slope[i - 1]!;
    const a = slope[i - 1]!;
    const b = slope[i]!;
    return a * b <= 0 ? 0 : (2 * a * b) / (a + b);
  });
  let d = `M${f(p[0]!.x)},${f(p[0]!.y)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i]!;
    const b = p[i + 1]!;
    const h = (b.x - a.x) / 3;
    d += ` C${f(a.x + h)},${f(a.y + tangent[i]! * h)} ${f(b.x - h)},${f(b.y - tangent[i + 1]! * h)} ${f(b.x)},${f(b.y)}`;
  }
  return d;
}
