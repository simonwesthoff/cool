import { Suspense } from "react";
import { AthleteList } from "@/components/athletes/athlete-list";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { listAthletes } from "@/domain/athletes";
import { requirePageUser } from "./current-user";

/** Home page: the coach's athletes (placeholder until feature 4). */
export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-4 pb-24 sm:px-8">
      <Suspense fallback={<LoadingPlaceholder />}>
        <Home />
      </Suspense>
    </main>
  );
}

export async function Home() {
  const coach = await requirePageUser("/");
  return <AthleteList athletes={await listAthletes(coach)} />;
}
