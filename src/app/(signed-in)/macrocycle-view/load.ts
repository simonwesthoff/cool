import { today } from "@/domain/athletes/basic-data";
import type { CurrentUser } from "@/domain/auth";
import { getExercisesWithValues } from "@/domain/exercises";
import { getTrainingWeeks } from "@/domain/week-plans";
import {
  canPlanMacrocycle,
  findMacrocycle,
  getExerciseWeeks,
} from "@/domain/macrocycles";

/** The exercise the macrocycle view shows first: the snatch. */
export const DEFAULT_EXERCISE = 1;

/**
 * Data of the macrocycle view (coach and athlete page): the macrocycle, the
 * snatch values, the exercises that can be chosen, today and the link to
 * change the planning if the user may. Null when the
 * athlete has no macrocycle.
 */
export async function loadMacrocycleView(user: CurrentUser, athleteId: string) {
  const macrocycle = await findMacrocycle(user, athleteId);
  if (!macrocycle) return null;
  const [initialValues, exercises, canPlan] = await Promise.all([
    getExerciseWeeks(user, athleteId, String(DEFAULT_EXERCISE)),
    getExercisesWithValues(),
    canPlanMacrocycle(user, athleteId),
  ]);
  return {
    macrocycle,
    initialValues,
    exercises: exercises.map((e) => ({ number: e.number, name: e.name })),
    today: today(),
    // "Change planning" only for the coach of the athlete's Team, on
    // whichever page the view is opened.
    editHref: canPlan
      ? `/athletes/${athleteId}/macrocycle/base-data`
      : undefined,
  };
}

/**
 * Data of the macrocycle chart on the athlete's page: the macrocycle, the
 * snatch values and today. Null when the athlete has no macrocycle.
 */
export async function loadMacrocycleChart(
  user: CurrentUser,
  athleteId: string,
) {
  const macrocycle = await findMacrocycle(user, athleteId);
  if (!macrocycle) return null;
  const values = await getExerciseWeeks(
    user,
    athleteId,
    String(DEFAULT_EXERCISE),
  );
  return { macrocycle, values, today: today() };
}

/** The week planning entry points of the athlete page; null without a macrocycle. */
export async function loadTrainingWeeks(user: CurrentUser, athleteId: string) {
  return getTrainingWeeks(user, athleteId, today());
}
