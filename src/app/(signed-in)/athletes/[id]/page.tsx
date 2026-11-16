import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AthleteDetailsHeader } from "@/components/athletes/athlete-details-header";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { getAthlete } from "@/domain/athletes";
import { DomainError } from "@/domain/errors";
import { findMacrocycle } from "@/domain/macrocycles";
import { MacrocycleSection } from "@/components/macrocycles/macrocycle-section";
import { requireCoachPage } from "../../current-user";

type Params = PageProps<"/athletes/[id]">["params"];

/** Athlete details (feature 5 adds macrocycle and current week sections). */
export default function AthleteDetailsPage({
  params,
}: PageProps<"/athletes/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-4 pb-24 sm:px-8">
      <Suspense fallback={<LoadingPlaceholder />}>
        <AthleteDetails params={params} />
      </Suspense>
    </main>
  );
}

export async function AthleteDetails({ params }: { params: Params }) {
  const { id } = await params;
  const { user } = await requireCoachPage(`/athletes/${id}`);
  const athlete = await getAthlete(user, id).catch((error: unknown) => {
    if (error instanceof DomainError && error.kind === "not_found") notFound();
    throw error;
  });
  const macrocycle = await findMacrocycle(user, id);
  return (
    <div className="flex flex-col gap-6">
      <AthleteDetailsHeader athlete={athlete} />
      <MacrocycleSection athleteId={athlete.id} macrocycle={macrocycle} />
    </div>
  );
}
