import { and, asc, eq, gt, inArray } from "drizzle-orm";
import { findAthleteInTeam } from "@/domain/athletes";
import type { CurrentUser } from "@/domain/auth";
import { DomainError } from "@/domain/errors";
import { requireCoachTeam } from "@/domain/roles";
import { DomainValidationError, parseInput } from "@/domain/validation";
import { z } from "zod";
import { getDb } from "@/server/db";
import {
  exercise,
  macrocycle,
  macrocycleWeek,
  mesocycle,
  mesocycleExercise,
} from "@/server/db/schema";
import {
  completeBaseDataSchema,
  createBaseDataSchema,
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
  type ExerciseValues,
  type MesocycleType,
  type WeekLevel,
} from "./calculation";
import type {
  Macrocycle,
  MacrocycleBaseData,
  MacrocycleWeekView,
} from "./macrocycle-types";

const notFound = () => new DomainError("not_found", "MACROCYCLE_NOT_FOUND");

async function requireOwnAthlete(coach: CurrentUser, athleteId: string) {
  const { id: teamId } = await requireCoachTeam(coach);
  const found = await findAthleteInTeam(teamId, athleteId);
  if (!found) throw new DomainError("not_found", "ATHLETE_NOT_FOUND");
  return found;
}

async function findMacrocycleRow(athleteId: string) {
  const [row] = await getDb()
    .select()
    .from(macrocycle)
    .where(eq(macrocycle.athleteId, athleteId));
  return row;
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

function baseDataOf(row: BaseRow): MacrocycleBaseData {
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
    deficits: row.deficits,
    injuriesAndIllnesses: row.injuriesAndIllnesses,
    strengths: row.strengths,
    experience: row.experience,
    trainingFrequency: row.trainingFrequency,
    focusPoints: row.focusPoints,
    competitionDate: row.competitionDate,
    competitionType: row.competitionType,
  };
}

/** The athlete's macrocycle with all calculated weekly values. */
export async function getMacrocycle(
  coach: CurrentUser,
  athleteId: string,
): Promise<Macrocycle> {
  await requireOwnAthlete(coach, athleteId);
  const row = await findMacrocycleRow(athleteId);
  if (!row) throw notFound();
  return loadMacrocycle(row);
}

/** Like `getMacrocycle`, but null when the athlete has none. */
export async function findMacrocycle(
  coach: CurrentUser,
  athleteId: string,
): Promise<Macrocycle | null> {
  await requireOwnAthlete(coach, athleteId);
  const row = await findMacrocycleRow(athleteId);
  return row ? loadMacrocycle(row) : null;
}

async function loadMacrocycle(row: BaseRow): Promise<Macrocycle> {
  const db = getDb();
  const [weeks, mesocycles] = await Promise.all([
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
  ]);
  const chosen = mesocycles.length
    ? await db
        .select({
          mesocycleId: mesocycleExercise.mesocycleId,
          number: mesocycleExercise.exerciseNumber,
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
    return {
      type,
      firstWeek: m.firstWeek,
      lastWeek: m.lastWeek,
      exerciseNumbers: chosen
        .filter((c) => c.mesocycleId === m.id)
        .map((c) => c.number),
    };
  });

  const entry = row.entryValuePct / 100;
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
          entry,
          t,
          week.level,
        ),
      }));
    return {
      number: week.number,
      startDate: addDays(row.startDate, 7 * (week.number - 1)),
      mesocycle: type,
      level: week.level,
      intensityPct: Math.round(intensity(entry, t, week.level) * 1000) / 10,
      volume: volume(exercises),
      exercises,
    };
  });

  return {
    id: row.id,
    athleteId: row.athleteId,
    ...baseDataOf(row),
    mesocycles: mesocycleViews,
    weeks: weekViews,
  };
}

/** Step 1 for a new macrocycle: base data, default mesocycles, medium weeks. */
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
  try {
    await getDb().transaction(async (tx) => {
      const [created] = await tx
        .insert(macrocycle)
        .values({
          ...data,
          bodyFatPct: data.bodyFatPct ?? null,
          muscleMassPct: data.muscleMassPct ?? null,
          athleteId,
        })
        .returning({ id: macrocycle.id });
      const id = created!.id;
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
  const next: MacrocycleBaseData = { ...baseDataOf(row) };
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) Object.assign(next, { [key]: value });
  }
  parseInput(completeBaseDataSchema, next);

  await getDb().transaction(async (tx) => {
    await tx.update(macrocycle).set(next).where(eq(macrocycle.id, row.id));
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

const exercisesSchema = z.strictObject({
  exerciseNumbers: z
    .array(z.number().int().positive())
    .max(45)
    .refine((list) => new Set(list).size === list.length, {
      params: { code: "DUPLICATE" },
    }),
});

export function isMesocycleType(value: string): value is MesocycleType {
  return (MESOCYCLE_TYPES as readonly string[]).includes(value);
}

/** Step 3: the exercises of one mesocycle (replaces the previous choice). */
export async function setMesocycleExercises(
  coach: CurrentUser,
  athleteId: string,
  type: string,
  input: unknown,
): Promise<Macrocycle> {
  await requireOwnAthlete(coach, athleteId);
  if (!isMesocycleType(type))
    throw new DomainError("not_found", "MESOCYCLE_NOT_FOUND");
  const { exerciseNumbers } = parseInput(exercisesSchema, input);
  const row = await findMacrocycleRow(athleteId);
  if (!row) throw notFound();
  if (exerciseNumbers.length > 0) {
    const known = await getDb()
      .select({ number: exercise.number })
      .from(exercise)
      .where(inArray(exercise.number, exerciseNumbers));
    if (known.length !== exerciseNumbers.length) {
      throw new DomainError("invalid", "UNKNOWN_EXERCISE");
    }
  }
  await getDb().transaction(async (tx) => {
    const [m] = await tx
      .select({ id: mesocycle.id })
      .from(mesocycle)
      .where(and(eq(mesocycle.macrocycleId, row.id), eq(mesocycle.type, type)));
    await tx
      .delete(mesocycleExercise)
      .where(eq(mesocycleExercise.mesocycleId, m!.id));
    if (exerciseNumbers.length > 0) {
      await tx.insert(mesocycleExercise).values(
        exerciseNumbers.map((exerciseNumber) => ({
          mesocycleId: m!.id,
          exerciseNumber,
        })),
      );
    }
  });
  return getMacrocycle(coach, athleteId);
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
