import { z } from "zod";

const code = (value: string) => ({ params: { code: value } });

const number = (min: number, max: number) =>
  z
    .number()
    .refine(Number.isFinite, code("INVALID_TYPE"))
    .refine((v) => v >= min && v <= max, code("OUT_OF_RANGE"));

const text = (max: number) =>
  z
    .string()
    .trim()
    .refine((v) => v.length > 0, code("REQUIRED"))
    .refine((v) => v.length <= max, code("TOO_LONG"));

/** Day of the week of an ISO date (0 = Sunday … 1 = Monday). */
export function weekdayOf(isoDate: string): number {
  return new Date(`${isoDate}T00:00:00Z`).getUTCDay();
}

const monday = z.iso
  .date()
  .refine((v) => weekdayOf(v) === 1, code("NOT_MONDAY"));

export const MAX_FOCUS_POINTS = 3;
export const MAX_SESSIONS_PER_DAY = 3;
export const MAX_SESSIONS_PER_WEEK = 14;

type Session = { weekday: number; slot: number };

/** Sessions in week order: by weekday, then slot. */
export function sortSessions<T extends Session>(list: T[]): T[] {
  return [...list].sort((a, b) => a.weekday - b.weekday || a.slot - b.slot);
}

/** Each day's slots are 1, 2, … without gaps or duplicates. */
export function isContiguousSchedule(list: Session[]): boolean {
  const byDay = new Map<number, number[]>();
  for (const s of list)
    byDay.set(s.weekday, [...(byDay.get(s.weekday) ?? []), s.slot]);
  return [...byDay.values()].every((slots) =>
    [...slots].sort((a, b) => a - b).every((slot, i) => slot === i + 1),
  );
}
export const FOCUS_POINT_MAX_LENGTH = 200;
export const DURATION_MIN_WEEKS = 7;
export const DURATION_MAX_WEEKS = 52;

const fields = {
  startDate: monday,
  durationWeeks: z
    .number()
    .refine(Number.isInteger, code("NOT_INTEGER"))
    .refine(
      (v) => v >= DURATION_MIN_WEEKS && v <= DURATION_MAX_WEEKS,
      code("OUT_OF_RANGE"),
    ),
  entryValuePct: number(30, 95),
  snatchBestKg: number(1, 400),
  cleanAndJerkBestKg: number(1, 400),
  snatchGoalKg: number(1, 400),
  cleanAndJerkGoalKg: number(1, 400),
  bodyWeightKg: number(20, 250),
  targetBodyWeightKg: number(20, 250),
  sessions: z
    .array(
      z.strictObject({
        weekday: z
          .number()
          .refine(Number.isInteger, code("NOT_INTEGER"))
          .refine((v) => v >= 1 && v <= 7, code("OUT_OF_RANGE")),
        slot: z
          .number()
          .refine(Number.isInteger, code("NOT_INTEGER"))
          .refine(
            (v) => v >= 1 && v <= MAX_SESSIONS_PER_DAY,
            code("OUT_OF_RANGE"),
          ),
      }),
    )
    .refine((list) => list.length >= 1, code("REQUIRED"))
    .refine((list) => list.length <= MAX_SESSIONS_PER_WEEK, code("TOO_MANY"))
    .refine(isContiguousSchedule, code("INVALID"))
    .transform(sortSessions),
  competitionDate: z.iso.date(),
  competitionType: text(200),
};

/** Step 2 (SWOT): all required and saved together. */
export const swotSchema = z.strictObject({
  strengths: text(2000),
  snatchDeficits: text(2000),
  cleanDeficits: text(2000),
  jerkDeficits: text(2000),
  otherDeficits: text(2000),
  experience: text(2000),
  focusPoints: z
    .array(text(FOCUS_POINT_MAX_LENGTH))
    .refine((list) => list.length >= 1, code("REQUIRED"))
    .refine((list) => list.length <= MAX_FOCUS_POINTS, code("TOO_MANY")),
  injuriesAndIllnesses: text(2000),
});

export type Swot = z.output<typeof swotSchema>;

/** The SWOT of a macrocycle created in step 1, before step 2 is saved. */
export const EMPTY_SWOT: Swot = {
  strengths: "",
  snatchDeficits: "",
  cleanDeficits: "",
  jerkDeficits: "",
  otherDeficits: "",
  experience: "",
  focusPoints: [],
  injuriesAndIllnesses: "",
};

const optional = {
  bodyFatPct: number(2, 60).nullable().optional(),
  muscleMassPct: number(10, 80).nullable().optional(),
};

/** Step 1 of a new macrocycle: everything except body fat and muscle mass is required; no SWOT. */
export const createBaseDataSchema = z.strictObject({ ...fields, ...optional });

/** Changes to the step 1 data: any subset; `null` clears the optional values. */
export const updateBaseDataSchema = z.strictObject({
  ...Object.fromEntries(
    Object.entries(fields).map(([k, s]) => [k, s.optional()]),
  ),
  ...optional,
} as {
  [K in keyof typeof fields]: z.ZodOptional<(typeof fields)[K]>;
} & typeof optional);

export type BaseData = z.output<typeof createBaseDataSchema> & {
  bodyFatPct: number | null;
  muscleMassPct: number | null;
};

/** Cross-field rule: the main competition is not before the start. */
export const completeBaseDataSchema = z
  .object({ startDate: z.string(), competitionDate: z.string() })
  .superRefine((data, ctx) => {
    if (data.competitionDate < data.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["competitionDate"],
        message: "BEFORE_START",
        params: { code: "BEFORE_START" },
      });
    }
  });
