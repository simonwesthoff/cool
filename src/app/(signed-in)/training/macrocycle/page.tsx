import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { MacrocycleView } from "@/components/macrocycles/macrocycle-view";
import { requirePageRoles } from "../../current-user";
import { loadMacrocycleView } from "../../macrocycle-view/load";

/** The athlete's own macrocycle, read-only. */
export default function AthleteMacrocyclePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pt-4 pb-24 sm:px-8">
      <Suspense fallback={<LoadingPlaceholder />}>
        <AthleteMacrocycle />
      </Suspense>
    </main>
  );
}

export async function AthleteMacrocycle() {
  const { user, roles } = await requirePageRoles("/training/macrocycle");
  if (!roles.athlete) redirect("/");
  const t = await getTranslations("MacrocycleView");
  const view = await loadMacrocycleView(user, roles.athlete.athleteId);
  const back = { href: "/training", label: t("backTraining") };
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {roles.athlete.athleteName}
        </p>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
      </div>
      {view ? (
        <MacrocycleView {...view} back={back} />
      ) : (
        <p
          data-testid="not-planned"
          className="text-zinc-600 dark:text-zinc-400"
        >
          {t("notPlanned")}
        </p>
      )}
    </div>
  );
}
