/**
 * The week editor's draft: sessions with exercises and set groups as typed
 * text, converted to the API payload on save. Pure functions, no React.
 */
import {
  weekActuals,
  type SetGroupValues,
  type WeekActuals,
} from "@/domain/week-plans/calculation";
import type { PlannedSession } from "@/domain/week-plans/week-plan-types";

export type DraftGroup = {
  key: string;
  sets: string;
  reps: string;
  weight: string;
};
export type DraftExercise = {
  key: string;
  exerciseNumber: number;
  note: string;
  groups: DraftGroup[];
};
export type DraftSession = {
  key: string;
  weekday: number;
  slot: number;
  exercises: DraftExercise[];
};

export const MAX_SESSIONS = 14;
export const MAX_PER_DAY = 3;

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
        groups: e.setGroups.map((g) => ({
          key: newKey(),
          sets: String(g.sets),
          reps: String(g.reps),
          weight: g.weightKg === null ? "" : String(g.weightKg),
        })),
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

/** A number from typed text ("82,5" too); the text itself when it is none. */
function numberOf(text: string): number | string {
  const value = Number(text.trim().replace(",", "."));
  return text.trim() !== "" && Number.isFinite(value) ? value : text;
}

/** The API payload; invalid text is sent as is, so the API names the field. */
export function payloadOf(sessions: DraftSession[]) {
  return {
    sessions: sessions.map((s) => ({
      weekday: s.weekday,
      slot: s.slot,
      exercises: s.exercises.map((e) => ({
        exerciseNumber: e.exerciseNumber,
        note: e.note.trim() === "" ? null : e.note,
        setGroups: e.groups.map((g) => ({
          sets: numberOf(g.sets),
          reps: numberOf(g.reps),
          weightKg: g.weight.trim() === "" ? null : numberOf(g.weight),
        })),
      })),
    })),
  };
}

/** The week's actual values per exercise, from all valid set groups. */
export function actualsOf(sessions: DraftSession[]): Map<number, WeekActuals> {
  const groups = new Map<number, SetGroupValues[]>();
  for (const s of sessions)
    for (const e of s.exercises) {
      const list = groups.get(e.exerciseNumber) ?? [];
      for (const g of e.groups) {
        const sets = numberOf(g.sets);
        const reps = numberOf(g.reps);
        const weight = g.weight.trim() === "" ? null : numberOf(g.weight);
        if (typeof sets !== "number" || typeof reps !== "number") continue;
        if (typeof weight === "string") continue;
        list.push({ sets, reps, weightKg: weight });
      }
      groups.set(e.exerciseNumber, list);
    }
  return new Map([...groups].map(([n, list]) => [n, weekActuals(list)]));
}

/** Exercise numbers of the week, ascending. */
export const exercisesOf = (sessions: DraftSession[]) =>
  [
    ...new Set(
      sessions.flatMap((s) => s.exercises.map((e) => e.exerciseNumber)),
    ),
  ].sort((a, b) => a - b);
