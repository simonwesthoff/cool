import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { ExerciseSelection } from "@/components/macrocycles/exercise-selection";
import { getCatalog } from "@/domain/exercises";
import { PlanningHeader } from "../planning-header";
import { loadPlanning } from "../shared";

type Params = PageProps<"/athletes/[id]/macrocycle/exercises">["params"];

/** Macrocycle planning, step 3: exercises per mesocycle. */
export default function ExercisesStepPage({
  params,
}: PageProps<"/athletes/[id]/macrocycle/exercises">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pt-4 pb-24 sm:px-8">
      <Suspense fallback={<LoadingPlaceholder />}>
        <ExercisesStep params={params} />
      </Suspense>
    </main>
  );
}

export async function ExercisesStep({ params }: { params: Params }) {
  const { id } = await params;
  const { athlete, macrocycle } = await loadPlanning(
    id,
    `/athletes/${id}/macrocycle/exercises`,
  );
  if (!macrocycle) redirect(`/athletes/${id}/macrocycle/base-data`);
  return (
    <div className="flex flex-col gap-6">
      <PlanningHeader
        athleteId={id}
        athleteName={athlete.name}
        step="exercises"
        hasMacrocycle
      />
      <ExerciseSelection macrocycle={macrocycle} catalog={await getCatalog()} />
    </div>
  );
}
