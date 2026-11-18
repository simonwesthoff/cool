import { and, asc, eq } from "drizzle-orm";
import type { CurrentUser } from "@/domain/auth";
import { DomainError } from "@/domain/errors";
import { parseInput } from "@/domain/validation";
import { getDb } from "@/server/db";
import { getRoles, requireCoachTeam } from "@/domain/roles";
import { athlete, userAccount } from "@/server/db/schema";
import {
  completeBasicDataSchema,
  createBasicDataSchema,
  updateBasicDataSchema,
  type Athlete,
  type BasicData,
} from "./basic-data";

const notFound = () => new DomainError("not_found", "ATHLETE_NOT_FOUND");

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const columns = {
  id: athlete.id,
  name: athlete.name,
  dateOfBirth: athlete.dateOfBirth,
  gender: athlete.gender,
  careerStartDate: athlete.careerStartDate,
  heightCm: athlete.heightCm,
  accountEmail: userAccount.email,
  accountImage: userAccount.image,
};

type Row = {
  id: string;
  name: string;
  dateOfBirth: string | null;
  gender: Athlete["gender"];
  careerStartDate: string | null;
  heightCm: number | null;
  accountEmail: string | null;
  accountImage: string | null;
};

function toAthlete({ accountEmail, accountImage, ...data }: Row): Athlete {
  return {
    ...data,
    linkedAccount:
      accountEmail === null
        ? null
        : { email: accountEmail, image: accountImage },
  };
}

function selectAthletes() {
  return getDb()
    .select(columns)
    .from(athlete)
    .leftJoin(userAccount, eq(userAccount.id, athlete.userAccountId));
}

/** Athletes of the coach's Team, sorted by name. */
export async function listAthletes(coach: CurrentUser): Promise<Athlete[]> {
  const { id: teamId } = await requireCoachTeam(coach);
  const rows = await selectAthletes()
    .where(eq(athlete.teamId, teamId))
    .orderBy(asc(athlete.name), asc(athlete.id));
  return rows.map(toAthlete);
}

/** An athlete of the given Team, or undefined (also for malformed ids). */
export async function findAthleteInTeam(
  teamId: string,
  id: string,
): Promise<Athlete | undefined> {
  if (!UUID.test(id)) return undefined;
  const [row] = await selectAthletes().where(
    and(eq(athlete.id, id), eq(athlete.teamId, teamId)),
  );
  return row ? toAthlete(row) : undefined;
}

/**
 * Whether the user leads the athlete's Team, which allows changing the
 * athlete's data and planning (also for a coach who trains themselves).
 */
export async function isCoachOfAthlete(
  user: CurrentUser,
  athleteId: string,
): Promise<boolean> {
  const roles = await getRoles(user);
  if (!roles.coach) return false;
  return Boolean(await findAthleteInTeam(roles.coach.teamId, athleteId));
}

/** One athlete of the coach's Team; `ATHLETE_NOT_FOUND` otherwise. */
export async function getAthlete(
  coach: CurrentUser,
  id: string,
): Promise<Athlete> {
  const { id: teamId } = await requireCoachTeam(coach);
  const row = await findAthleteInTeam(teamId, id);
  if (!row) throw notFound();
  return row;
}

/** Adds an athlete to the coach's Team. Only the name is required. */
export async function createAthlete(
  coach: CurrentUser,
  input: unknown,
): Promise<Athlete> {
  const data = parseInput(createBasicDataSchema, input);
  const values: BasicData = {
    name: data.name,
    dateOfBirth: data.dateOfBirth ?? null,
    gender: data.gender ?? null,
    careerStartDate: data.careerStartDate ?? null,
    heightCm: data.heightCm ?? null,
  };
  parseInput(completeBasicDataSchema, values);
  const { id: teamId } = await requireCoachTeam(coach);
  const [row] = await getDb()
    .insert(athlete)
    .values({ ...values, teamId })
    .returning({ id: athlete.id });
  const created = row && (await findAthleteInTeam(teamId, row.id));
  if (!created) throw new Error("Athlete could not be created");
  return created;
}

/** Changes basic data of an athlete of the coach's Team. */
export async function updateAthlete(
  coach: CurrentUser,
  id: string,
  input: unknown,
): Promise<Athlete> {
  const patch = parseInput(updateBasicDataSchema, input);
  const { id: teamId } = await requireCoachTeam(coach);
  const current = await findAthleteInTeam(teamId, id);
  if (!current) throw notFound();

  const next: Athlete = { ...current };
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) Object.assign(next, { [key]: value });
  }
  parseInput(completeBasicDataSchema, next);

  const [row] = await getDb()
    .update(athlete)
    .set({
      name: next.name,
      dateOfBirth: next.dateOfBirth,
      gender: next.gender,
      careerStartDate: next.careerStartDate,
      heightCm: next.heightCm,
    })
    .where(and(eq(athlete.id, id), eq(athlete.teamId, teamId)))
    .returning({ id: athlete.id });
  const updated = row && (await findAthleteInTeam(teamId, row.id));
  if (!updated) throw notFound();
  return updated;
}
