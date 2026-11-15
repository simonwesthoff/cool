import { and, eq, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { findAthleteInTeam, type Athlete } from "@/domain/athletes";
import type { CurrentUser } from "@/domain/auth";
import { DomainError } from "@/domain/errors";
import { getRoles, requireCoachTeam } from "@/domain/roles";
import { getDb } from "@/server/db";
import { athlete, invitation, team, userAccount } from "@/server/db/schema";
import { generateToken, hashToken, isTokenShape } from "./token";

/** How long an invitation can be accepted. */
export const INVITATION_VALIDITY_MS = 7 * 24 * 60 * 60 * 1000;

export type InvitationStatus = "valid" | "expired" | "used";

export type InvitationInfo = {
  status: InvitationStatus;
  coachName: string;
  athleteName: string;
};

const athleteNotFound = () => new DomainError("not_found", "ATHLETE_NOT_FOUND");
const invitationNotFound = () =>
  new DomainError("not_found", "INVITATION_NOT_FOUND");
const athleteAlreadyLinked = () =>
  new DomainError("conflict", "ATHLETE_ALREADY_LINKED");
const alreadyLinked = () => new DomainError("conflict", "ALREADY_LINKED");

/** Whether an error is PostgreSQL's unique violation (also when wrapped). */
function isUniqueViolation(error: unknown): boolean {
  for (let e = error; e; e = (e as { cause?: unknown }).cause) {
    if ((e as { code?: unknown }).code === "23505") return true;
  }
  return false;
}

async function requireUnlinkedAthleteOfCoach(
  coach: CurrentUser,
  athleteId: string,
): Promise<Athlete> {
  const { id: teamId } = await requireCoachTeam(coach);
  const found = await findAthleteInTeam(teamId, athleteId);
  if (!found) throw athleteNotFound();
  if (found.linkedAccount) throw athleteAlreadyLinked();
  return found;
}

/**
 * Creates an invitation for an unlinked athlete of the coach's Team and
 * revokes the athlete's previous open invitations. Returns the plain token,
 * which exists nowhere else.
 */
export async function createInvitation(
  coach: CurrentUser,
  athleteId: string,
  now: Date = new Date(),
): Promise<{ token: string; expiresAt: Date }> {
  await requireUnlinkedAthleteOfCoach(coach, athleteId);
  const token = generateToken();
  const expiresAt = new Date(now.getTime() + INVITATION_VALIDITY_MS);
  await getDb().transaction(async (tx) => {
    await tx
      .update(invitation)
      .set({ revokedAt: now })
      .where(
        and(
          eq(invitation.athleteId, athleteId),
          isNull(invitation.acceptedAt),
          isNull(invitation.revokedAt),
        ),
      );
    await tx.insert(invitation).values({
      athleteId,
      tokenHash: hashToken(token),
      createdBy: coach.id,
      expiresAt,
    });
  });
  return { token, expiresAt };
}

const coachAccount = alias(userAccount, "coach_account");

async function findInvitation(token: string) {
  if (!isTokenShape(token)) return undefined;
  const [row] = await getDb()
    .select({
      id: invitation.id,
      athleteId: invitation.athleteId,
      expiresAt: invitation.expiresAt,
      revokedAt: invitation.revokedAt,
      acceptedAt: invitation.acceptedAt,
      athleteName: athlete.name,
      coachName: coachAccount.name,
    })
    .from(invitation)
    .innerJoin(athlete, eq(athlete.id, invitation.athleteId))
    .innerJoin(team, eq(team.id, athlete.teamId))
    .innerJoin(coachAccount, eq(coachAccount.id, team.coachId))
    .where(eq(invitation.tokenHash, hashToken(token)));
  return row;
}

function statusOf(
  row: { expiresAt: Date; revokedAt: Date | null; acceptedAt: Date | null },
  now: Date,
): InvitationStatus {
  if (row.acceptedAt || row.revokedAt) return "used";
  if (row.expiresAt.getTime() <= now.getTime()) return "expired";
  return "valid";
}

/** State of an invitation; `INVITATION_NOT_FOUND` for unknown links. */
export async function getInvitation(
  token: string,
  now: Date = new Date(),
): Promise<InvitationInfo> {
  const row = await findInvitation(token);
  if (!row) throw invitationNotFound();
  return {
    status: statusOf(row, now),
    coachName: row.coachName,
    athleteName: row.athleteName,
  };
}

/**
 * Links the user to the invited athlete and uses up the invitation, in one
 * transaction. Fails with `INVITATION_NOT_FOUND`, `INVITATION_EXPIRED`,
 * `INVITATION_USED`, `ALREADY_LINKED` (the invitation then stays valid) or
 * `ATHLETE_ALREADY_LINKED`.
 */
export async function acceptInvitation(
  user: CurrentUser,
  token: string,
  now: Date = new Date(),
): Promise<{ athleteId: string }> {
  const row = await findInvitation(token);
  if (!row) throw invitationNotFound();
  const status = statusOf(row, now);
  if (status === "expired") throw new DomainError("gone", "INVITATION_EXPIRED");
  if (status === "used") throw new DomainError("gone", "INVITATION_USED");
  if ((await getRoles(user)).athlete) throw alreadyLinked();

  try {
    return await getDb().transaction(async (tx) => {
      const [claimed] = await tx
        .update(invitation)
        .set({ acceptedAt: now, acceptedBy: user.id })
        .where(
          and(
            eq(invitation.id, row.id),
            isNull(invitation.acceptedAt),
            isNull(invitation.revokedAt),
          ),
        )
        .returning({ athleteId: invitation.athleteId });
      // Someone else accepted it in the meantime.
      if (!claimed) throw new DomainError("gone", "INVITATION_USED");

      const [linked] = await tx
        .update(athlete)
        .set({ userAccountId: user.id })
        .where(
          and(eq(athlete.id, claimed.athleteId), isNull(athlete.userAccountId)),
        )
        .returning({ id: athlete.id });
      if (!linked) throw athleteAlreadyLinked();
      return { athleteId: linked.id };
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw alreadyLinked();
    throw error;
  }
}

/**
 * "This is me": links the coach's own user account to an unlinked athlete of
 * their Team and revokes that athlete's open invitations.
 */
export async function linkSelf(
  coach: CurrentUser,
  athleteId: string,
  now: Date = new Date(),
): Promise<Athlete> {
  const { id: teamId } = await requireCoachTeam(coach);
  await requireUnlinkedAthleteOfCoach(coach, athleteId);
  if ((await getRoles(coach)).athlete) throw alreadyLinked();
  try {
    await getDb().transaction(async (tx) => {
      const [linked] = await tx
        .update(athlete)
        .set({ userAccountId: coach.id })
        .where(and(eq(athlete.id, athleteId), isNull(athlete.userAccountId)))
        .returning({ id: athlete.id });
      if (!linked) throw athleteAlreadyLinked();
      await tx
        .update(invitation)
        .set({ revokedAt: now })
        .where(
          and(
            eq(invitation.athleteId, athleteId),
            isNull(invitation.acceptedAt),
            isNull(invitation.revokedAt),
          ),
        );
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw alreadyLinked();
    throw error;
  }
  const result = await findAthleteInTeam(teamId, athleteId);
  if (!result) throw athleteNotFound();
  return result;
}
