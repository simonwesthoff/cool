/** The macrocycle planning's steps, in order (shared by server and client). */
export const PLANNING_STEPS = [
  "base-data",
  "swot",
  "intensity",
  "exercises",
] as const;
export type PlanningStep = (typeof PLANNING_STEPS)[number];

export const isPlanningStep = (value: unknown): value is PlanningStep =>
  (PLANNING_STEPS as readonly unknown[]).includes(value);
