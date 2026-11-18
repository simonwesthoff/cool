import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { MacrocycleView } from "@/components/macrocycles/macrocycle-view";
import { requirePageRoles } from "../../current-user";
import { loadMacrocycleView } from "../../macrocycle-view/load";
import { BackLink } from "@/components/back-link";
import { firstName } from "@/components/first-name";
import { PageMain } from "@/components/page-main";

/** The athlete's own macrocycle, read-only. */
export default function AthleteMacrocyclePage() {
  return (
    <PageMain>
      <Suspense fallback={<LoadingPlaceholder />}>
        <AthleteMacrocycle />
      </Suspense>
    </PageMain>
  );
}

export async function AthleteMacrocycle() {
  const { user, roles } = await requirePageRoles("/training/macrocycle");
  if (!roles.athlete) redirect("/");
  const t = await getTranslations("MacrocycleView");
  const view = await loadMacrocycleView(user, roles.athlete.athleteId);
  const tb = await getTranslations("Back");
  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/training" label={tb("training")} />
      <h1 className="text-2xl font-semibold">
        {t("title", { name: firstName(roles.athlete.athleteName) })}
      </h1>
      {view ? (
        <MacrocycleView {...view} />
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
