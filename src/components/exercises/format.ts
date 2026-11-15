import type { Range } from "@/domain/exercises/catalog-types";

/** "3–8", "3" or null when the catalog defines no range. */
export function formatRange(range: Range): string | null {
  const { min, max } = range;
  if (min === null && max === null) return null;
  if (min !== null && max !== null)
    return min === max ? String(min) : `${min}–${max}`;
  return String(min ?? max);
}
