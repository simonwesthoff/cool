// Teams and their athletes (see src/domain/athletes).
import {
  date,
  index,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { userAccount } from "./auth";

export const genderEnum = pgEnum("gender", ["female", "male", "diverse"]);

/** The group of athletes one coach trains. One Team per coach. */
export const team = pgTable("team", {
  id: uuid("id").primaryKey().defaultRandom(),
  coachId: text("coach_id")
    .notNull()
    .unique()
    .references(() => userAccount.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** A person trained in a Team, with their basic data. */
export const athlete = pgTable(
  "athlete",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    dateOfBirth: date("date_of_birth", { mode: "string" }),
    gender: genderEnum("gender"),
    careerStartDate: date("career_start_date", { mode: "string" }),
    heightCm: smallint("height_cm"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("athlete_team_id_idx").on(table.teamId)],
);
