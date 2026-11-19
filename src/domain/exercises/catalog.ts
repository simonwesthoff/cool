import { asc, eq, inArray } from "drizzle-orm";
import { DomainError } from "@/domain/errors";
import { getDb } from "@/server/db";
import {
  exercise,
  exerciseAddresses,
  exerciseGroup,
  exerciseTag,
} from "@/server/db/schema";
import {
  LIFT_CATEGORIES,
  type Exercise,
  type ExerciseGroup,
  type ExerciseTag,
} from "./catalog-types";

type ExerciseRow = typeof exercise.$inferSelect;

/** Addressed points per exercise number, in catalog order. */
async function addressesOf(
  numbers?: number[],
): Promise<Map<number, ExerciseTag[]>> {
  const query = getDb()
    .select({
      exerciseNumber: exerciseAddresses.exerciseNumber,
      nameDe: exerciseTag.nameDe,
      nameEn: exerciseTag.nameEn,
    })
    .from(exerciseAddresses)
    .innerJoin(exerciseTag, eq(exerciseTag.nameDe, exerciseAddresses.tag));
  const rows = await (
    numbers
      ? query.where(inArray(exerciseAddresses.exerciseNumber, numbers))
      : query
  ).orderBy(
    asc(exerciseAddresses.exerciseNumber),
    asc(exerciseAddresses.position),
  );
  const map = new Map<number, ExerciseTag[]>();
  for (const row of rows) {
    const list = map.get(row.exerciseNumber) ?? [];
    list.push({ key: row.nameDe, name: { de: row.nameDe, en: row.nameEn } });
    map.set(row.exerciseNumber, list);
  }
  return map;
}

function toExercise(
  row: ExerciseRow,
  addresses: Map<number, ExerciseTag[]>,
): Exercise {
  return {
    number: row.number,
    groupNumber: row.groupNumber,
    name: { de: row.nameDe, en: row.nameEn },
    referenceLift: row.referenceLift,
    bestValuePct: row.bestValuePct,
    maxWeeklyAverageWeightPct: row.maxWeeklyAverageWeightPct,
    repsPerSet: { min: row.minRepsPerSet, max: row.maxRepsPerSet },
    repsPerWeek: { min: row.minRepsPerWeek, max: row.maxRepsPerWeek },
    comment:
      row.commentDe !== null && row.commentEn !== null
        ? { de: row.commentDe, en: row.commentEn }
        : null,
    addresses: addresses.get(row.number) ?? [],
    liftCategories: LIFT_CATEGORIES.filter((c) =>
      row.liftCategories.includes(c),
    ),
  };
}

/** The whole catalog: groups K1–K9 in order, each with its exercises in order. */
export async function getCatalog(): Promise<ExerciseGroup[]> {
  const db = getDb();
  const [groups, exercises, addresses] = await Promise.all([
    db.select().from(exerciseGroup).orderBy(asc(exerciseGroup.number)),
    db.select().from(exercise).orderBy(asc(exercise.number)),
    addressesOf(),
  ]);
  return groups.map((group) => ({
    number: group.number,
    code: group.code,
    name: { de: group.nameDe, en: group.nameEn },
    exercises: exercises
      .filter((row) => row.groupNumber === group.number)
      .map((row) => toExercise(row, addresses)),
  }));
}

/** One exercise with its group; `EXERCISE_NOT_FOUND` for unknown numbers. */
export async function getExercise(
  number: number,
): Promise<{ exercise: Exercise; group: Omit<ExerciseGroup, "exercises"> }> {
  if (!Number.isInteger(number) || number < 1 || number > 32767) {
    throw new DomainError("not_found", "EXERCISE_NOT_FOUND");
  }
  const [row] = await getDb()
    .select({ exercise, group: exerciseGroup })
    .from(exercise)
    .innerJoin(exerciseGroup, eq(exerciseGroup.number, exercise.groupNumber))
    .where(eq(exercise.number, number));
  if (!row) throw new DomainError("not_found", "EXERCISE_NOT_FOUND");
  return {
    exercise: toExercise(row.exercise, await addressesOf([number])),
    group: {
      number: row.group.number,
      code: row.group.code,
      name: { de: row.group.nameDe, en: row.group.nameEn },
    },
  };
}

/**
 * Exercises with reference values (a best value and reps per week), in
 * catalog order: those whose planned values can be shown (exercises 1–29).
 */
export async function getExercisesWithValues(): Promise<Exercise[]> {
  return (await getCatalog())
    .flatMap((group) => group.exercises)
    .filter(
      (e) =>
        e.bestValuePct !== null &&
        e.repsPerWeek.min !== null &&
        e.repsPerWeek.max !== null,
    );
}
