import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { MacrocycleView } from "@/components/macrocycles/macrocycle-view";
import { getAthlete } from "@/domain/athletes";
import { DomainError } from "@/domain/errors";
import { requireCoachPage } from "../../../current-user";
import { loadMacrocycleView } from "../../../macrocycle-view/load";

type Params = PageProps<"/athletes/[id]/macrocycle">["params"];

/** Macrocycle view for the coach of the athlete's Team. */
export default function MacrocycleViewPage({
  params,
}: PageProps<"/athletes/[id]/macrocycle">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pt-4 pb-24 sm:px-8">
      <Suspense fallback={<LoadingPlaceholder />}>
        <CoachMacrocycleView params={params} />
      </Suspense>
    </main>
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
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {athlete.name}
        </p>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
      </div>
      <MacrocycleView
        {...view}
        editHref={`/athletes/${id}/macrocycle/base-data`}
        back={{ href: `/athletes/${id}`, label: t("backAthlete") }}
      />
    </div>
  );
}
