"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Macrocycle } from "@/domain/macrocycles/macrocycle-types";
import type { ExerciseGroup } from "@/domain/exercises/catalog-types";
import { BackLink } from "../back-link";
import { firstName } from "../first-name";
import { BaseDataForm } from "./base-data-form";
import { ExerciseSelection } from "./exercise-selection";
import { IntensityPlanner } from "./intensity-planner";
import { useLeaveGuard } from "./leave-guard";
import { PLANNING_STEPS, type PlanningStep } from "./planning-steps";
import { StepIndicator } from "./step-indicator";

/** The week editor's slide: 300 ms, sliding and fading in. */
const SLIDE =
  "transition-[translate,opacity] duration-300 ease-out motion-reduce:transition-none";
const ENTER = {
  forward: "starting:translate-x-8 starting:opacity-0",
  back: "starting:-translate-x-8 starting:opacity-0",
} as const;

/**
 * The macrocycle planning: all four steps on one page. The current step is
 * kept in the address (`?step=`) without navigating; every save hands the
 * stored macrocycle back, so each step shows the latest data.
 */
export function MacrocyclePlanning({
  athleteId,
  athleteName,
  initialStep,
  initialMacrocycle,
  catalog,
  defaultStartDate,
}: {
  athleteId: string;
  athleteName: string;
  initialStep: PlanningStep;
  initialMacrocycle: Macrocycle | null;
  catalog: ExerciseGroup[];
  defaultStartDate: string;
}) {
  const t = useTranslations("Macrocycle");
  const tb = useTranslations("Back");
  const [step, setStep] = useState<PlanningStep>(initialStep);
  // No slide on the first render, only when switching.
  const [direction, setDirection] = useState<keyof typeof ENTER | null>(null);
  const [macrocycle, setMacrocycle] = useState(initialMacrocycle);
  const { guard, dialog } = useLeaveGuard();

  function open(next: PlanningStep) {
    if (next === step) return;
    setDirection(
      PLANNING_STEPS.indexOf(next) > PLANNING_STEPS.indexOf(step)
        ? "forward"
        : "back",
    );
    setStep(next);
    const params = new URLSearchParams(window.location.search);
    params.set("step", next);
    // Replace, so browser back leaves the planning like the back link.
    window.history.replaceState(null, "", `?${params.toString()}`);
  }
  /** Switches the step, asking first about unsaved changes. */
  const select = (next: PlanningStep) => guard(() => open(next));

  const content = (() => {
    if (step === "base-data" || step === "swot" || !macrocycle)
      return (
        <BaseDataForm
          athleteId={athleteId}
          part={step === "swot" && macrocycle ? "swot" : "base"}
          macrocycle={macrocycle ?? undefined}
          defaultStartDate={defaultStartDate}
          onSaved={setMacrocycle}
          onContinue={() => open(step === "swot" ? "intensity" : "swot")}
        />
      );
    if (step === "intensity")
      return (
        <IntensityPlanner
          macrocycle={macrocycle}
          onSaved={setMacrocycle}
          onContinue={() => select("exercises")}
          onBack={() => select("swot")}
        />
      );
    return (
      <ExerciseSelection
        macrocycle={macrocycle}
        catalog={catalog}
        onSaved={setMacrocycle}
        onBack={() => select("intensity")}
      />
    );
  })();

  return (
    <div className="flex flex-col gap-6" data-planning-step={step}>
      <div className="flex flex-col gap-4">
        {/* Back to the macrocycle view, or to the athlete before it exists. */}
        {macrocycle ? (
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
          current={step}
          available={macrocycle !== null}
          onSelect={select}
        />
      </div>
      {/* The new step slides in; the container never scrolls sideways. */}
      <div className="overflow-x-clip">
        <div
          key={step}
          data-slide={direction ?? "none"}
          className={`${SLIDE} ${direction ? ENTER[direction] : ""}`}
        >
          {content}
        </div>
      </div>
      {dialog}
    </div>
  );
}
