/** Shapes of a week plan as the app and the API see it (no server imports). */
import type {
  MesocycleType,
  WeekLevel,
} from "@/domain/macrocycles/macrocycle-types";

export type PlannedSetGroup = {
  sets: number;
  reps: number;
  /** Null for exercises without a weight. */
  weightKg: number | null;
};

export type PlannedSessionExercise = {
  exerciseNumber: number;
  /** Coach note; null without one. */
  note: string | null;
  /** The athlete's feedback; null without. Not part of plan saves. */
  feedback?: string | null;
  /** Sets and reps as free text (exercises without values); null without. */
  freeText?: string | null;
  setGroups: PlannedSetGroup[];
};

export type PlannedSession = {
  /** 1 = Monday … 7 = Sunday. */
  weekday: number;
  /** 1–3 within the day. */
  slot: number;
  exercises: PlannedSessionExercise[];
};

/** How the week's exercises fit the exercises chosen for its mesocycle. */
export type MesocycleCheck = {
  /** Exercises chosen for the week's mesocycle, ascending. */
  chosen: number[];
  /** Chosen exercises that are not in the week. */
  missing: number[];
  /** Exercises of the week that are not chosen for the mesocycle. */
  notPlanned: number[];
};

export type WeekPlan = {
  weekNumber: number;
  durationWeeks: number;
  /** Monday of the week. */
  startDate: string;
  mesocycle: MesocycleType;
  level: WeekLevel;
  /** Whether the week has a stored plan. */
  planned: boolean;
  sessions: PlannedSession[];
  check: MesocycleCheck;
  /** Variations of the mesocycle's chosen exercises, by exercise number. */
  variations: Record<number, string>;
};

/** Exercises from this number on have no values: sets are free text. */
export const FREE_TEXT_FROM = 30;
export const usesFreeText = (exerciseNumber: number) =>
  exerciseNumber >= FREE_TEXT_FROM;

export type PlannedWeekSummary = { weekNumber: number; startDate: string };

/** Where the editor's initial content comes from. */
export type InitialSource = "stored" | "previous" | "schedule";

/** A week of the athlete page's entry points. */
export type TrainingWeek = { weekNumber: number; planned: boolean };

/** The athlete page's current week. */
export type CurrentWeek =
  | { state: "before"; startDate: string }
  | { state: "after" }
  | {
      state: "week";
      /** The current week's plan (`planned` false without one). */
      week: WeekPlan;
      /** ISO calendar week of the week's Monday. */
      calendarWeek: number;
      /** The week after the current one, for the coach tools. */
      next: TrainingWeek | null;
    };
