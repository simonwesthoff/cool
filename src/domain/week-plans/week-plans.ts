import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { CurrentUser } from "@/domain/auth";
import { DomainError } from "@/domain/errors";
import {
  findMacrocycleRow,
  requireOwnAthlete,
  requireViewableAthlete,
} from "@/domain/macrocycles/access";
import {
  cycleProgress,
  mesocycleOf,
  plannedExercise,
  type PlannedExercise,
} from "@/domain/macrocycles/calculation";
import { DomainValidationError, parseInput } from "@/domain/validation";
import { currentAndNextWeek, isoWeek } from "./calculation";
import { getRoles } from "@/domain/roles";
import { getDb } from "@/server/db";
import {
  exercise,
  macrocycleSession,
  macrocycleWeek,
  mesocycle,
  mesocycleExercise,
  sessionExercise,
  setGroup,
  trainingSession,
  weekPlan,
} from "@/server/db/schema";
import type {
  InitialSource,
  PlannedSession,
  PlannedWeekSummary,
  CurrentWeek,
  TrainingWeeks,
  WeekPlan,
} from "./week-plan-types";

export const MAX_SESSIONS = 14;
export const MAX_SETS = 10;
export const NOTE_MAX_LENGTH = 500;

const code = (value: string) => ({ params: { code: value } });
const int = (min: number, max: number) =>
  z
    .number()
    .refine(Number.isInteger, code("NOT_INTEGER"))
    .refine((v) => v >= min && v <= max, code("OUT_OF_RANGE"));

const setGroupSchema = z.strictObject({
  sets: int(1, MAX_SETS),
  reps: int(1, 30),
  weightKg: z
    .number()
    .refine((v) => v >= 0 && v <= 500, code("OUT_OF_RANGE"))
    .refine((v) => Number.isInteger(v * 2), code("NOT_HALF_KG"))
    .nullable(),
});

const sessionExerciseSchema = z.strictObject({
  exerciseNumber: int(1, 32767),
  note: z
    .string()
    .trim()
    .refine((v) => v.length <= NOTE_MAX_LENGTH, code("TOO_LONG"))
    .nullable()
    .optional()
    .transform((v) => (v ? v : null)),
  // Exercises from 30 on have no values: their sets are free text.
  freeText: z
    .string()
    .trim()
    .refine((v) => v.length <= NOTE_MAX_LENGTH, code("TOO_LONG"))
    .nullable()
    .optional()
    .transform((v) => (v ? v : null)),
  // Set groups are entered in step 2; a week can be saved before. At most
  // 10 sets per exercise in a session.
  setGroups: z
    .array(setGroupSchema)
    .refine(
      (list) => list.reduce((sum, g) => sum + g.sets, 0) <= MAX_SETS,
      code("TOO_MANY"),
    ),
});

const sessionSchema = z.strictObject({
  weekday: int(1, 7),
  slot: int(1, 3),
  exercises: z
    .array(sessionExerciseSchema)
    .refine(
      (list) => new Set(list.map((e) => e.exerciseNumber)).size === list.length,
      code("DUPLICATE"),
    ),
});

/** A whole week plan; no sessions removes the plan. */
export const weekPlanInputSchema = z.strictObject({
  sessions: z
    .array(sessionSchema)
    .refine((list) => list.length <= MAX_SESSIONS, code("TOO_MANY"))
    .refine(
      (list) =>
        new Set(list.map((s) => `${s.weekday}.${s.slot}`)).size === list.length,
      code("DUPLICATE"),
    ),
});

const weekNotFound = () => new DomainError("not_found", "WEEK_NOT_FOUND");
const macrocycleNotFound = () =>
  new DomainError("not_found", "MACROCYCLE_NOT_FOUND");

type MacrocycleRow = NonNullable<Awaited<ReturnType<typeof findMacrocycleRow>>>;

async function macrocycleAndWeek(athleteId: string, weekParam: string) {
  const row = await findMacrocycleRow(athleteId);
  if (!row) throw macrocycleNotFound();
  const week = Number(weekParam);
  if (!Number.isInteger(week) || week < 1 || week > row.durationWeeks)
    throw weekNotFound();
  return { row, week };
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const byWeekOrder = (a: PlannedSession, b: PlannedSession) =>
  a.weekday - b.weekday || a.slot - b.slot;

/** The stored sessions of a week, or null without a plan. */
async function storedSessions(
  macrocycleId: string,
  week: number,
): Promise<PlannedSession[] | null> {
  const db = getDb();
  const [plan] = await db
    .select({ id: weekPlan.id })
    .from(weekPlan)
    .where(
      and(
        eq(weekPlan.macrocycleId, macrocycleId),
        eq(weekPlan.weekNumber, week),
      ),
    );
  if (!plan) return null;
  const sessions = await db
    .select()
    .from(trainingSession)
    .where(eq(trainingSession.weekPlanId, plan.id));
  const exercises = sessions.length
    ? await db
        .select()
        .from(sessionExercise)
        .where(
          inArray(
            sessionExercise.sessionId,
            sessions.map((s) => s.id),
          ),
        )
        .orderBy(asc(sessionExercise.position))
    : [];
  const groups = exercises.length
    ? await db
        .select()
        .from(setGroup)
        .where(
          inArray(
            setGroup.sessionExerciseId,
            exercises.map((e) => e.id),
          ),
        )
        .orderBy(asc(setGroup.position))
    : [];
  return sessions
    .map((s) => ({
      weekday: s.weekday,
      slot: s.slot,
      exercises: exercises
        .filter((e) => e.sessionId === s.id)
        .map((e) => ({
          exerciseNumber: e.exerciseNumber,
          note: e.note,
          freeText: e.freeText,
          feedback: e.feedback,
          setGroups: groups
            .filter((g) => g.sessionExerciseId === e.id)
            .map((g) => ({ sets: g.sets, reps: g.reps, weightKg: g.weightKg })),
        })),
    }))
    .sort(byWeekOrder);
}

async function weekPlanOf(row: MacrocycleRow, week: number): Promise<WeekPlan> {
  const db = getDb();
  const [[level], spans, sessions] = await Promise.all([
    db
      .select({ level: macrocycleWeek.level })
      .from(macrocycleWeek)
      .where(
        and(
          eq(macrocycleWeek.macrocycleId, row.id),
          eq(macrocycleWeek.weekNumber, week),
        ),
      ),
    db.select().from(mesocycle).where(eq(mesocycle.macrocycleId, row.id)),
    storedSessions(row.id, week),
  ]);
  const type = mesocycleOf(week, spans);
  const block = spans.find((s) => s.type === type)!;
  const chosenRows = await db
    .select({
      number: mesocycleExercise.exerciseNumber,
      variation: mesocycleExercise.variation,
    })
    .from(mesocycleExercise)
    .where(eq(mesocycleExercise.mesocycleId, block.id))
    .orderBy(asc(mesocycleExercise.exerciseNumber));
  const chosen = chosenRows.map((c) => c.number);
  const list = sessions ?? [];
  const onWeek = [
    ...new Set(list.flatMap((s) => s.exercises.map((e) => e.exerciseNumber))),
  ].sort((a, b) => a - b);
  return {
    weekNumber: week,
    durationWeeks: row.durationWeeks,
    startDate: addDays(row.startDate, 7 * (week - 1)),
    mesocycle: type,
    level: level?.level ?? "medium",
    planned: sessions !== null,
    sessions: list,
    check: {
      chosen,
      missing: chosen.filter((n) => !onWeek.includes(n)),
      notPlanned: onWeek.filter((n) => !chosen.includes(n)),
    },
    variations: Object.fromEntries(
      chosenRows
        .filter((c) => c.variation)
        .map((c) => [c.number, c.variation!]),
    ),
  };
}

/** A week of the athlete's macrocycle with its plan, for the coach and the linked athlete. */
export async function getWeekPlan(
  user: CurrentUser,
  athleteId: string,
  weekParam: string,
): Promise<WeekPlan> {
  await requireViewableAthlete(user, athleteId);
  const { row, week } = await macrocycleAndWeek(athleteId, weekParam);
  return weekPlanOf(row, week);
}

/** The planned weeks of the athlete's macrocycle, ascending. */
export async function listWeekPlans(
  user: CurrentUser,
  athleteId: string,
): Promise<PlannedWeekSummary[]> {
  await requireViewableAthlete(user, athleteId);
  const row = await findMacrocycleRow(athleteId);
  if (!row) throw macrocycleNotFound();
  const rows = await getDb()
    .select({ weekNumber: weekPlan.weekNumber })
    .from(weekPlan)
    .where(eq(weekPlan.macrocycleId, row.id))
    .orderBy(asc(weekPlan.weekNumber));
  return rows.map((r) => ({
    weekNumber: r.weekNumber,
    startDate: addDays(row.startDate, 7 * (r.weekNumber - 1)),
  }));
}

/** Saves a week as a whole (coach only); a week without sessions is no longer planned. */
export async function saveWeekPlan(
  coach: CurrentUser,
  athleteId: string,
  weekParam: string,
  input: unknown,
): Promise<WeekPlan> {
  await requireOwnAthlete(coach, athleteId);
  const { row, week } = await macrocycleAndWeek(athleteId, weekParam);
  const { sessions } = parseInput(weekPlanInputSchema, input);

  // Every exercise must exist in the catalog.
  const numbers = [
    ...new Set(
      sessions.flatMap((s) => s.exercises.map((e) => e.exerciseNumber)),
    ),
  ];
  const known = new Set(
    numbers.length
      ? (
          await getDb()
            .select({ number: exercise.number })
            .from(exercise)
            .where(inArray(exercise.number, numbers))
        ).map((e) => e.number)
      : [],
  );
  const unknown: Record<string, string[]> = {};
  sessions.forEach((s, i) =>
    s.exercises.forEach((e, j) => {
      if (!known.has(e.exerciseNumber))
        unknown[`sessions.${i}.exercises.${j}.exerciseNumber`] = [
          "UNKNOWN_EXERCISE",
        ];
    }),
  );
  if (Object.keys(unknown).length) throw new DomainValidationError(unknown);

  await getDb().transaction(async (tx) => {
    // The athlete's feedback stays with the same exercise in the same
    // session (weekday, slot, exercise); the plan payload cannot set it.
    const kept = new Map(
      (
        await tx
          .select({
            weekday: trainingSession.weekday,
            slot: trainingSession.slot,
            exerciseNumber: sessionExercise.exerciseNumber,
            feedback: sessionExercise.feedback,
          })
          .from(sessionExercise)
          .innerJoin(
            trainingSession,
            eq(sessionExercise.sessionId, trainingSession.id),
          )
          .innerJoin(weekPlan, eq(trainingSession.weekPlanId, weekPlan.id))
          .where(
            and(
              eq(weekPlan.macrocycleId, row.id),
              eq(weekPlan.weekNumber, week),
            ),
          )
      )
        .filter((r) => r.feedback)
        .map((r) => [`${r.weekday}.${r.slot}.${r.exerciseNumber}`, r.feedback]),
    );
    await tx
      .delete(weekPlan)
      .where(
        and(eq(weekPlan.macrocycleId, row.id), eq(weekPlan.weekNumber, week)),
      );
    if (sessions.length === 0) return;
    const [plan] = await tx
      .insert(weekPlan)
      .values({ macrocycleId: row.id, weekNumber: week })
      .returning({ id: weekPlan.id });
    for (const s of sessions) {
      const [session] = await tx
        .insert(trainingSession)
        .values({ weekPlanId: plan!.id, weekday: s.weekday, slot: s.slot })
        .returning({ id: trainingSession.id });
      for (const [position, e] of s.exercises.entries()) {
        const [created] = await tx
          .insert(sessionExercise)
          .values({
            sessionId: session!.id,
            position,
            exerciseNumber: e.exerciseNumber,
            note: e.note,
            freeText: e.freeText,
            feedback:
              kept.get(`${s.weekday}.${s.slot}.${e.exerciseNumber}`) ?? null,
          })
          .returning({ id: sessionExercise.id });
        if (e.setGroups.length)
          await tx.insert(setGroup).values(
            e.setGroups.map((g, groupPosition) => ({
              ...g,
              sessionExerciseId: created!.id,
              position: groupPosition,
            })),
          );
      }
    }
  });
  return weekPlanOf(row, week);
}

/**
 * What the week editor starts with (coach only): the stored plan; else,
 * when asked, a copy of the previous week (with coach notes); else the
 * macrocycle's weekly schedule without exercises.
 */
export async function initialWeekContent(
  coach: CurrentUser,
  athleteId: string,
  weekParam: string,
  prefillFromPrevious: boolean,
): Promise<{
  plan: WeekPlan;
  sessions: PlannedSession[];
  source: InitialSource;
}> {
  await requireOwnAthlete(coach, athleteId);
  const { row, week } = await macrocycleAndWeek(athleteId, weekParam);
  const plan = await weekPlanOf(row, week);
  if (plan.planned) return { plan, sessions: plan.sessions, source: "stored" };
  if (prefillFromPrevious && week > 1) {
    const previous = await storedSessions(row.id, week - 1);
    if (previous) return { plan, sessions: previous, source: "previous" };
  }
  const schedule = await getDb()
    .select({
      weekday: macrocycleSession.weekday,
      slot: macrocycleSession.slot,
    })
    .from(macrocycleSession)
    .where(eq(macrocycleSession.macrocycleId, row.id));
  return {
    plan,
    sessions: schedule.map((s) => ({ ...s, exercises: [] })).sort(byWeekOrder),
    source: "schedule",
  };
}

/**
 * The week's projection from the macrocycle planning for every catalog
 * exercise with reference values (coach and linked athlete).
 */
export async function getWeekProjections(
  user: CurrentUser,
  athleteId: string,
  weekParam: string,
): Promise<Record<number, PlannedExercise>> {
  await requireViewableAthlete(user, athleteId);
  const { row, week } = await macrocycleAndWeek(athleteId, weekParam);
  const db = getDb();
  const [[level], catalog] = await Promise.all([
    db
      .select({ level: macrocycleWeek.level })
      .from(macrocycleWeek)
      .where(
        and(
          eq(macrocycleWeek.macrocycleId, row.id),
          eq(macrocycleWeek.weekNumber, week),
        ),
      ),
    db.select().from(exercise),
  ]);
  const goals = {
    snatchGoalKg: row.snatchGoalKg,
    cleanAndJerkGoalKg: row.cleanAndJerkGoalKg,
  };
  const t = cycleProgress(week, row.durationWeeks);
  return Object.fromEntries(
    catalog.map((e) => [
      e.number,
      plannedExercise(
        {
          referenceLift: e.referenceLift,
          bestValuePct: e.bestValuePct,
          maxWeeklyAverageWeightPct: e.maxWeeklyAverageWeightPct,
          repsPerSet: { min: e.minRepsPerSet, max: e.maxRepsPerSet },
          repsPerWeek: { min: e.minRepsPerWeek, max: e.maxRepsPerWeek },
        },
        goals,
        row.entryValuePct / 100,
        t,
        level?.level ?? "medium",
      ),
    ]),
  );
}

/**
 * The entry points of the athlete page: current and next week and the
 * planned weeks (coach and linked athlete); null without a macrocycle.
 */
export async function getTrainingWeeks(
  user: CurrentUser,
  athleteId: string,
  today: string,
): Promise<TrainingWeeks | null> {
  await requireViewableAthlete(user, athleteId);
  const row = await findMacrocycleRow(athleteId);
  if (!row) return null;
  const planned = await listWeekPlans(user, athleteId);
  const numbers = new Set(planned.map((p) => p.weekNumber));
  const { current, next } = currentAndNextWeek(
    row.startDate,
    row.durationWeeks,
    today,
  );
  const of = (weekNumber: number | null) =>
    weekNumber === null
      ? null
      : { weekNumber, planned: numbers.has(weekNumber) };
  return { current: of(current), next: of(next), planned };
}

const feedbackSchema = z.strictObject({
  weekday: int(1, 7),
  slot: int(1, 3),
  exerciseNumber: int(1, 32767),
  feedback: z
    .string()
    .trim()
    .refine((v) => v.length <= NOTE_MAX_LENGTH, code("TOO_LONG")),
});

/**
 * The athlete's feedback on one exercise of a session of a planned week.
 * Only the user linked to the Athlete may write it (also a coach who
 * trains themselves); empty text clears it.
 */
export async function setFeedback(
  user: CurrentUser,
  athleteId: string,
  weekParam: string,
  input: unknown,
): Promise<WeekPlan> {
  await requireViewableAthlete(user, athleteId);
  const roles = await getRoles(user);
  if (roles.athlete?.athleteId !== athleteId)
    throw new DomainError("forbidden", "NOT_THE_ATHLETE");
  const { row, week } = await macrocycleAndWeek(athleteId, weekParam);
  const data = parseInput(feedbackSchema, input);
  const db = getDb();
  const [target] = await db
    .select({ id: sessionExercise.id })
    .from(sessionExercise)
    .innerJoin(
      trainingSession,
      eq(sessionExercise.sessionId, trainingSession.id),
    )
    .innerJoin(weekPlan, eq(trainingSession.weekPlanId, weekPlan.id))
    .where(
      and(
        eq(weekPlan.macrocycleId, row.id),
        eq(weekPlan.weekNumber, week),
        eq(trainingSession.weekday, data.weekday),
        eq(trainingSession.slot, data.slot),
        eq(sessionExercise.exerciseNumber, data.exerciseNumber),
      ),
    );
  if (!target) throw new DomainError("not_found", "EXERCISE_NOT_IN_WEEK");
  await db
    .update(sessionExercise)
    .set({ feedback: data.feedback === "" ? null : data.feedback })
    .where(eq(sessionExercise.id, target.id));
  return weekPlanOf(row, week);
}

/**
 * The current week for the athlete page (coach and linked athlete): its
 * plan with the feedback, or whether the macrocycle has not started or has
 * ended; null without a macrocycle.
 */
export async function getCurrentWeek(
  user: CurrentUser,
  athleteId: string,
  today: string,
): Promise<CurrentWeek | null> {
  await requireViewableAthlete(user, athleteId);
  const row = await findMacrocycleRow(athleteId);
  if (!row) return null;
  const { current, next } = currentAndNextWeek(
    row.startDate,
    row.durationWeeks,
    today,
  );
  if (current === null)
    return today < row.startDate
      ? { state: "before", startDate: row.startDate }
      : { state: "after" };
  const week = await weekPlanOf(row, current);
  const nextPlanned =
    next === null
      ? null
      : {
          weekNumber: next,
          planned: (await storedSessions(row.id, next)) !== null,
        };
  return {
    state: "week",
    week,
    calendarWeek: isoWeek(week.startDate),
    next: nextPlanned,
  };
}
