import { and, asc, eq } from "drizzle-orm";
import type { CurrentUser } from "@/domain/auth";
import { DomainError } from "@/domain/errors";
import { parseInput } from "@/domain/validation";
import { getDb } from "@/server/db";
import { athlete, team } from "@/server/db/schema";
import {
  completeBasicDataSchema,
  createBasicDataSchema,
  updateBasicDataSchema,
  type Athlete,
  type BasicData,
} from "./basic-data";

export type Team = { id: string; coachId: string };

const notFound = () => new DomainError("not_found", "ATHLETE_NOT_FOUND");

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const columns = {
  id: athlete.id,
  name: athlete.name,
  dateOfBirth: athlete.dateOfBirth,
  gender: athlete.gender,
  careerStartDate: athlete.careerStartDate,
  heightCm: athlete.heightCm,
};

/**
 * The Team the user leads as coach. Until user roles exist, every user leads
 * exactly one Team, created on first use. Safe against parallel first calls.
 */
export async function getOrCreateTeam(coach: CurrentUser): Promise<Team> {
  const db = getDb();
  await db
    .insert(team)
    .values({ coachId: coach.id })
    .onConflictDoNothing({ target: team.coachId });
  const [row] = await db
    .select({ id: team.id, coachId: team.coachId })
    .from(team)
    .where(eq(team.coachId, coach.id));
  if (!row) throw new Error("Team could not be created");
  return row;
}

/** Athletes of the coach's Team, sorted by name. */
export async function listAthletes(coach: CurrentUser): Promise<Athlete[]> {
  const { id: teamId } = await getOrCreateTeam(coach);
  return getDb()
    .select(columns)
    .from(athlete)
    .where(eq(athlete.teamId, teamId))
    .orderBy(asc(athlete.name), asc(athlete.id));
}

async function findInTeam(teamId: string, id: string) {
  if (!UUID.test(id)) return undefined;
  const [row] = await getDb()
    .select(columns)
    .from(athlete)
    .where(and(eq(athlete.id, id), eq(athlete.teamId, teamId)));
  return row;
}

/** One athlete of the coach's Team; `ATHLETE_NOT_FOUND` otherwise. */
export async function getAthlete(
  coach: CurrentUser,
  id: string,
): Promise<Athlete> {
  const { id: teamId } = await getOrCreateTeam(coach);
  const row = await findInTeam(teamId, id);
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
  const { id: teamId } = await getOrCreateTeam(coach);
  const [row] = await getDb()
    .insert(athlete)
    .values({ ...values, teamId })
    .returning(columns);
  if (!row) throw new Error("Athlete could not be created");
  return row;
}

/** Changes basic data of an athlete of the coach's Team. */
export async function updateAthlete(
  coach: CurrentUser,
  id: string,
  input: unknown,
): Promise<Athlete> {
  const patch = parseInput(updateBasicDataSchema, input);
  const { id: teamId } = await getOrCreateTeam(coach);
  const current = await findInTeam(teamId, id);
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
    .returning(columns);
  if (!row) throw notFound();
  return row;
}
