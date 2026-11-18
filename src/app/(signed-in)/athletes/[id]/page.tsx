import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AthleteHome } from "@/components/athletes/athlete-home";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { getAthlete } from "@/domain/athletes";
import { DomainError } from "@/domain/errors";
import { requireCoachPage } from "../../current-user";
import {
  loadMacrocycleChart,
  loadCurrentWeek,
} from "../../macrocycle-view/load";
import { PageMain } from "@/components/page-main";

type Params = PageProps<"/athletes/[id]">["params"];

/** Athlete details: the athlete's page ("My training") from the coach's side. */
export default function AthleteDetailsPage({
  params,
}: PageProps<"/athletes/[id]">) {
  return (
    <PageMain>
      <Suspense fallback={<LoadingPlaceholder />}>
        <AthleteDetails params={params} />
      </Suspense>
    </PageMain>
  );
}

export async function AthleteDetails({ params }: { params: Params }) {
  const { id } = await params;
  const { user } = await requireCoachPage(`/athletes/${id}`);
  const athlete = await getAthlete(user, id).catch((error: unknown) => {
    if (error instanceof DomainError && error.kind === "not_found") notFound();
    throw error;
  });
  const [macrocycle, currentWeek] = await Promise.all([
    loadMacrocycleChart(user, id),
    loadCurrentWeek(user, id),
  ]);
  return (
    <AthleteHome
      viewer="coach"
      athleteId={athlete.id}
      name={athlete.name}
      image={athlete.linkedAccount?.image ?? null}
      coachName={user.name}
      // getAthlete found the athlete in the user's Team.
      canEdit
      macrocycle={macrocycle}
      currentWeek={currentWeek}
    />
  );
}
