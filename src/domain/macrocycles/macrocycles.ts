import { and, asc, eq, gt, inArray, max } from "drizzle-orm";
import { isCoachOfAthlete } from "@/domain/athletes";
import type { CurrentUser } from "@/domain/auth";
import { DomainError } from "@/domain/errors";
import { DomainValidationError, parseInput } from "@/domain/validation";
import { z } from "zod";
import { getDb } from "@/server/db";
import {
  exercise,
  exerciseAddresses,
  macrocycle,
  macrocycleSession,
  macrocycleWeek,
  mesocycle,
  mesocycleExercise,
  weekPlan,
} from "@/server/db/schema";
import {
  findMacrocycleRow,
  requireOwnAthlete,
  requireViewableAthlete,
} from "./access";
import {
  completeBaseDataSchema,
  createBaseDataSchema,
  EMPTY_SWOT,
  sortSessions,
  swotSchema,
  updateBaseDataSchema,
} from "./base-data";
import {
  bordersAreValid,
  cycleProgress,
  intensity,
  MESOCYCLE_TYPES,
  mesocycleOf,
  plannedExercise,
  scaleMesocycles,
  spansFromBorders,
  splitMesocycles,
  volume,
  type Curve,
  type ExerciseValues,
  type MesocycleType,
  type WeekLevel,
} from "./calculation";
import type {
  ExerciseWeeks,
  Macrocycle,
  MacrocycleBaseData,
  MacrocycleWeekView,
  ScheduledSession,
} from "./macrocycle-types";

const notFound = () => new DomainError("not_found", "MACROCYCLE_NOT_FOUND");

/**
 * Whether the user may plan (create and change) the athlete's macrocycle:
 * they lead the athlete's Team. The same rule as for all writes.
 */
export async function canPlanMacrocycle(
  user: CurrentUser,
  athleteId: string,
): Promise<boolean> {
  return isCoachOfAthlete(user, athleteId);
}

function isUniqueViolation(error: unknown): boolean {
  for (let e = error; e; e = (e as { cause?: unknown }).cause) {
    if ((e as { code?: unknown }).code === "23505") return true;
  }
  return false;
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

type BaseRow = typeof macrocycle.$inferSelect;

/** The stored progression curve of a macrocycle row. */
function curveOf(row: BaseRow): Curve {
  return {
    entryPct: row.entryValuePct,
    entryT: row.curveEntryT,
    anchors: row.curveAnchors,
    endPct: row.curveEndPct,
    endT: row.curveEndT,
  };
}

async function scheduleOf(macrocycleId: string): Promise<ScheduledSession[]> {
  const rows = await getDb()
    .select({
      weekday: macrocycleSession.weekday,
      slot: macrocycleSession.slot,
    })
    .from(macrocycleSession)
    .where(eq(macrocycleSession.macrocycleId, macrocycleId));
  return sortSessions(rows);
}

/** The stored columns only (no schedule, no derived count). */
type StoredBaseData = Omit<
  MacrocycleBaseData,
  "sessions" | "trainingFrequency"
>;

function baseDataOf(
  row: BaseRow,
  sessions: ScheduledSession[],
): MacrocycleBaseData {
  return {
    ...storedBaseDataOf(row),
    sessions,
    trainingFrequency: sessions.length,
  };
}

function storedBaseDataOf(row: BaseRow): StoredBaseData {
  return {
    startDate: row.startDate,
    durationWeeks: row.durationWeeks,
    entryValuePct: row.entryValuePct,
    snatchBestKg: row.snatchBestKg,
    cleanAndJerkBestKg: row.cleanAndJerkBestKg,
    snatchGoalKg: row.snatchGoalKg,
    cleanAndJerkGoalKg: row.cleanAndJerkGoalKg,
    bodyWeightKg: row.bodyWeightKg,
    targetBodyWeightKg: row.targetBodyWeightKg,
    bodyFatPct: row.bodyFatPct,
    muscleMassPct: row.muscleMassPct,
    snatchDeficits: row.snatchDeficits,
    cleanDeficits: row.cleanDeficits,
    jerkDeficits: row.jerkDeficits,
    otherDeficits: row.otherDeficits,
    injuriesAndIllnesses: row.injuriesAndIllnesses,
    strengths: row.strengths,
    experience: row.experience,
    focusPoints: row.focusPoints,
    competitionDate: row.competitionDate,
    competitionType: row.competitionType,
  };
}

/**
 * The athlete's macrocycle with all calculated weekly values, for the coach
 * of the athlete's Team or the user linked to the Athlete.
 */
export async function getMacrocycle(
  user: CurrentUser,
  athleteId: string,
): Promise<Macrocycle> {
  await requireViewableAthlete(user, athleteId);
  const row = await findMacrocycleRow(athleteId);
  if (!row) throw notFound();
  return loadMacrocycle(row);
}

/** Like `getMacrocycle`, but null when the athlete has none. */
export async function findMacrocycle(
  user: CurrentUser,
  athleteId: string,
): Promise<Macrocycle | null> {
  await requireViewableAthlete(user, athleteId);
  const row = await findMacrocycleRow(athleteId);
  return row ? loadMacrocycle(row) : null;
}

/**
 * One exercise's planned values for every week of the athlete's macrocycle,
 * independent of the exercises chosen for the mesocycles (macrocycle view).
 */
export async function getExerciseWeeks(
  user: CurrentUser,
  athleteId: string,
  exerciseNumberParam: string,
): Promise<ExerciseWeeks> {
  await requireViewableAthlete(user, athleteId);
  const number = Number(exerciseNumberParam);
  if (!Number.isInteger(number) || number < 1 || number > 32767)
    throw new DomainError("not_found", "EXERCISE_NOT_FOUND");
  const row = await findMacrocycleRow(athleteId);
  if (!row) throw notFound();
  const db = getDb();
  const [[e], weeks] = await Promise.all([
    db.select().from(exercise).where(eq(exercise.number, number)),
    db
      .select({
        number: macrocycleWeek.weekNumber,
        level: macrocycleWeek.level,
      })
      .from(macrocycleWeek)
      .where(eq(macrocycleWeek.macrocycleId, row.id))
      .orderBy(asc(macrocycleWeek.weekNumber)),
  ]);
  if (!e) throw new DomainError("not_found", "EXERCISE_NOT_FOUND");
  const values: ExerciseValues = {
    referenceLift: e.referenceLift,
    bestValuePct: e.bestValuePct,
    maxWeeklyAverageWeightPct: e.maxWeeklyAverageWeightPct,
    repsPerSet: { min: e.minRepsPerSet, max: e.maxRepsPerSet },
    repsPerWeek: { min: e.minRepsPerWeek, max: e.maxRepsPerWeek },
  };
  const goals = {
    snatchGoalKg: row.snatchGoalKg,
    cleanAndJerkGoalKg: row.cleanAndJerkGoalKg,
  };
  return {
    exerciseNumber: number,
    weeks: weeks.map((week) => ({
      number: week.number,
      ...plannedExercise(
        values,
        goals,
        curveOf(row),
        cycleProgress(week.number, row.durationWeeks),
        week.level,
      ),
    })),
  };
}

async function loadMacrocycle(row: BaseRow): Promise<Macrocycle> {
  const db = getDb();
  const [weeks, mesocycles, sessions] = await Promise.all([
    db
      .select({
        number: macrocycleWeek.weekNumber,
        level: macrocycleWeek.level,
      })
      .from(macrocycleWeek)
      .where(eq(macrocycleWeek.macrocycleId, row.id))
      .orderBy(asc(macrocycleWeek.weekNumber)),
    db
      .select()
      .from(mesocycle)
      .where(eq(mesocycle.macrocycleId, row.id))
      .orderBy(asc(mesocycle.firstWeek)),
    scheduleOf(row.id),
  ]);
  const chosen = mesocycles.length
    ? await db
        .select({
          mesocycleId: mesocycleExercise.mesocycleId,
          number: mesocycleExercise.exerciseNumber,
          variation: mesocycleExercise.variation,
          tags: mesocycleExercise.tags,
          ownReasons: mesocycleExercise.ownReasons,
        })
        .from(mesocycleExercise)
        .where(
          inArray(
            mesocycleExercise.mesocycleId,
            mesocycles.map((m) => m.id),
          ),
        )
        .orderBy(asc(mesocycleExercise.exerciseNumber))
    : [];
  const numbers = [...new Set(chosen.map((c) => c.number))];
  const catalog = numbers.length
    ? await db.select().from(exercise).where(inArray(exercise.number, numbers))
    : [];
  const values = new Map<number, ExerciseValues>(
    catalog.map((e) => [
      e.number,
      {
        referenceLift: e.referenceLift,
        bestValuePct: e.bestValuePct,
        maxWeeklyAverageWeightPct: e.maxWeeklyAverageWeightPct,
        repsPerSet: { min: e.minRepsPerSet, max: e.maxRepsPerSet },
        repsPerWeek: { min: e.minRepsPerWeek, max: e.maxRepsPerWeek },
      },
    ]),
  );

  const mesocycleViews = MESOCYCLE_TYPES.map((type) => {
    const m = mesocycles.find((x) => x.type === type);
    if (!m) throw new Error(`Macrocycle ${row.id} has no ${type} block`);
    const own = chosen.filter((c) => c.mesocycleId === m.id);
    return {
      type,
      firstWeek: m.firstWeek,
      lastWeek: m.lastWeek,
      exerciseNumbers: own.map((c) => c.number),
      exercises: own.map((c) => ({
        exerciseNumber: c.number,
        variation: c.variation,
        tags: c.tags,
        ownReasons: c.ownReasons,
      })),
    };
  });

  const curve = curveOf(row);
  const goals = {
    snatchGoalKg: row.snatchGoalKg,
    cleanAndJerkGoalKg: row.cleanAndJerkGoalKg,
  };
  const weekViews: MacrocycleWeekView[] = weeks.map((week) => {
    const t = cycleProgress(week.number, row.durationWeeks);
    const type = mesocycleOf(week.number, mesocycleViews);
    const exercises = mesocycleViews
      .find((m) => m.type === type)!
      .exerciseNumbers.map((exerciseNumber) => ({
        exerciseNumber,
        ...plannedExercise(
          values.get(exerciseNumber)!,
          goals,
          curve,
          t,
          week.level,
        ),
      }));
    return {
      number: week.number,
      startDate: addDays(row.startDate, 7 * (week.number - 1)),
      mesocycle: type,
      level: week.level,
      intensityPct: Math.round(intensity(curve, t, week.level) * 1000) / 10,
      volume: volume(exercises),
      exercises,
    };
  });

  return {
    id: row.id,
    athleteId: row.athleteId,
    ...baseDataOf(row, sessions),
    curve,
    mesocycles: mesocycleViews,
    weeks: weekViews,
  };
}

/** Step 1 for a new macrocycle: base data (empty SWOT), default mesocycles, medium weeks. */
export async function createMacrocycle(
  coach: CurrentUser,
  athleteId: string,
  input: unknown,
): Promise<Macrocycle> {
  await requireOwnAthlete(coach, athleteId);
  const data = parseInput(createBaseDataSchema, input);
  parseInput(completeBaseDataSchema, data);
  if (await findMacrocycleRow(athleteId)) {
    throw new DomainError("conflict", "MACROCYCLE_EXISTS");
  }
  const { sessions, ...stored } = data;
  try {
    await getDb().transaction(async (tx) => {
      const [created] = await tx
        .insert(macrocycle)
        .values({
          ...stored,
          ...EMPTY_SWOT,
          bodyFatPct: data.bodyFatPct ?? null,
          muscleMassPct: data.muscleMassPct ?? null,
          athleteId,
        })
        .returning({ id: macrocycle.id });
      const id = created!.id;
      await tx
        .insert(macrocycleSession)
        .values(sessions.map((s) => ({ ...s, macrocycleId: id })));
      await tx.insert(macrocycleWeek).values(
        Array.from({ length: data.durationWeeks }, (_, i) => ({
          macrocycleId: id,
          weekNumber: i + 1,
        })),
      );
      await tx.insert(mesocycle).values(
        splitMesocycles(data.durationWeeks).map((s) => ({
          ...s,
          macrocycleId: id,
        })),
      );
    });
  } catch (error) {
    if (isUniqueViolation(error))
      throw new DomainError("conflict", "MACROCYCLE_EXISTS");
    throw error;
  }
  return getMacrocycle(coach, athleteId);
}

/** Step 2: the SWOT, replaced as a whole (all fields required). */
export async function setSwot(
  coach: CurrentUser,
  athleteId: string,
  input: unknown,
): Promise<Macrocycle> {
  await requireOwnAthlete(coach, athleteId);
  const swot = parseInput(swotSchema, input);
  const row = await findMacrocycleRow(athleteId);
  if (!row) throw notFound();
  await getDb().update(macrocycle).set(swot).where(eq(macrocycle.id, row.id));
  return getMacrocycle(coach, athleteId);
}

/**
 * Step 1 for an existing macrocycle. A new duration keeps the levels of the
 * remaining weeks, adds medium weeks, and scales the mesocycle lengths to
 * the new duration while keeping each mesocycle's exercises.
 */
export async function updateBaseData(
  coach: CurrentUser,
  athleteId: string,
  input: unknown,
): Promise<Macrocycle> {
  await requireOwnAthlete(coach, athleteId);
  const patch = parseInput(updateBaseDataSchema, input);
  const row = await findMacrocycleRow(athleteId);
  if (!row) throw notFound();
  const { sessions, ...storedPatch } = patch;
  const next: StoredBaseData = { ...storedBaseDataOf(row) };
  for (const [key, value] of Object.entries(storedPatch)) {
    if (value !== undefined) Object.assign(next, { [key]: value });
  }
  parseInput(completeBaseDataSchema, next);
  // Weeks with a week plan must stay part of the macrocycle.
  if (next.durationWeeks < row.durationWeeks) {
    const [last] = await getDb()
      .select({ week: max(weekPlan.weekNumber) })
      .from(weekPlan)
      .where(eq(weekPlan.macrocycleId, row.id));
    if (last?.week && next.durationWeeks < last.week)
      throw new DomainValidationError({ durationWeeks: ["WEEKS_PLANNED"] });
  }

  await getDb().transaction(async (tx) => {
    await tx.update(macrocycle).set(next).where(eq(macrocycle.id, row.id));
    if (sessions) {
      await tx
        .delete(macrocycleSession)
        .where(eq(macrocycleSession.macrocycleId, row.id));
      await tx
        .insert(macrocycleSession)
        .values(sessions.map((s) => ({ ...s, macrocycleId: row.id })));
    }
    if (next.durationWeeks !== row.durationWeeks) {
      await tx
        .delete(macrocycleWeek)
        .where(
          and(
            eq(macrocycleWeek.macrocycleId, row.id),
            gt(macrocycleWeek.weekNumber, next.durationWeeks),
          ),
        );
      if (next.durationWeeks > row.durationWeeks) {
        await tx.insert(macrocycleWeek).values(
          Array.from(
            { length: next.durationWeeks - row.durationWeeks },
            (_, i) => ({
              macrocycleId: row.id,
              weekNumber: row.durationWeeks + i + 1,
            }),
          ),
        );
      }
      const current = await tx
        .select({
          type: mesocycle.type,
          firstWeek: mesocycle.firstWeek,
          lastWeek: mesocycle.lastWeek,
        })
        .from(mesocycle)
        .where(eq(mesocycle.macrocycleId, row.id))
        .orderBy(asc(mesocycle.firstWeek));
      for (const span of scaleMesocycles(current, next.durationWeeks)) {
        await tx
          .update(mesocycle)
          .set({ firstWeek: span.firstWeek, lastWeek: span.lastWeek })
          .where(
            and(
              eq(mesocycle.macrocycleId, row.id),
              eq(mesocycle.type, span.type),
            ),
          );
      }
    }
  });
  return getMacrocycle(coach, athleteId);
}

const levelSchema = z.strictObject({
  level: z.enum(["high", "medium", "low"]),
});

/** Step 2: the level of one week. */
export async function setWeekLevel(
  coach: CurrentUser,
  athleteId: string,
  week: number,
  input: unknown,
): Promise<Macrocycle> {
  await requireOwnAthlete(coach, athleteId);
  const { level } = parseInput(levelSchema, input) as { level: WeekLevel };
  const row = await findMacrocycleRow(athleteId);
  if (!row) throw notFound();
  if (!Number.isInteger(week) || week < 1 || week > row.durationWeeks) {
    throw new DomainError("not_found", "WEEK_NOT_FOUND");
  }
  await getDb()
    .update(macrocycleWeek)
    .set({ level })
    .where(
      and(
        eq(macrocycleWeek.macrocycleId, row.id),
        eq(macrocycleWeek.weekNumber, week),
      ),
    );
  return getMacrocycle(coach, athleteId);
}

const choiceCode = (value: string) => ({ params: { code: value } });
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .refine((v) => v.length <= max, choiceCode("TOO_LONG"))
    .nullish()
    .transform((v) => (v ? v : null));
const choiceSchema = z
  .strictObject({
    tags: z
      .array(z.string())
      .max(20)
      .refine(
        (list) => new Set(list).size === list.length,
        choiceCode("DUPLICATE"),
      )
      .default([]),
    ownReasons: z
      .array(
        z
          .string()
          .trim()
          .refine((v) => v.length > 0, choiceCode("REQUIRED"))
          .refine((v) => v.length <= 200, choiceCode("TOO_LONG")),
      )
      .max(10)
      .refine(
        (list) => new Set(list).size === list.length,
        choiceCode("DUPLICATE"),
      )
      .default([]),
    variation: optionalText(200),
  })
  // The reason is the tags and/or the note: at least one is required.
  .refine((v) => v.tags.length > 0 || v.ownReasons.length > 0, {
    path: ["reason"],
    params: { code: "REQUIRED" },
  });

export function isMesocycleType(value: string): value is MesocycleType {
  return (MESOCYCLE_TYPES as readonly string[]).includes(value);
}

/** The macrocycle row and the id of one of its mesocycles. */
async function findMesocycle(
  coach: CurrentUser,
  athleteId: string,
  type: string,
): Promise<string> {
  await requireOwnAthlete(coach, athleteId);
  if (!isMesocycleType(type))
    throw new DomainError("not_found", "MESOCYCLE_NOT_FOUND");
  const row = await findMacrocycleRow(athleteId);
  if (!row) throw notFound();
  const [m] = await getDb()
    .select({ id: mesocycle.id })
    .from(mesocycle)
    .where(and(eq(mesocycle.macrocycleId, row.id), eq(mesocycle.type, type)));
  return m!.id;
}

function exerciseNumberOf(value: string): number {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0)
    throw new DomainError("not_found", "EXERCISE_NOT_FOUND");
  return number;
}

/**
 * Step 3: choose one exercise for a mesocycle, or change its variation and
 * reason. The reason (tags the exercise addresses and/or own reasons) is
 * required; the variation is information only.
 */
export async function setMesocycleExercise(
  coach: CurrentUser,
  athleteId: string,
  type: string,
  exerciseNumberParam: string,
  input: unknown,
): Promise<Macrocycle> {
  const mesocycleId = await findMesocycle(coach, athleteId, type);
  const exerciseNumber = exerciseNumberOf(exerciseNumberParam);
  const { tags, ownReasons, variation } = parseInput(choiceSchema, input);
  const [known] = await getDb()
    .select({ number: exercise.number })
    .from(exercise)
    .where(eq(exercise.number, exerciseNumber));
  if (!known) throw new DomainError("not_found", "EXERCISE_NOT_FOUND");
  if (tags.length > 0) {
    const addressed = await getDb()
      .select({ tag: exerciseAddresses.tag })
      .from(exerciseAddresses)
      .where(eq(exerciseAddresses.exerciseNumber, exerciseNumber));
    const allowed = new Set(addressed.map((a) => a.tag));
    if (tags.some((tag) => !allowed.has(tag))) {
      throw new DomainValidationError({ tags: ["UNKNOWN_TAG"] });
    }
  }
  const values = { tags, ownReasons, variation };
  await getDb()
    .insert(mesocycleExercise)
    .values({ mesocycleId, exerciseNumber, ...values })
    .onConflictDoUpdate({
      target: [mesocycleExercise.mesocycleId, mesocycleExercise.exerciseNumber],
      set: values,
    });
  return getMacrocycle(coach, athleteId);
}

/** Step 3: remove one exercise from a mesocycle (no error if not chosen). */
export async function removeMesocycleExercise(
  coach: CurrentUser,
  athleteId: string,
  type: string,
  exerciseNumberParam: string,
): Promise<void> {
  const mesocycleId = await findMesocycle(coach, athleteId, type);
  const exerciseNumber = exerciseNumberOf(exerciseNumberParam);
  await getDb()
    .delete(mesocycleExercise)
    .where(
      and(
        eq(mesocycleExercise.mesocycleId, mesocycleId),
        eq(mesocycleExercise.exerciseNumber, exerciseNumber),
      ),
    );
}

const bordersSchema = z.strictObject({
  specialPreparationStart: z.number(),
  competitionPreparationStart: z.number(),
});

/** Step 2: the first weeks of the special and competition preparation blocks. */
export async function setMesocycleBorders(
  coach: CurrentUser,
  athleteId: string,
  input: unknown,
): Promise<Macrocycle> {
  await requireOwnAthlete(coach, athleteId);
  const { specialPreparationStart, competitionPreparationStart } = parseInput(
    bordersSchema,
    input,
  );
  const row = await findMacrocycleRow(athleteId);
  if (!row) throw notFound();
  if (
    !bordersAreValid(
      row.durationWeeks,
      specialPreparationStart,
      competitionPreparationStart,
    )
  ) {
    throw new DomainValidationError({ _root: ["INVALID_BORDERS"] });
  }
  await getDb().transaction(async (tx) => {
    for (const span of spansFromBorders(
      row.durationWeeks,
      specialPreparationStart,
      competitionPreparationStart,
    )) {
      await tx
        .update(mesocycle)
        .set({ firstWeek: span.firstWeek, lastWeek: span.lastWeek })
        .where(
          and(
            eq(mesocycle.macrocycleId, row.id),
            eq(mesocycle.type, span.type),
          ),
        );
    }
  });
  return getMacrocycle(coach, athleteId);
}

/** Most inner anchors a curve may have. */
export const MAX_CURVE_ANCHORS = 20;
/** Smallest distance between two anchor positions (equal ones break the spline). */
const MIN_ANCHOR_DISTANCE = 0.001;

const oneDecimal = (v: number) => Math.round(v * 10) / 10 === v;
const position = z
  .number()
  .refine((v) => v >= 0 && v <= 1, { params: { code: "OUT_OF_RANGE" } });
const curveSchema = z.strictObject({
  entryT: position.optional(),
  endT: position.optional(),
  endValuePct: z
    .number()
    .refine((v) => v >= 0 && v <= 100, { params: { code: "OUT_OF_RANGE" } })
    .refine(oneDecimal, { params: { code: "TOO_PRECISE" } })
    .optional(),
  entryValuePct: z
    .number()
    .refine(Number.isFinite, { params: { code: "INVALID_TYPE" } })
    .refine((v) => v >= 30 && v <= 95, { params: { code: "OUT_OF_RANGE" } })
    .refine(oneDecimal, { params: { code: "TOO_PRECISE" } }),
  anchors: z
    .array(
      z.strictObject({
        t: z
          .number()
          .refine((v) => v > 0 && v < 1, { params: { code: "OUT_OF_RANGE" } }),
        pct: z
          .number()
          .refine((v) => v >= 0 && v <= 100, {
            params: { code: "OUT_OF_RANGE" },
          })
          .refine(oneDecimal, { params: { code: "TOO_PRECISE" } }),
      }),
    )
    .refine((list) => list.length <= MAX_CURVE_ANCHORS, {
      params: { code: "TOO_MANY" },
    })
    .refine(
      (list) => {
        const ts = list.map((a) => a.t).sort((a, b) => a - b);
        return ts.every(
          (t, i) => i === 0 || t - ts[i - 1]! >= MIN_ANCHOR_DISTANCE,
        );
      },
      { params: { code: "TOO_CLOSE" } },
    ),
});

/**
 * Step 3, curve mode: the entry value (the first anchor) and the inner
 * anchors of the progression curve, stored together.
 */
export async function setCurve(
  coach: CurrentUser,
  athleteId: string,
  input: unknown,
): Promise<Macrocycle> {
  await requireOwnAthlete(coach, athleteId);
  const {
    entryValuePct,
    anchors,
    entryT = 0,
    endT = 1,
    endValuePct = 100,
  } = parseInput(curveSchema, input);
  // The inner anchors lie strictly between the entry and the end anchor.
  const sorted = [...anchors].sort((a, b) => a.t - b.t);
  const positions = [entryT, ...sorted.map((a) => a.t), endT];
  if (
    positions.some(
      (t, i) => i > 0 && t - positions[i - 1]! < MIN_ANCHOR_DISTANCE,
    )
  ) {
    throw new DomainValidationError({ anchors: ["OUTSIDE_ENDS"] });
  }
  const row = await findMacrocycleRow(athleteId);
  if (!row) throw notFound();
  await getDb()
    .update(macrocycle)
    .set({
      entryValuePct,
      curveEntryT: entryT,
      curveAnchors: sorted,
      curveEndPct: endValuePct,
      curveEndT: endT,
    })
    .where(eq(macrocycle.id, row.id));
  return getMacrocycle(coach, athleteId);
}
