/** Shapes of a macrocycle as the app and the API see it (no server imports). */
import type { MesocycleType, WeekLevel } from "./calculation";

export type { MesocycleType, WeekLevel };

export type MacrocycleBaseData = {
  startDate: string;
  durationWeeks: number;
  entryValuePct: number;
  snatchBestKg: number;
  cleanAndJerkBestKg: number;
  snatchGoalKg: number;
  cleanAndJerkGoalKg: number;
  bodyWeightKg: number;
  targetBodyWeightKg: number;
  bodyFatPct: number | null;
  muscleMassPct: number | null;
  /** Deficits per lift (all required). */
  snatchDeficits: string;
  cleanDeficits: string;
  jerkDeficits: string;
  otherDeficits: string;
  injuriesAndIllnesses: string;
  strengths: string;
  experience: string;
  trainingFrequency: number;
  /** Ordered, 1 to 3 entries. */
  focusPoints: string[];
  competitionDate: string;
  competitionType: string;
};

export type PlannedWeekExercise = {
  exerciseNumber: number;
  bestKg: number | null;
  averageKg: number | null;
  setSize: number | null;
  weeklyReps: number | null;
};

export type MacrocycleWeekView = {
  number: number;
  /** Monday of the week. */
  startDate: string;
  mesocycle: MesocycleType;
  level: WeekLevel;
  /** Intensity in % with one decimal (e.g. 80, 65.9). */
  intensityPct: number;
  /** Sum of the planned weekly reps; null without exercises. */
  volume: number | null;
  exercises: PlannedWeekExercise[];
};

/** An exercise chosen for a mesocycle. */
export type MesocycleExercise = {
  exerciseNumber: number;
  /** Free-text variation; null for the standard exercise. */
  variation: string | null;
  /** Reason: keys (German names) of tags the exercise addresses. */
  tags: string[];
  /** Reason: the coach's own reasons. A reason has at least one tag or own reason. */
  ownReasons: string[];
};

export type MesocycleView = {
  type: MesocycleType;
  firstWeek: number;
  lastWeek: number;
  /** Numbers of the chosen exercises, ascending. */
  exerciseNumbers: number[];
  /** The chosen exercises with variation and reason, ascending by number. */
  exercises: MesocycleExercise[];
};

export type Macrocycle = MacrocycleBaseData & {
  id: string;
  athleteId: string;
  mesocycles: MesocycleView[];
  weeks: MacrocycleWeekView[];
};

/** Planned values of one exercise in one week (null where not defined). */
export type ExerciseWeek = {
  number: number;
  bestKg: number | null;
  averageKg: number | null;
  setSize: number | null;
  weeklyReps: number | null;
};

/** An exercise's planned values for every week of a macrocycle. */
export type ExerciseWeeks = {
  exerciseNumber: number;
  weeks: ExerciseWeek[];
};
