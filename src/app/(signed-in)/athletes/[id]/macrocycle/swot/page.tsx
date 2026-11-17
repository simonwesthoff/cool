import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { BaseDataForm } from "@/components/macrocycles/base-data-form";
import { today } from "@/domain/athletes/basic-data";
import { PlanningHeader } from "../planning-header";
import { loadPlanning, nextMonday } from "../shared";
import { PageMain } from "@/components/page-main";

type Params = PageProps<"/athletes/[id]/macrocycle/swot">["params"];

/** Macrocycle planning, step 2: SWOT. */
export default function SwotPage({
  params,
}: PageProps<"/athletes/[id]/macrocycle/swot">) {
  return (
    <PageMain>
      <Suspense fallback={<LoadingPlaceholder />}>
        <Swot params={params} />
      </Suspense>
    </PageMain>
  );
}

export async function Swot({ params }: { params: Params }) {
  const { id } = await params;
  const { athlete, macrocycle } = await loadPlanning(
    id,
    `/athletes/${id}/macrocycle/swot`,
  );
  if (!macrocycle) redirect(`/athletes/${id}/macrocycle/base-data`);
  return (
    <div className="flex flex-col gap-6">
      <PlanningHeader
        athleteId={id}
        athleteName={athlete.name}
        step="swot"
        hasMacrocycle
      />
      <BaseDataForm
        athleteId={id}
        part="swot"
        macrocycle={macrocycle}
        defaultStartDate={nextMonday(today())}
      />
    </div>
  );
}
