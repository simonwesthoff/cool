"use client";

import { useTranslations } from "next-intl";
import { Stepper } from "../stepper";
import { PLANNING_STEPS, type PlanningStep } from "./planning-steps";

export type { PlanningStep };

/**
 * Stepper of the macrocycle planning. The steps are on one page; choosing
 * one calls `onSelect` (which asks about unsaved changes first).
 */
export function StepIndicator({
  current,
  available,
  onSelect,
}: {
  current: PlanningStep;
  /** Steps 2 to 4 need an existing macrocycle. */
  available: boolean;
  onSelect: (step: PlanningStep) => void;
}) {
  const t = useTranslations("Macrocycle.steps");
  return (
    <Stepper
      label={t("label")}
      completedText={t("completed")}
      current={PLANNING_STEPS.indexOf(current)}
      items={PLANNING_STEPS.map((step) => ({
        key: step,
        label: t(step),
        onClick: () => onSelect(step),
        disabled: !available && step !== "base-data",
      }))}
    />
  );
}
