import { today } from "@/domain/athletes/basic-data";
import type { CurrentUser } from "@/domain/auth";
import { getExercisesWithValues } from "@/domain/exercises";
import { findMacrocycle, getExerciseWeeks } from "@/domain/macrocycles";

/** The exercise the macrocycle view shows first: the snatch. */
export const DEFAULT_EXERCISE = 1;

/**
 * Data of the macrocycle view (coach and athlete page): the macrocycle, the
 * snatch values, the exercises that can be chosen and today. Null when the
 * athlete has no macrocycle.
 */
export async function loadMacrocycleView(user: CurrentUser, athleteId: string) {
  const macrocycle = await findMacrocycle(user, athleteId);
  if (!macrocycle) return null;
  const [initialValues, exercises] = await Promise.all([
    getExerciseWeeks(user, athleteId, String(DEFAULT_EXERCISE)),
    getExercisesWithValues(),
  ]);
  return {
    macrocycle,
    initialValues,
    exercises: exercises.map((e) => ({ number: e.number, name: e.name })),
    today: today(),
  };
}
