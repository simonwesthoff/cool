import { Suspense } from "react";
import { ExerciseList } from "@/components/exercises/exercise-list";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { getCatalog } from "@/domain/exercises";
import { requirePageUser } from "../current-user";
import { PageMain } from "@/components/page-main";

/** The exercise catalog, for every signed-in user. */
export default function ExercisesPage() {
  return (
    <PageMain>
      <Suspense fallback={<LoadingPlaceholder />}>
        <Exercises />
      </Suspense>
    </PageMain>
  );
}

export async function Exercises() {
  await requirePageUser("/exercises");
  return <ExerciseList groups={await getCatalog()} />;
}
