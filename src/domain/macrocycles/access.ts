/**
 * Access rules and row lookup shared by the macrocycle and week plan
 * domains. Not exported from the domain index.
 */
import { eq } from "drizzle-orm";
import { findAthleteInTeam } from "@/domain/athletes";
import type { CurrentUser } from "@/domain/auth";
import { DomainError } from "@/domain/errors";
import { getRoles, requireCoachTeam } from "@/domain/roles";
import { getDb } from "@/server/db";
import { macrocycle } from "@/server/db/schema";

/** Write access: only the coach of the athlete's Team. */
export async function requireOwnAthlete(coach: CurrentUser, athleteId: string) {
  const { id: teamId } = await requireCoachTeam(coach);
  const found = await findAthleteInTeam(teamId, athleteId);
  if (!found) throw new DomainError("not_found", "ATHLETE_NOT_FOUND");
  return found;
}

/**
 * Read access: the coach of the athlete's Team or the user linked to the
 * Athlete. Everyone else gets `ATHLETE_NOT_FOUND`, as for writes.
 */
export async function requireViewableAthlete(
  user: CurrentUser,
  athleteId: string,
) {
  const roles = await getRoles(user);
  if (roles.athlete?.athleteId === athleteId) return;
  if (roles.coach && (await findAthleteInTeam(roles.coach.teamId, athleteId)))
    return;
  throw new DomainError("not_found", "ATHLETE_NOT_FOUND");
}

export async function findMacrocycleRow(athleteId: string) {
  const [row] = await getDb()
    .select()
    .from(macrocycle)
    .where(eq(macrocycle.athleteId, athleteId));
  return row;
}
