import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AthleteList } from "@/components/athletes/athlete-list";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { StartChoice } from "@/components/roles/start-choice";
import { listAthletes } from "@/domain/athletes";
import { requirePageRoles } from "./current-user";

/** Home page: depends on the user's roles. */
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
  const { user, roles } = await requirePageRoles("/");
  if (roles.coach) return <AthleteList athletes={await listAthletes(user)} />;
  if (roles.athlete) redirect("/training");
  return <StartChoice />;
}
