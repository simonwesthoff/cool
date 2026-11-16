import { getTranslations } from "next-intl/server";
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
  return (
    <div className="flex flex-col gap-4">
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
