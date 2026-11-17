import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AthleteOverview } from "@/components/athletes/athlete-overview";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { StartChoice } from "@/components/roles/start-choice";
import { listAthletes } from "@/domain/athletes";
import { requirePageRoles } from "./current-user";
import { PageMain } from "@/components/page-main";

/** Home page: depends on the user's roles. */
export default function HomePage() {
  return (
    <PageMain>
      <Suspense fallback={<LoadingPlaceholder />}>
        <Home />
      </Suspense>
    </PageMain>
  );
}

export async function Home() {
  const { user, roles } = await requirePageRoles("/");
  if (roles.coach)
    return <AthleteOverview athletes={await listAthletes(user)} />;
  if (roles.athlete) redirect("/training");
  return <StartChoice />;
}
