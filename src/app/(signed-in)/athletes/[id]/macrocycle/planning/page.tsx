import { Suspense } from "react";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { MacrocyclePlanning } from "@/components/macrocycles/macrocycle-planning";
import {
  isPlanningStep,
  type PlanningStep,
} from "@/components/macrocycles/planning-steps";
import { PageMain } from "@/components/page-main";
import { today } from "@/domain/athletes/basic-data";
import { getCatalog } from "@/domain/exercises";
import { loadPlanning, nextMonday } from "../shared";

type Props = PageProps<"/athletes/[id]/macrocycle/planning">;

/**
 * Macrocycle planning: all four steps on one page, loaded once. `?step=`
 * opens a step; without a macrocycle only step 1 opens.
 */
export default function PlanningPage({ params, searchParams }: Props) {
  return (
    <PageMain>
      <Suspense fallback={<LoadingPlaceholder />}>
        <Planning params={params} searchParams={searchParams} />
      </Suspense>
    </PageMain>
  );
}

export async function Planning({
  params,
  searchParams,
}: Pick<Props, "params" | "searchParams">) {
  const { id } = await params;
  const { step: requested } = await searchParams;
  const asked: PlanningStep = isPlanningStep(requested)
    ? requested
    : "base-data";
  const { athlete, macrocycle } = await loadPlanning(
    id,
    `/athletes/${id}/macrocycle/planning?step=${asked}`,
  );
  return (
    <MacrocyclePlanning
      athleteId={id}
      athleteName={athlete.name}
      initialStep={macrocycle ? asked : "base-data"}
      initialMacrocycle={macrocycle}
      catalog={await getCatalog()}
      defaultStartDate={nextMonday(today())}
    />
  );
}
