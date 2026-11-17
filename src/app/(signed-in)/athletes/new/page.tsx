import { Suspense } from "react";
import { AthleteForm } from "@/components/athletes/athlete-form";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { requireCoachPage } from "../../current-user";
import { PageMain } from "@/components/page-main";

export default function NewAthletePage() {
  return (
    <PageMain>
      <Suspense fallback={<LoadingPlaceholder />}>
        <NewAthlete />
      </Suspense>
    </PageMain>
  );
}

async function NewAthlete() {
  await requireCoachPage("/athletes/new");
  return <AthleteForm />;
}
