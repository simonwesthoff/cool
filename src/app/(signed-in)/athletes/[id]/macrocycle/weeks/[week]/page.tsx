import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { GuardedBackLink } from "@/components/macrocycles/leave-guard";
import { PageMain } from "@/components/page-main";
import { WeekEditor } from "@/components/week-plans/week-editor";
import { getAthlete } from "@/domain/athletes";
import { DomainError } from "@/domain/errors";
import { getCatalog } from "@/domain/exercises";
import { getWeekProjections, initialWeekContent } from "@/domain/week-plans";
import { requireCoachPage } from "../../../../../current-user";

type Props = PageProps<"/athletes/[id]/macrocycle/weeks/[week]">;

/** Week editor for the coach of the athlete's Team. */
export default function WeekPlanPage(props: Props) {
  return (
    <PageMain>
      <Suspense fallback={<LoadingPlaceholder />}>
        <WeekPlanEditor {...props} />
      </Suspense>
    </PageMain>
  );
}

export async function WeekPlanEditor({ params, searchParams }: Props) {
  const { id, week } = await params;
  const { prefill } = await searchParams;
  const { user } = await requireCoachPage(
    `/athletes/${id}/macrocycle/weeks/${week}`,
  );
  const onNotFound = (error: unknown) => {
    if (error instanceof DomainError && error.kind === "not_found") notFound();
    throw error;
  };
  const athlete = await getAthlete(user, id).catch(onNotFound);
  const [content, projections, catalog] = await Promise.all([
    initialWeekContent(user, id, week, prefill === "previous").catch(
      onNotFound,
    ),
    getWeekProjections(user, id, week).catch(onNotFound),
    getCatalog(),
  ]);
  const tb = await getTranslations("Back");
  return (
    <div className="flex flex-col gap-6">
      <GuardedBackLink
        href={`/athletes/${id}`}
        label={tb("athlete", { name: athlete.name })}
      />
      <WeekEditor
        athleteId={id}
        plan={{
          weekNumber: content.plan.weekNumber,
          durationWeeks: content.plan.durationWeeks,
          startDate: content.plan.startDate,
          mesocycle: content.plan.mesocycle,
          level: content.plan.level,
          chosen: content.plan.check.chosen,
          variations: content.plan.variations,
        }}
        initialSessions={content.sessions}
        catalog={catalog.map((g) => ({
          code: g.code,
          name: g.name,
          exercises: g.exercises.map((e) => ({
            number: e.number,
            name: e.name,
            liftCategories: e.liftCategories,
          })),
        }))}
        projections={projections}
      />
    </div>
  );
}
