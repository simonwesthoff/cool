import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AthleteForm } from "@/components/athletes/athlete-form";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { getAthlete } from "@/domain/athletes";
import { DomainError } from "@/domain/errors";
import { requirePageUser } from "../../current-user";

type Params = PageProps<"/athletes/[id]">["params"];

export default function EditAthletePage({
  params,
}: PageProps<"/athletes/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-4 pb-24">
      <Suspense fallback={<LoadingPlaceholder />}>
        <EditAthlete params={params} />
      </Suspense>
    </main>
  );
}

export async function EditAthlete({ params }: { params: Params }) {
  const { id } = await params;
  const coach = await requirePageUser(`/athletes/${id}`);
  const athlete = await getAthlete(coach, id).catch((error: unknown) => {
    if (error instanceof DomainError && error.kind === "not_found") notFound();
    throw error;
  });
  return <AthleteForm athlete={athlete} />;
}
