/**
 * The week editor's draft: sessions with exercises and their single sets
 * (weight and reps as typed text). Saved as set groups: consecutive equal
 * sets form one group. Pure functions, no React.
 */
import {
  weekActuals,
  type SetGroupValues,
  type WeekActuals,
} from "@/domain/week-plans/calculation";
import type { PlannedSession } from "@/domain/week-plans/week-plan-types";

/** One set: weight on top, reps below. */
export type DraftSet = { key: string; weight: string; reps: string };
export type DraftExercise = {
  key: string;
  exerciseNumber: number;
  note: string;
  /** Sets and reps as free text, for exercises without values. */
  freeText: string;
  sets: DraftSet[];
};
export type DraftSession = {
  key: string;
  weekday: number;
  slot: number;
  exercises: DraftExercise[];
};

export const MAX_SESSIONS = 14;
export const MAX_PER_DAY = 3;
/** More sets per exercise in a session make no sense. */
export const MAX_SETS = 10;

let counter = 0;
export const newKey = () => `k${++counter}`;

export function draftOf(sessions: PlannedSession[]): DraftSession[] {
  return normalize(
    sessions.map((s) => ({
      key: newKey(),
      weekday: s.weekday,
      slot: s.slot,
      exercises: s.exercises.map((e) => ({
        key: newKey(),
        exerciseNumber: e.exerciseNumber,
        note: e.note ?? "",
        freeText: e.freeText ?? "",
        sets: e.setGroups.flatMap((g) =>
          Array.from({ length: g.sets }, () => ({
            key: newKey(),
            weight: g.weightKg === null ? "" : String(g.weightKg),
            reps: String(g.reps),
          })),
        ),
      })),
    })),
  );
}

/** Week order (weekday, then slot) with each day's slots renumbered 1, 2, 3. */
export function normalize(sessions: DraftSession[]): DraftSession[] {
  const sorted = [...sessions].sort(
    (a, b) => a.weekday - b.weekday || a.slot - b.slot,
  );
  const perDay = new Map<number, number>();
  return sorted.map((s) => {
    const slot = (perDay.get(s.weekday) ?? 0) + 1;
    perDay.set(s.weekday, slot);
    return slot === s.slot ? s : { ...s, slot };
  });
}

export const sessionsOnDay = (sessions: DraftSession[], weekday: number) =>
  sessions.filter((s) => s.weekday === weekday).length;

/** The day for a new session: the first day without one, else with room. */
export function dayForNewSession(sessions: DraftSession[]): number | null {
  if (sessions.length >= MAX_SESSIONS) return null;
  for (const max of [1, MAX_PER_DAY])
    for (let day = 1; day <= 7; day++)
      if (sessionsOnDay(sessions, day) < max) return day;
  return null;
}

function numberOf(text: string): number | null {
  const value = Number(text.trim().replace(",", "."));
  return text.trim() !== "" && Number.isFinite(value) ? value : null;
}

export type CellError = "reps" | "weight";

/**
 * Which cells of a set are invalid: reps a whole number 1–30, weight empty
 * or 0–500 kg in 0.5 kg steps. A set without reps is still being typed.
 */
export function setErrors(set: DraftSet): CellError[] {
  const errors: CellError[] = [];
  if (set.reps.trim() !== "") {
    const reps = numberOf(set.reps);
    if (reps === null || !Number.isInteger(reps) || reps < 1 || reps > 30)
      errors.push("reps");
  }
  if (set.weight.trim() !== "") {
    const w = numberOf(set.weight);
    if (w === null || w < 0 || w > 500 || !Number.isInteger(w * 2))
      errors.push("weight");
  }
  return errors;
}

/** A set with valid reps (and a valid or no weight) is saved. */
const complete = (set: DraftSet) =>
  set.reps.trim() !== "" && setErrors(set).length === 0;

export const hasErrors = (sessions: DraftSession[]) =>
  sessions.some((s) =>
    s.exercises.some((e) => e.sets.some((x) => setErrors(x).length > 0)),
  );

/** Complete sets as set groups: consecutive equal sets form one group. */
function groupsOf(sets: DraftSet[]): SetGroupValues[] {
  const groups: SetGroupValues[] = [];
  for (const set of sets.filter(complete)) {
    const reps = numberOf(set.reps)!;
    const weightKg = numberOf(set.weight);
    const last = groups.at(-1);
    if (last && last.reps === reps && last.weightKg === weightKg)
      last.sets += 1;
    else groups.push({ sets: 1, reps, weightKg });
  }
  return groups;
}

/** The API payload with the complete sets of every exercise. */
export function payloadOf(sessions: DraftSession[]) {
  return {
    sessions: sessions.map((s) => ({
      weekday: s.weekday,
      slot: s.slot,
      exercises: s.exercises.map((e) => ({
        exerciseNumber: e.exerciseNumber,
        note: e.note.trim() === "" ? null : e.note,
        freeText: e.freeText.trim() === "" ? null : e.freeText,
        setGroups: groupsOf(e.sets),
      })),
    })),
  };
}

/** The week's actual values per exercise, from all complete sets. */
export function actualsOf(sessions: DraftSession[]): Map<number, WeekActuals> {
  const groups = new Map<number, SetGroupValues[]>();
  for (const s of sessions)
    for (const e of s.exercises)
      groups.set(e.exerciseNumber, [
        ...(groups.get(e.exerciseNumber) ?? []),
        ...groupsOf(e.sets),
      ]);
  return new Map([...groups].map(([n, list]) => [n, weekActuals(list)]));
}

/** Exercise numbers of the week, ascending. */
export const exercisesOf = (sessions: DraftSession[]) =>
  [
    ...new Set(
      sessions.flatMap((s) => s.exercises.map((e) => e.exerciseNumber)),
    ),
  ].sort((a, b) => a - b);
