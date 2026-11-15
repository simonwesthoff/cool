import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { CurrentUser } from "@/domain/auth";
import { DomainError } from "@/domain/errors";
import { getDb } from "@/server/db";
import { athlete, team, userAccount } from "@/server/db/schema";

export type Team = { id: string; coachId: string };

/** A user's roles, derived from the data: leading a Team, being an Athlete. */
export type Roles = {
  coach: { teamId: string } | null;
  athlete: {
    athleteId: string;
    athleteName: string;
    teamId: string;
    coachName: string;
  } | null;
};

const coachAccount = alias(userAccount, "coach_account");

async function findTeam(coachId: string): Promise<Team | undefined> {
  const [row] = await getDb()
    .select({ id: team.id, coachId: team.coachId })
    .from(team)
    .where(eq(team.coachId, coachId));
  return row;
}

export async function getRoles(user: CurrentUser): Promise<Roles> {
  const db = getDb();
  const [ownTeam, [linked]] = await Promise.all([
    findTeam(user.id),
    db
      .select({
        athleteId: athlete.id,
        athleteName: athlete.name,
        teamId: athlete.teamId,
        coachName: coachAccount.name,
      })
      .from(athlete)
      .innerJoin(team, eq(team.id, athlete.teamId))
      .innerJoin(coachAccount, eq(coachAccount.id, team.coachId))
      .where(eq(athlete.userAccountId, user.id)),
  ]);
  return {
    coach: ownTeam ? { teamId: ownTeam.id } : null,
    athlete: linked ?? null,
  };
}

/**
 * "Start as Coach": creates the Team the user leads. Idempotent and safe
 * against parallel calls; `created` is false when the Team already existed.
 */
export async function startAsCoach(
  user: CurrentUser,
): Promise<{ team: Team; created: boolean }> {
  const inserted = await getDb()
    .insert(team)
    .values({ coachId: user.id })
    .onConflictDoNothing({ target: team.coachId })
    .returning({ id: team.id, coachId: team.coachId });
  if (inserted[0]) return { team: inserted[0], created: true };
  const existing = await findTeam(user.id);
  if (!existing) throw new Error("Team could not be created");
  return { team: existing, created: false };
}

/** The Team the user leads; `NOT_A_COACH` (403) if there is none. */
export async function requireCoachTeam(user: CurrentUser): Promise<Team> {
  const existing = await findTeam(user.id);
  if (!existing) throw new DomainError("forbidden", "NOT_A_COACH");
  return existing;
}
