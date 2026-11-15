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
    /** The user account linked to this athlete (at most one Athlete per account). */
    userAccountId: text("user_account_id")
      .unique()
      .references(() => userAccount.id, { onDelete: "set null" }),
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

/**
 * A link a coach creates for one Athlete. Only the SHA-256 hash of the token
 * is stored. Usable once, valid 7 days, replaced (revoked) by a newer one.
 */
export const invitation = pgTable(
  "invitation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    athleteId: uuid("athlete_id")
      .notNull()
      .references(() => athlete.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    createdBy: text("created_by")
      .notNull()
      .references(() => userAccount.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    acceptedBy: text("accepted_by").references(() => userAccount.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("invitation_athlete_id_idx").on(table.athleteId)],
);
