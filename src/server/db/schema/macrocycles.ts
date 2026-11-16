// Macrocycles with their weeks and mesocycles (see src/domain/macrocycles).
import {
  date,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { athlete } from "./athletes";
import { exercise } from "./exercises";

export const weekLevelEnum = pgEnum("week_level", ["high", "medium", "low"]);
export const mesocycleTypeEnum = pgEnum("mesocycle_type", [
  "general_preparation",
  "special_preparation",
  "competition_preparation",
]);

const kg = (name: string) =>
  numeric(name, { precision: 5, scale: 1, mode: "number" });
const pct = (name: string) =>
  numeric(name, { precision: 4, scale: 1, mode: "number" });

/** One macrocycle per athlete (unique athlete_id). */
export const macrocycle = pgTable("macrocycle", {
  id: uuid("id").primaryKey().defaultRandom(),
  athleteId: uuid("athlete_id")
    .notNull()
    .unique()
    .references(() => athlete.id, { onDelete: "cascade" }),
  startDate: date("start_date", { mode: "string" }).notNull(),
  durationWeeks: smallint("duration_weeks").notNull(),
  entryValuePct: pct("entry_value_pct").notNull(),
  snatchBestKg: kg("snatch_best_kg").notNull(),
  cleanAndJerkBestKg: kg("clean_and_jerk_best_kg").notNull(),
  snatchGoalKg: kg("snatch_goal_kg").notNull(),
  cleanAndJerkGoalKg: kg("clean_and_jerk_goal_kg").notNull(),
  bodyWeightKg: kg("body_weight_kg").notNull(),
  targetBodyWeightKg: kg("target_body_weight_kg").notNull(),
  bodyFatPct: pct("body_fat_pct"),
  muscleMassPct: pct("muscle_mass_pct"),
  snatchDeficits: text("snatch_deficits").notNull(),
  cleanDeficits: text("clean_deficits").notNull(),
  jerkDeficits: text("jerk_deficits").notNull(),
  otherDeficits: text("other_deficits").notNull(),
  injuriesAndIllnesses: text("injuries_and_illnesses").notNull(),
  strengths: text("strengths").notNull(),
  experience: text("experience").notNull(),
  trainingFrequency: smallint("training_frequency").notNull(),
  /** Ordered list of 1–3 focus points. */
  focusPoints: text("focus_points").array().notNull(),
  competitionDate: date("competition_date", { mode: "string" }).notNull(),
  competitionType: text("competition_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/** Level of each week (all weeks have a row). */
export const macrocycleWeek = pgTable(
  "macrocycle_week",
  {
    macrocycleId: uuid("macrocycle_id")
      .notNull()
      .references(() => macrocycle.id, { onDelete: "cascade" }),
    weekNumber: smallint("week_number").notNull(),
    level: weekLevelEnum("level").notNull().default("medium"),
  },
  (table) => [primaryKey({ columns: [table.macrocycleId, table.weekNumber] })],
);

/** The three mesocycles with their stored borders. */
export const mesocycle = pgTable(
  "mesocycle",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    macrocycleId: uuid("macrocycle_id")
      .notNull()
      .references(() => macrocycle.id, { onDelete: "cascade" }),
    type: mesocycleTypeEnum("type").notNull(),
    firstWeek: smallint("first_week").notNull(),
    lastWeek: smallint("last_week").notNull(),
  },
  (table) => [
    unique("mesocycle_macrocycle_type_unique").on(
      table.macrocycleId,
      table.type,
    ),
  ],
);

/** Exercises chosen for a mesocycle, each with a reason (tags and/or note) and a variation. */
export const mesocycleExercise = pgTable(
  "mesocycle_exercise",
  {
    mesocycleId: uuid("mesocycle_id")
      .notNull()
      .references(() => mesocycle.id, { onDelete: "cascade" }),
    exerciseNumber: smallint("exercise_number")
      .notNull()
      .references(() => exercise.number),
    /** Free-text variation of the exercise (information only). */
    variation: text("variation"),
    /** Reason: keys of tags the exercise addresses (see exercise_tag). */
    tags: text("tags").array().notNull(),
    /** Reason: the coach's own reasons (free texts). */
    ownReasons: text("own_reasons").array().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.mesocycleId, table.exerciseNumber] }),
  ],
);
