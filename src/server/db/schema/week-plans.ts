// Week plans of a macrocycle (see src/domain/week-plans).
import {
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { exercise } from "./exercises";
import { macrocycle } from "./macrocycles";

/** The plan of one macrocycle week (at most one per week). */
export const weekPlan = pgTable(
  "week_plan",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    macrocycleId: uuid("macrocycle_id")
      .notNull()
      .references(() => macrocycle.id, { onDelete: "cascade" }),
    weekNumber: smallint("week_number").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("week_plan_macrocycle_week_unique").on(
      table.macrocycleId,
      table.weekNumber,
    ),
  ],
);

/** A training session of a week plan: weekday 1 = Monday … 7, slot 1–3. */
export const trainingSession = pgTable(
  "training_session",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    weekPlanId: uuid("week_plan_id")
      .notNull()
      .references(() => weekPlan.id, { onDelete: "cascade" }),
    weekday: smallint("weekday").notNull(),
    slot: smallint("slot").notNull(),
  },
  (table) => [
    unique("training_session_day_slot_unique").on(
      table.weekPlanId,
      table.weekday,
      table.slot,
    ),
  ],
);

/** An exercise of the catalog in a session, in order, with a coach note. */
export const sessionExercise = pgTable(
  "session_exercise",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => trainingSession.id, { onDelete: "cascade" }),
    position: smallint("position").notNull(),
    exerciseNumber: smallint("exercise_number")
      .notNull()
      .references(() => exercise.number),
    note: text("note"),
    /** Sets and reps as free text, for exercises without values (30 and up). */
    freeText: text("free_text"),
    /** The athlete's feedback on the exercise; kept when the coach saves. */
    feedback: text("feedback"),
  },
  (table) => [
    unique("session_exercise_unique").on(table.sessionId, table.exerciseNumber),
  ],
);

/** Sets × reps @ weight of a session exercise, in order; no weight allowed. */
export const setGroup = pgTable("set_group", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionExerciseId: uuid("session_exercise_id")
    .notNull()
    .references(() => sessionExercise.id, { onDelete: "cascade" }),
  position: smallint("position").notNull(),
  sets: smallint("sets").notNull(),
  reps: smallint("reps").notNull(),
  weightKg: numeric("weight_kg", { precision: 4, scale: 1, mode: "number" }),
});
