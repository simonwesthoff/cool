import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExerciseDetails } from "@/components/exercises/exercise-details";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { DomainError } from "@/domain/errors";
import { getExercise } from "@/domain/exercises";
import { requirePageUser } from "../../current-user";

type Params = PageProps<"/exercises/[number]">["params"];

export default function ExercisePage({
  params,
}: PageProps<"/exercises/[number]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pt-4 pb-24 sm:px-8">
      <Suspense fallback={<LoadingPlaceholder />}>
        <ExerciseInfo params={params} />
      </Suspense>
    </main>
  );
}

export async function ExerciseInfo({ params }: { params: Params }) {
  const { number } = await params;
  await requirePageUser(`/exercises/${number}`);
  const parsed = /^\d{1,5}$/.test(number) ? Number(number) : Number.NaN;
  const result = await getExercise(parsed).catch((error: unknown) => {
    if (error instanceof DomainError && error.kind === "not_found") notFound();
    throw error;
  });
  return <ExerciseDetails exercise={result.exercise} group={result.group} />;
}
