import { Suspense } from "react";
import { ExerciseList } from "@/components/exercises/exercise-list";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { getCatalog } from "@/domain/exercises";
import { requirePageUser } from "../current-user";

/** The exercise catalog, for every signed-in user. */
export default function ExercisesPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pt-4 pb-24 sm:px-8">
      <Suspense fallback={<LoadingPlaceholder />}>
        <Exercises />
      </Suspense>
    </main>
  );
}

export async function Exercises() {
  await requirePageUser("/exercises");
  return <ExerciseList groups={await getCatalog()} />;
}
