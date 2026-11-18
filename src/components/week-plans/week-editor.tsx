"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { localized } from "@/domain/exercises/catalog-types";
import type { PlannedExercise } from "@/domain/macrocycles/calculation";
import { deviation } from "@/domain/week-plans/calculation";
import {
  usesFreeText,
  type PlannedSession,
  type WeekPlan,
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
import { SessionTable } from "./session-table";
import {
  actualsOf,
  dayForNewSession,
  draftOf,
  exercisesOf,
  hasErrors,
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
  > & {
    chosen: number[];
    /** Variations of the mesocycle's exercises, shown after the name. */
    variations: Record<number, string>;
  };
  initialSessions: PlannedSession[];
  catalog: CatalogGroup[];
  projections: Record<number, PlannedExercise>;
};

/** Monday 2024-01-01 plus `weekday - 1` days, for localized weekday names. */
const dayDate = (weekday: number) => new Date(Date.UTC(2024, 0, weekday));

/**
 * Week editor in two steps on one page: 1. exercises and sessions (catalog
 * column on the left on wide screens), 2. one table per session with the
 * sets, notes and the deviation from the projection. Every change is saved
 * on its own. Switching steps slides only the sessions
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
  // Every change is saved on its own; the status line says how it went.
  // Nothing is shown before the first change.
  const [status, setStatus] = useState<
    "untouched" | "pending" | "saving" | "saved" | "invalid" | "failed"
  >("untouched");
  const [initialPayload] = useState(() =>
    JSON.stringify(payloadOf(draftOf(initialSessions))),
  );
  /** What is stored (or what the editor started with). */
  const stored = useRef(initialPayload);
  const latest = useRef(sessions);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<boolean> | null>(null);

  const blockName = tm(plan.mesocycle);
  const names = useMemo(() => {
    const map = new Map<number, string>();
    for (const g of catalog)
      for (const e of g.exercises)
        map.set(e.number, `${e.number} ${localized(e.name, locale)}`);
    return map;
  }, [catalog, locale]);
  /** "13 Snatch pull", with the mesocycle's variation in brackets. */
  const exerciseName = (n: number) => {
    const name = names.get(n) ?? String(n);
    const variation = plan.variations[n];
    return variation ? t("withVariation", { name, variation }) : name;
  };
  const dayName = (weekday: number) =>
    format.dateTime(dayDate(weekday), { weekday: "long", timeZone: "UTC" });
  const labelOf = (s: DraftSession) =>
    sessionsOnDay(sessions, s.weekday) > 1
      ? t("sessionLabel", { day: dayName(s.weekday), slot: s.slot })
      : dayName(s.weekday);

  const update = (change: (list: DraftSession[]) => DraftSession[]) =>
    setSessions((list) => normalize(change(list)));
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
  /** Adds an exercise to a session (at the end, or before `index`). */
  const addExercise = (key: string, exerciseNumber: number, index?: number) =>
    updateSession(key, (s) => {
      if (s.exercises.some((e) => e.exerciseNumber === exerciseNumber))
        return s;
      const list = [...s.exercises];
      list.splice(index ?? list.length, 0, {
        key: newKey(),
        exerciseNumber,
        note: "",
        freeText: "",
        sets: [],
      });
      return { ...s, exercises: list };
    });
  /**
   * Moves an exercise within the week: to another place in its session or
   * into another session (not if that session already has the exercise).
   */
  const moveExercise = (
    fromKey: string,
    exerciseKey: string,
    toKey: string,
    index: number,
  ) =>
    update((list) => {
      const from = list.find((x) => x.key === fromKey);
      const moved = from?.exercises.find((e) => e.key === exerciseKey);
      const to = list.find((x) => x.key === toKey);
      if (!from || !moved || !to) return list;
      if (
        fromKey !== toKey &&
        to.exercises.some((e) => e.exerciseNumber === moved.exerciseNumber)
      )
        return list;
      return list.map((x) => {
        if (fromKey === toKey && x.key === fromKey) {
          const rest = x.exercises.filter((e) => e.key !== exerciseKey);
          const old = x.exercises.indexOf(moved);
          rest.splice(index > old ? index - 1 : index, 0, moved);
          return { ...x, exercises: rest };
        }
        if (x.key === fromKey)
          return {
            ...x,
            exercises: x.exercises.filter((e) => e.key !== exerciseKey),
          };
        if (x.key === toKey) {
          const next = [...x.exercises];
          next.splice(index, 0, moved);
          return { ...x, exercises: next };
        }
        return x;
      });
    });

  /**
   * Saves the latest draft unless it is stored already or has invalid
   * cells; saves again when changes arrived while saving.
   */
  const flush = useCallback(async (): Promise<boolean> => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (inFlight.current) await inFlight.current;
    let saved = false;
    // Save until what is stored is the latest draft.
    for (;;) {
      const draft = latest.current;
      if (hasErrors(draft)) {
        setStatus("invalid");
        return false;
      }
      const body = JSON.stringify(payloadOf(draft));
      if (body === stored.current) break;
      setStatus("saving");
      const run = fetch(
        `/api/athletes/${athleteId}/macrocycle/weeks/${plan.weekNumber}/plan`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body,
        },
      )
        .then((response) => response.ok)
        .catch(() => false);
      inFlight.current = run;
      const ok = await run;
      inFlight.current = null;
      if (!ok) {
        setStatus("failed");
        return false;
      }
      stored.current = body;
      saved = true;
    }
    setStatus((current) => (current === "untouched" ? current : "saved"));
    if (saved) router.refresh();
    return true;
  }, [athleteId, plan.weekNumber, router]);

  // Each change is saved shortly after the last keystroke.
  useEffect(() => {
    latest.current = sessions;
    if (
      JSON.stringify(payloadOf(sessions)) === stored.current &&
      !hasErrors(sessions)
    )
      return;
    setStatus(hasErrors(sessions) ? "invalid" : "pending");
    timer.current = setTimeout(() => void flush(), 500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [sessions, flush]);

  // Leaving with a change that is not saved yet asks first.
  useUnsavedChangesGuard({
    isDirty: () =>
      hasErrors(latest.current) ||
      JSON.stringify(payloadOf(latest.current)) !== stored.current,
    save: flush,
  });

  const actuals = actualsOf(sessions);
  // Values off the plan are allowed (the coach may intend it), but warned.
  const offPlan = exercisesOf(sessions)
    .filter((n) => !usesFreeText(n))
    .reduce((count, n) => {
      const a = actuals.get(n);
      const p = projections[n];
      const pairs: [number | null, number | null][] = [
        [a?.heaviestKg ?? null, p?.bestKg ?? null],
        [a?.averageKg ?? null, p?.averageKg ?? null],
        [a?.setSize ?? null, p?.setSize ?? null],
        [a?.weeklyReps ?? null, p?.weeklyReps ?? null],
      ];
      return (
        count +
        pairs.filter(([x, y]) => {
          const d = deviation(x, y);
          return d === "above" || d === "below";
        }).length
      );
    }, 0);
  const [finishing, setFinishing] = useState(false);
  /** Saves what is left and goes back to the athlete page. */
  async function finish() {
    setFinishing(true);
    const saved = await flush();
    setFinishing(false);
    if (saved) {
      router.push(`/athletes/${athleteId}`);
      router.refresh();
    }
  }
  const onWeek = exercisesOf(sessions);
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
          <h2 className="mb-2 text-lg font-semibold">
            {t("columns.exercises")}
          </h2>
          <ExerciseList
            nameOf={exerciseName}
            catalog={catalog}
            chosen={plan.chosen}
            onWeek={onWeek}
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
          {/* The column's title moves with the column. */}
          <h2 className="text-lg font-semibold">
            {step === 0 ? t("columns.sessions") : t("columns.weights")}
          </h2>
          {sessions.map((s) => {
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
                    onDrop={(drop) =>
                      drop.kind === "add"
                        ? addExercise(s.key, drop.exerciseNumber, drop.index)
                        : moveExercise(
                            drop.sessionKey,
                            drop.exerciseKey,
                            s.key,
                            drop.index,
                          )
                    }
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
            // Step 2: one table per session over the whole width.
            return (
              <div
                key={s.key}
                className="transition-opacity duration-300 starting:opacity-0 motion-reduce:transition-none"
              >
                <SessionTable
                  session={s}
                  label={label}
                  exerciseName={exerciseName}
                  actualsOf={(n) => actuals.get(n)}
                  projectionOf={(n) => projections[n]}
                  onChangeSet={(exerciseKey, index, field, value) =>
                    updateExercise(s.key, exerciseKey, (y) => {
                      // Typing into an empty cell creates the sets up to it.
                      const sets = [...y.sets];
                      while (sets.length <= index)
                        sets.push({ key: newKey(), weight: "", reps: "" });
                      sets[index] = { ...sets[index]!, [field]: value };
                      return { ...y, sets };
                    })
                  }
                  onChangeNote={(exerciseKey, note) =>
                    updateExercise(s.key, exerciseKey, (y) => ({ ...y, note }))
                  }
                  onChangeFreeText={(exerciseKey, freeText) =>
                    updateExercise(s.key, exerciseKey, (y) => ({
                      ...y,
                      freeText,
                    }))
                  }
                />
              </div>
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
          <button type="button" onClick={() => setStep(1)} className={primary}>
            {t("continue")}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => void finish()}
              disabled={finishing}
              className={primary}
            >
              {t("finish")}
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
        {status !== "untouched" && (
          <p
            role={
              status === "failed" || status === "invalid" ? "alert" : "status"
            }
            data-save-status={status}
            className={`text-sm ${
              status === "failed" || status === "invalid"
                ? "text-red-700 dark:text-red-400"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {t(`status.${status}`)}
          </p>
        )}
        {step === 1 && offPlan > 0 && (
          <p
            data-off-plan={offPlan}
            className="basis-full text-sm text-zinc-700 dark:text-zinc-300"
          >
            {t("offPlan", { count: offPlan })}
          </p>
        )}
        {status === "failed" && (
          <button
            type="button"
            onClick={() => void flush()}
            className={secondary}
          >
            {t("retry")}
          </button>
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
        nameOf={exerciseName}
        catalog={catalog}
        chosen={plan.chosen}
        onWeek={onWeek}
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
