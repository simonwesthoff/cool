import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { IntensityPlanner } from "@/components/macrocycles/intensity-planner";
import { PlanningHeader } from "../planning-header";
import { loadPlanning } from "../shared";

type Params = PageProps<"/athletes/[id]/macrocycle/intensity">["params"];

/** Macrocycle planning, step 2: intensity chart with week levels. */
export default function IntensityPage({
  params,
}: PageProps<"/athletes/[id]/macrocycle/intensity">) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pt-4 pb-24 sm:px-8">
      <Suspense fallback={<LoadingPlaceholder />}>
        <Intensity params={params} />
      </Suspense>
    </main>
  );
}

export async function Intensity({ params }: { params: Params }) {
  const { id } = await params;
  const { athlete, macrocycle } = await loadPlanning(
    id,
    `/athletes/${id}/macrocycle/intensity`,
  );
  if (!macrocycle) redirect(`/athletes/${id}/macrocycle/base-data`);
  return (
    <div className="flex flex-col gap-6">
      <PlanningHeader
        athleteId={id}
        athleteName={athlete.name}
        step="intensity"
        hasMacrocycle
      />
      <IntensityPlanner macrocycle={macrocycle} />
    </div>
  );
}
