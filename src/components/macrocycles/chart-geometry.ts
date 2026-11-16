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
