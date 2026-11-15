import { Suspense } from "react";
import { AthleteForm } from "@/components/athletes/athlete-form";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { requirePageUser } from "../../current-user";

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
  await requirePageUser("/athletes/new");
  return <AthleteForm />;
}
