import { Suspense } from "react";
import { AthleteForm } from "@/components/athletes/athlete-form";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { requireCoachPage } from "../../current-user";

export default function NewAthletePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-4 pb-24">
      <Suspense fallback={<LoadingPlaceholder />}>
        <NewAthlete />
      </Suspense>
    </main>
  );
}

async function NewAthlete() {
  await requireCoachPage("/athletes/new");
  return <AthleteForm />;
}
