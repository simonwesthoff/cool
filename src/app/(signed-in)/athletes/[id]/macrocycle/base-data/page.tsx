import { Suspense } from "react";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { BaseDataForm } from "@/components/macrocycles/base-data-form";
import { today } from "@/domain/athletes/basic-data";
import { PlanningHeader } from "../planning-header";
import { loadPlanning, nextMonday } from "../shared";
import { PageMain } from "@/components/page-main";

type Params = PageProps<"/athletes/[id]/macrocycle/base-data">["params"];

/** Macrocycle planning, step 1: base data. */
export default function BaseDataPage({
  params,
}: PageProps<"/athletes/[id]/macrocycle/base-data">) {
  return (
    <PageMain>
      <Suspense fallback={<LoadingPlaceholder />}>
        <BaseData params={params} />
      </Suspense>
    </PageMain>
  );
}

export async function BaseData({ params }: { params: Params }) {
  const { id } = await params;
  const { athlete, macrocycle } = await loadPlanning(
    id,
    `/athletes/${id}/macrocycle/base-data`,
  );
  return (
    <div className="flex flex-col gap-6">
      <PlanningHeader
        athleteId={id}
        athleteName={athlete.name}
        step="base-data"
        hasMacrocycle={macrocycle !== null}
      />
      <BaseDataForm
        athleteId={id}
        part="base"
        macrocycle={macrocycle ?? undefined}
        defaultStartDate={nextMonday(today())}
      />
    </div>
  );
}
