import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { MacrocycleView } from "@/components/macrocycles/macrocycle-view";
import { getAthlete } from "@/domain/athletes";
import { DomainError } from "@/domain/errors";
import { requireCoachPage } from "../../../current-user";
import { loadMacrocycleView } from "../../../macrocycle-view/load";
import { BackLink } from "@/components/back-link";
import { firstName } from "@/components/first-name";
import { PageMain } from "@/components/page-main";

type Params = PageProps<"/athletes/[id]/macrocycle">["params"];

/** Macrocycle view for the coach of the athlete's Team. */
export default function MacrocycleViewPage({
  params,
}: PageProps<"/athletes/[id]/macrocycle">) {
  return (
    <PageMain>
      <Suspense fallback={<LoadingPlaceholder />}>
        <CoachMacrocycleView params={params} />
      </Suspense>
    </PageMain>
  );
}

export async function CoachMacrocycleView({ params }: { params: Params }) {
  const { id } = await params;
  const { user } = await requireCoachPage(`/athletes/${id}/macrocycle`);
  const onNotFound = (error: unknown) => {
    if (error instanceof DomainError && error.kind === "not_found") notFound();
    throw error;
  };
  const athlete = await getAthlete(user, id).catch(onNotFound);
  const view = await loadMacrocycleView(user, id).catch(onNotFound);
  if (!view) redirect(`/athletes/${id}/macrocycle/base-data`);
  const t = await getTranslations("MacrocycleView");
  const tb = await getTranslations("Back");
  return (
    <div className="flex flex-col gap-6">
      <BackLink
        href={`/athletes/${id}`}
        label={tb("athlete", { name: athlete.name })}
      />
      <h1 className="text-2xl font-semibold">
        {t("title", { name: firstName(athlete.name) })}
      </h1>
      <MacrocycleView {...view} />
    </div>
  );
}
