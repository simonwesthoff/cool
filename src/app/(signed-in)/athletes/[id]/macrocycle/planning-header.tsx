import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/back-link";
import {
  StepIndicator,
  type PlanningStep,
} from "@/components/macrocycles/step-indicator";

export async function PlanningHeader({
  athleteId,
  athleteName,
  step,
  hasMacrocycle,
}: {
  athleteId: string;
  athleteName: string;
  step: PlanningStep;
  hasMacrocycle: boolean;
}) {
  const t = await getTranslations("Macrocycle");
  const tb = await getTranslations("Back");
  return (
    <div className="flex flex-col gap-4">
      {/* Back to the macrocycle view, or to the athlete before it exists. */}
      {hasMacrocycle ? (
        <BackLink
          href={`/athletes/${athleteId}/macrocycle`}
          label={tb("macrocycle")}
        />
      ) : (
        <BackLink
          href={`/athletes/${athleteId}`}
          label={tb("athlete", { name: athleteName })}
        />
      )}
      <div className="flex flex-col gap-1">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {athleteName}
        </p>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
      </div>
      <StepIndicator
        athleteId={athleteId}
        current={step}
        available={hasMacrocycle}
      />
    </div>
  );
}
