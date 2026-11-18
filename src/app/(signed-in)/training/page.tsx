import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AthleteHome } from "@/components/athletes/athlete-home";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { isCoachOfAthlete } from "@/domain/athletes";
import { requirePageRoles } from "../current-user";
import {
  loadMacrocycleChart,
  loadTrainingWeeks,
} from "../macrocycle-view/load";
import { PageMain } from "@/components/page-main";

/** "My training": the athlete's page, as the coach sees it on the details page. */
export default function TrainingPage() {
  return (
    <PageMain>
      <Suspense fallback={<LoadingPlaceholder />}>
        <Training />
      </Suspense>
    </PageMain>
  );
}

export async function Training() {
  const { user, roles } = await requirePageRoles("/training");
  if (!roles.athlete) redirect("/");
  const athleteId = roles.athlete.athleteId;
  const [macrocycle, canEdit] = await Promise.all([
    loadMacrocycleChart(user, athleteId),
    isCoachOfAthlete(user, athleteId),
  ]);
  // The week planning entry points only for whoever may plan.
  const trainingWeeks = canEdit
    ? await loadTrainingWeeks(user, athleteId)
    : null;
  return (
    <AthleteHome
      viewer="athlete"
      athleteId={roles.athlete.athleteId}
      name={roles.athlete.athleteName}
      image={user.image}
      coachName={roles.athlete.coachName}
      canEdit={canEdit}
      macrocycle={macrocycle}
      trainingWeeks={trainingWeeks}
    />
  );
}
