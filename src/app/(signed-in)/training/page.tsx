import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AthleteHome } from "@/components/athletes/athlete-home";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { findMacrocycle } from "@/domain/macrocycles";
import { requirePageRoles } from "../current-user";

/** "My training": the athlete's page, as the coach sees it on the details page. */
export default function TrainingPage() {
  return (
    <main className="flex w-full flex-1 flex-col px-4 pt-4 pb-24">
      <Suspense fallback={<LoadingPlaceholder />}>
        <Training />
      </Suspense>
    </main>
  );
}

export async function Training() {
  const { user, roles } = await requirePageRoles("/training");
  if (!roles.athlete) redirect("/");
  const macrocycle = await findMacrocycle(user, roles.athlete.athleteId);
  return (
    <AthleteHome
      viewer="athlete"
      athleteId={roles.athlete.athleteId}
      name={roles.athlete.athleteName}
      image={user.image}
      coachName={roles.athlete.coachName}
      macrocycle={macrocycle}
    />
  );
}
