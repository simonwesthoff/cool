"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { localized } from "@/domain/exercises/catalog-types";
import type { PlannedExercise } from "@/domain/macrocycles/calculation";
import type {
  PlannedSession,
  WeekPlan,
} from "@/domain/week-plans/week-plan-types";
import { PlusIcon } from "../icons";
import { useUnsavedChangesGuard } from "../macrocycles/unsaved-changes";
import { Stepper } from "../stepper";
import {
  ExerciseList,
  ExercisePicker,
  type CatalogGroup,
} from "./exercise-list";
import { SessionCard } from "./session-card";
import { ValuesBlock } from "./values-block";
import {
  actualsOf,
  dayForNewSession,
  draftOf,
  exercisesOf,
  newKey,
  normalize,
  payloadOf,
  sessionsOnDay,
  type DraftSession,
} from "./week-draft";

type Props = {
  athleteId: string;
  plan: Pick<
    WeekPlan,
    "weekNumber" | "durationWeeks" | "startDate" | "mesocycle" | "level"
  > & { chosen: number[] };
  initialSessions: PlannedSession[];
  catalog: CatalogGroup[];
  projections: Record<number, PlannedExercise>;
};

/** Monday 2024-01-01 plus `weekday - 1` days, for localized weekday names. */
const dayDate = (weekday: number) => new Date(Date.UTC(2024, 0, weekday));

/**
 * Week editor in two steps on one page: 1. sessions and exercises (catalog
 * column on the left on wide screens), 2. set groups, notes and the
 * deviation from the projection. Switching steps slides only the sessions
 * column (right → left and back) and never leaves the page.
 */
export function WeekEditor({
  athleteId,
  plan,
  initialSessions,
  catalog,
  projections,
}: Props) {
  const t = useTranslations("WeekEditor");
  const tm = useTranslations("Macrocycle.mesocycles");
  const tl = useTranslations("Macrocycle.chart.levels");
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();

  const [sessions, setSessions] = useState<DraftSession[]>(() =>
    draftOf(initialSessions),
  );
  const [step, setStep] = useState<0 | 1>(0);
  const [picking, setPicking] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  // The content the editor started with (or last saved), to tell whether
  // the week has unsaved changes.
  const [initialPayload] = useState(() =>
    JSON.stringify(payloadOf(draftOf(initialSessions))),
  );
  const stored = useRef(initialPayload);

  const blockName = tm(plan.mesocycle);
  const names = useMemo(() => {
    const map = new Map<number, string>();
    for (const g of catalog)
      for (const e of g.exercises)
        map.set(e.number, `${e.number} ${localized(e.name, locale)}`);
    return map;
  }, [catalog, locale]);
  const exerciseName = (n: number) => names.get(n) ?? String(n);
  const dayName = (weekday: number) =>
    format.dateTime(dayDate(weekday), { weekday: "long", timeZone: "UTC" });
  const labelOf = (s: DraftSession) =>
    sessionsOnDay(sessions, s.weekday) > 1
      ? t("sessionLabel", { day: dayName(s.weekday), slot: s.slot })
      : dayName(s.weekday);

  const update = (change: (list: DraftSession[]) => DraftSession[]) => {
    setSessions((list) => normalize(change(list)));
    setStatus("idle");
  };
  const updateSession = (
    key: string,
    change: (s: DraftSession) => DraftSession,
  ) => update((list) => list.map((s) => (s.key === key ? change(s) : s)));
  const updateExercise = (
    sessionKey: string,
    exerciseKey: string,
    change: (
      e: DraftSession["exercises"][number],
    ) => DraftSession["exercises"][number],
  ) =>
    updateSession(sessionKey, (x) => ({
      ...x,
      exercises: x.exercises.map((y) =>
        y.key === exerciseKey ? change(y) : y,
      ),
    }));
  const addExercise = (key: string, exerciseNumber: number) =>
    updateSession(key, (s) =>
      s.exercises.some((e) => e.exerciseNumber === exerciseNumber)
        ? s
        : {
            ...s,
            exercises: [
              ...s.exercises,
              { key: newKey(), exerciseNumber, note: "", groups: [] },
            ],
          },
    );

  const payload = payloadOf(sessions);
  const isDirty = () => JSON.stringify(payload) !== stored.current;

  async function save(): Promise<boolean> {
    setStatus("saving");
    setErrors({});
    const body = payloadOf(sessions);
    const response = await fetch(
      `/api/athletes/${athleteId}/macrocycle/weeks/${plan.weekNumber}/plan`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
    ).catch(() => null);
    if (response?.ok) {
      stored.current = JSON.stringify(body);
      setStatus("saved");
      router.refresh();
      return true;
    }
    const result = (await response?.json().catch(() => null)) as {
      error?: { code?: string; fields?: Record<string, string[]> };
    } | null;
    if (result?.error?.code === "VALIDATION_FAILED" && result.error.fields) {
      setErrors(result.error.fields);
      // Values are entered in step 2; show them where the error is.
      if (Object.keys(result.error.fields).some((k) => k.includes("setGroups")))
        setStep(1);
    }
    setStatus("error");
    return false;
  }

  useUnsavedChangesGuard({ isDirty, save });

  const actuals = actualsOf(sessions);
  const onWeek = exercisesOf(sessions);
  const missing = plan.chosen.filter((n) => !onWeek.includes(n));
  const notPlanned = onWeek.filter((n) => !plan.chosen.includes(n));
  const end = new Date(`${plan.startDate}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 6);
  const pickingSession = sessions.find((s) => s.key === picking);
  const newDay = dayForNewSession(sessions);

  const button =
    "inline-flex min-h-11 items-center justify-center rounded-full px-5 font-medium disabled:opacity-60";
  const primary = `${button} bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300`;
  const secondary = `${button} border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900`;
  const slide =
    "transition-[translate,opacity] duration-300 ease-out motion-reduce:transition-none";

  return (
    <div className="flex flex-col gap-6" data-step={step + 1}>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">
          {t("title", { week: plan.weekNumber, weeks: plan.durationWeeks })}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {t("dates", {
            start: format.dateTime(new Date(`${plan.startDate}T00:00:00Z`), {
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            }),
            end: format.dateTime(end, {
              month: "short",
              day: "numeric",
              year: "numeric",
              timeZone: "UTC",
            }),
          })}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t("blockAndLevel", { block: blockName, level: tl(plan.level) })}
        </p>
      </header>

      <Stepper
        label={t("steps.label")}
        completedText={t("steps.completed")}
        current={step}
        items={[
          {
            key: "sessions",
            label: t("steps.sessions"),
            onClick: () => setStep(0),
          },
          {
            key: "values",
            label: t("steps.values"),
            onClick: () => setStep(1),
          },
        ]}
      />

      <section
        aria-label={t("check.label")}
        className="rounded-2xl bg-zinc-50 p-3 text-sm dark:bg-zinc-900"
      >
        {plan.chosen.length === 0 ? (
          <p>{t("check.none", { block: blockName })}</p>
        ) : missing.length === 0 && notPlanned.length === 0 ? (
          <p>{t("check.match", { block: blockName })}</p>
        ) : (
          <>
            {missing.length > 0 && (
              <p data-check="missing">
                {t("check.missing", {
                  block: blockName,
                  list: missing.map(exerciseName).join(", "),
                })}
              </p>
            )}
            {notPlanned.length > 0 && (
              <p data-check="not-planned">
                {t("check.notPlanned", {
                  block: blockName,
                  list: notPlanned.map(exerciseName).join(", "),
                })}
              </p>
            )}
          </>
        )}
      </section>

      {/* Desktop: the catalog fills the left half in step 1; the sessions
          block is shifted right by half its width, so its values half is
          clipped. In step 2 the block slides to the left. */}
      <div className="relative overflow-hidden lg:min-h-[36rem]">
        <aside
          aria-label={t("catalog.title")}
          aria-hidden={step === 1 || undefined}
          className={`absolute inset-y-0 left-0 hidden w-1/2 flex-col pr-4 lg:flex ${slide} ${
            step === 0
              ? "opacity-100"
              : "pointer-events-none invisible opacity-0"
          }`}
        >
          <ExerciseList
            catalog={catalog}
            chosen={plan.chosen}
            blockName={blockName}
            draggable
          />
        </aside>
        <div
          data-sessions-column
          className={`flex flex-col gap-4 ${slide} ${
            step === 0 ? "lg:translate-x-1/2" : "lg:translate-x-0"
          }`}
        >
          {sessions.map((s, si) => {
            const label = labelOf(s);
            if (step === 0)
              return (
                <div key={s.key} className="lg:w-1/2">
                  <SessionCard
                    session={s}
                    sessions={sessions}
                    label={label}
                    dayName={dayName}
                    exerciseName={exerciseName}
                    chosen={plan.chosen}
                    blockName={blockName}
                    onChangeDay={(weekday) =>
                      updateSession(s.key, (x) => ({ ...x, weekday, slot: 9 }))
                    }
                    onRemove={() =>
                      update((list) => list.filter((x) => x.key !== s.key))
                    }
                    onAddClick={() => setPicking(s.key)}
                    onDropExercise={(n) => addExercise(s.key, n)}
                    onMoveExercise={(index, delta) =>
                      updateSession(s.key, (x) => {
                        const list = [...x.exercises];
                        const [moved] = list.splice(index, 1);
                        list.splice(index + delta, 0, moved!);
                        return { ...x, exercises: list };
                      })
                    }
                    onRemoveExercise={(index) =>
                      updateSession(s.key, (x) => ({
                        ...x,
                        exercises: x.exercises.filter((_, i) => i !== index),
                      }))
                    }
                  />
                </div>
              );
            // Step 2: the session card (day, slot, exercises) on the left,
            // each exercise's values on the right in the same row.
            const rows = Math.max(1, s.exercises.length);
            return (
              <section
                key={s.key}
                aria-label={label}
                data-session={`${s.weekday}.${s.slot}`}
                className="grid grid-cols-1 gap-x-4 gap-y-2 lg:grid-cols-2"
              >
                <h3 className="font-semibold lg:hidden">{label}</h3>
                <div
                  aria-hidden="true"
                  style={{ ["--span" as string]: rows + 1 }}
                  className="hidden rounded-2xl border border-zinc-200 px-3 pb-3 lg:col-start-1 lg:grid lg:grid-rows-subgrid lg:[grid-row:1/span_var(--span)] dark:border-zinc-800"
                >
                  <p className="pt-3 font-semibold">{label}</p>
                  {s.exercises.map((e) => (
                    <p key={e.key} className="pt-3 text-sm font-medium">
                      {exerciseName(e.exerciseNumber)}
                    </p>
                  ))}
                </div>
                {s.exercises.map((e, ei) => (
                  <div
                    key={e.key}
                    style={{ ["--row" as string]: ei + 2 }}
                    className="transition-opacity duration-300 starting:opacity-0 motion-reduce:transition-none lg:col-start-2 lg:[grid-row:var(--row)]"
                  >
                    <ValuesBlock
                      exercise={e}
                      name={exerciseName(e.exerciseNumber)}
                      path={`sessions.${si}.exercises.${ei}`}
                      errors={errors}
                      actuals={actuals.get(e.exerciseNumber)}
                      projection={projections[e.exerciseNumber]}
                      onChangeGroup={(gi, field, value) =>
                        updateExercise(s.key, e.key, (y) => ({
                          ...y,
                          groups: y.groups.map((g, i) =>
                            i === gi ? { ...g, [field]: value } : g,
                          ),
                        }))
                      }
                      onAddGroup={() =>
                        updateExercise(s.key, e.key, (y) => {
                          // A new set group starts as a copy of the last one.
                          const last = y.groups.at(-1);
                          return {
                            ...y,
                            groups: [
                              ...y.groups,
                              {
                                key: newKey(),
                                sets: last?.sets ?? "",
                                reps: last?.reps ?? "",
                                weight: last?.weight ?? "",
                              },
                            ],
                          };
                        })
                      }
                      onRemoveGroup={(gi) =>
                        updateExercise(s.key, e.key, (y) => ({
                          ...y,
                          groups: y.groups.filter((_, i) => i !== gi),
                        }))
                      }
                      onChangeNote={(note) =>
                        updateExercise(s.key, e.key, (y) => ({ ...y, note }))
                      }
                    />
                  </div>
                ))}
                {s.exercises.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-zinc-300 p-3 text-sm text-zinc-500 lg:col-start-2 lg:row-start-2 dark:border-zinc-700">
                    {t("values.noExercises")}
                  </p>
                )}
              </section>
            );
          })}
          {step === 0 && (
            <div className="lg:w-1/2">
              <button
                type="button"
                disabled={newDay === null}
                onClick={() =>
                  newDay !== null &&
                  update((list) => [
                    ...list,
                    { key: newKey(), weekday: newDay, slot: 9, exercises: [] },
                  ])
                }
                className={`${secondary} w-full gap-2`}
              >
                <PlusIcon />
                {t("session.add")}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {step === 0 ? (
          <>
            <button
              type="button"
              onClick={() => setStep(1)}
              className={primary}
            >
              {t("continue")}
            </button>
            <button
              type="button"
              onClick={save}
              disabled={status === "saving"}
              className={secondary}
            >
              {t("save")}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={save}
              disabled={status === "saving"}
              className={primary}
            >
              {t("save")}
            </button>
            <button
              type="button"
              onClick={() => setStep(0)}
              className={secondary}
            >
              {t("back")}
            </button>
          </>
        )}
        {status === "saved" && (
          <p role="status" className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("saved")}
          </p>
        )}
        {status === "error" && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-400">
            {Object.keys(errors).length ? t("checkFields") : t("saveFailed")}
          </p>
        )}
      </div>

      <ExercisePicker
        open={pickingSession !== undefined}
        title={
          pickingSession
            ? t("catalog.addTo", { session: labelOf(pickingSession) })
            : ""
        }
        onClose={() => setPicking(null)}
        catalog={catalog}
        chosen={plan.chosen}
        blockName={blockName}
        disabled={pickingSession?.exercises.map((e) => e.exerciseNumber) ?? []}
        onPick={(n) => {
          if (picking) addExercise(picking, n);
          setPicking(null);
        }}
      />
    </div>
  );
}
