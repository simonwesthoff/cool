import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { IntensityPlanner } from "@/components/macrocycles/intensity-planner";
import { PlanningHeader } from "../planning-header";
import { loadPlanning } from "../shared";
import { PageMain } from "@/components/page-main";

type Params = PageProps<"/athletes/[id]/macrocycle/intensity">["params"];

/** Macrocycle planning, step 2: intensity chart with week levels. */
export default function IntensityPage({
  params,
}: PageProps<"/athletes/[id]/macrocycle/intensity">) {
  return (
    <PageMain>
      <Suspense fallback={<LoadingPlaceholder />}>
        <Intensity params={params} />
      </Suspense>
    </PageMain>
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
