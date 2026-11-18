"use client";

import { useTranslations } from "next-intl";
import { Stepper } from "../stepper";
import { useLeaveGuard } from "./leave-guard";

const steps = ["base-data", "swot", "intensity", "exercises"] as const;
export type PlanningStep = (typeof steps)[number];

/**
 * Stepper of the macrocycle planning. Choosing another step with unsaved
 * changes in the current form asks first.
 */
export function StepIndicator({
  athleteId,
  current,
  available,
}: {
  athleteId: string;
  current: PlanningStep;
  /** Steps 2 to 4 need an existing macrocycle. */
  available: boolean;
}) {
  const t = useTranslations("Macrocycle.steps");
  const { leave, dialog } = useLeaveGuard();
  return (
    <>
      <Stepper
        label={t("label")}
        completedText={t("completed")}
        current={steps.indexOf(current)}
        items={steps.map((step) => {
          const href = `/athletes/${athleteId}/macrocycle/${step}`;
          return {
            key: step,
            label: t(step),
            href,
            onClick: (event) => leave(event, href),
            disabled: !available && step !== "base-data",
          };
        })}
      />
      {dialog}
    </>
  );
}
