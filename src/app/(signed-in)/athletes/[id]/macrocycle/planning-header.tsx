import { getTranslations } from "next-intl/server";
import { firstName } from "@/components/first-name";
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
      <h1 className="text-2xl font-semibold">
        {t("title", { name: firstName(athleteName) })}
      </h1>
      <StepIndicator
        athleteId={athleteId}
        current={step}
        available={hasMacrocycle}
      />
    </div>
  );
}
