import { notFound } from "next/navigation";
import { getAthlete } from "@/domain/athletes";
import { DomainError } from "@/domain/errors";
import { findMacrocycle } from "@/domain/macrocycles";
import { requireCoachPage } from "../../../current-user";

/** Coach, athlete (not found for other Teams) and the athlete's macrocycle. */
export async function loadPlanning(athleteId: string, path: string) {
  const { user } = await requireCoachPage(path);
  const onNotFound = (error: unknown) => {
    if (error instanceof DomainError && error.kind === "not_found") notFound();
    throw error;
  };
  const athlete = await getAthlete(user, athleteId).catch(onNotFound);
  const macrocycle = await findMacrocycle(user, athleteId).catch(onNotFound);
  return { user, athlete, macrocycle };
}

/** The next Monday on or after `from` (YYYY-MM-DD). */
export function nextMonday(from: string): string {
  const date = new Date(`${from}T00:00:00Z`);
  const offset = (8 - date.getUTCDay()) % 7;
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}
