// The exercise catalog (see src/domain/exercises). Filled by a generated data
// migration from data/exercise-catalog (npm run catalog:migration).
import {
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
} from "drizzle-orm/pg-core";

export const referenceLiftEnum = pgEnum("reference_lift", [
  "snatch",
  "clean_and_jerk",
]);

/** Exercise group (Komplex) K1–K9. */
export const exerciseGroup = pgTable("exercise_group", {
  number: smallint("number").primaryKey(),
  code: text("code").notNull().unique(),
  nameDe: text("name_de").notNull(),
  nameEn: text("name_en").notNull(),
});

const percent = (name: string) =>
  numeric(name, { precision: 5, scale: 1, mode: "number" });

/** Exercise of the catalog, identified by its catalog number. */
export const exercise = pgTable("exercise", {
  number: smallint("number").primaryKey(),
  groupNumber: smallint("group_number")
    .notNull()
    .references(() => exerciseGroup.number),
  nameDe: text("name_de").notNull(),
  nameEn: text("name_en").notNull(),
  referenceLift: referenceLiftEnum("reference_lift"),
  bestValuePct: percent("best_value_pct"),
  maxWeeklyAverageWeightPct: percent("max_weekly_average_weight_pct"),
  minRepsPerSet: smallint("min_reps_per_set"),
  maxRepsPerSet: smallint("max_reps_per_set"),
  minRepsPerWeek: smallint("min_reps_per_week"),
  maxRepsPerWeek: smallint("max_reps_per_week"),
  commentDe: text("comment_de"),
  commentEn: text("comment_en"),
});

/** A point exercises address (e.g. "Hoher Zug"); the German name is the key. */
export const exerciseTag = pgTable("exercise_tag", {
  nameDe: text("name_de").primaryKey(),
  nameEn: text("name_en").notNull(),
});

/** Which exercise addresses which tag, in catalog order. */
export const exerciseAddresses = pgTable(
  "exercise_addresses",
  {
    exerciseNumber: smallint("exercise_number")
      .notNull()
      .references(() => exercise.number),
    tag: text("tag")
      .notNull()
      .references(() => exerciseTag.nameDe),
    position: smallint("position").notNull(),
  },
  (table) => [primaryKey({ columns: [table.exerciseNumber, table.tag] })],
);
