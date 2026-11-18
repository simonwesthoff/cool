"use client";

import { useFormatter, useTranslations } from "next-intl";
import type { PlannedExercise } from "@/domain/macrocycles/calculation";
import {
  deviation,
  type Deviation,
  type WeekActuals,
} from "@/domain/week-plans/calculation";
import { usesFreeText } from "@/domain/week-plans/week-plan-types";
import {
  MAX_SETS,
  setErrors,
  type DraftExercise,
  type DraftSession,
} from "./week-draft";

type Handlers = {
  onChangeSet: (
    exerciseKey: string,
    index: number,
    field: "weight" | "reps",
    value: string,
  ) => void;
  onChangeNote: (exerciseKey: string, note: string) => void;
  onChangeFreeText: (exerciseKey: string, text: string) => void;
};

const INDICATORS = ["heaviest", "average", "setSize", "reps"] as const;
type Indicator = (typeof INDICATORS)[number];

const SETS = Array.from({ length: MAX_SETS }, (_, i) => i);

/** Grid lines of the table. */
const line = "border border-zinc-200 dark:border-zinc-800";
/** An input that fills its cell, like a spreadsheet. */
const fill =
  "block h-8 w-full min-w-0 bg-transparent px-1 tabular-nums outline-none focus:bg-zinc-100 aria-invalid:bg-red-50 aria-invalid:text-red-700 dark:focus:bg-zinc-900 dark:aria-invalid:bg-red-950 dark:aria-invalid:text-red-400";

/**
 * A session in step 2 as a compact table. Each exercise takes two rows:
 * weights and "Actual" on top, reps and "Plan" below, ten set columns, the
 * coach note, and the indicators best value, mHG, set size and reps as
 * columns. Exercises from 30 on have a free text instead of sets and no
 * indicators.
 */
export function SessionTable({
  session,
  label,
  exerciseName,
  actualsOf,
  projectionOf,
  ...handlers
}: {
  session: DraftSession;
  /** "Monday" or "Monday 1". */
  label: string;
  exerciseName: (exerciseNumber: number) => string;
  actualsOf: (exerciseNumber: number) => WeekActuals | undefined;
  projectionOf: (exerciseNumber: number) => PlannedExercise | undefined;
} & Handlers) {
  const t = useTranslations("WeekEditor.values");
  const tt = useTranslations("WeekEditor.totals");
  const head =
    "px-1 py-1 text-xs font-semibold text-zinc-600 dark:text-zinc-400";

  return (
    <section
      aria-label={label}
      data-session={`${session.weekday}.${session.slot}`}
      className="flex flex-col gap-1"
    >
      <h3 className="font-semibold">{label}</h3>
      {session.exercises.length === 0 ? (
        <p className="text-sm text-zinc-500">{t("noExercises")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900">
                <th
                  scope="col"
                  className={`${line} ${head} sticky left-0 z-[1] w-36 bg-zinc-50 text-left dark:bg-zinc-900`}
                >
                  {t("exercise")}
                </th>
                <th scope="col" className={`${line} w-10`}>
                  <span className="sr-only">{t("row")}</span>
                </th>
                {SETS.map((i) => (
                  <th
                    key={i}
                    scope="col"
                    className={`${line} ${head} w-11 text-right`}
                  >
                    {i + 1}
                  </th>
                ))}
                <th scope="col" className={`${line} ${head} text-left`}>
                  {t("note")}
                </th>
                <th scope="col" className={`${line} w-10`}>
                  <span className="sr-only">{tt("row")}</span>
                </th>
                {INDICATORS.map((key) => (
                  <th
                    key={key}
                    scope="col"
                    data-heading={key}
                    className={`${line} ${head} w-16 text-right`}
                  >
                    {tt(key)}
                  </th>
                ))}
              </tr>
            </thead>
            {session.exercises.map((e) => (
              <ExerciseRows
                key={e.key}
                exercise={e}
                name={exerciseName(e.exerciseNumber)}
                actuals={actualsOf(e.exerciseNumber)}
                projection={projectionOf(e.exerciseNumber)}
                handlers={handlers}
              />
            ))}
          </table>
        </div>
      )}
    </section>
  );
}

function ExerciseRows({
  exercise,
  name,
  actuals,
  projection,
  handlers,
}: {
  exercise: DraftExercise;
  name: string;
  actuals: WeekActuals | undefined;
  projection: PlannedExercise | undefined;
  handlers: Handlers;
}) {
  const t = useTranslations("WeekEditor.values");
  const tt = useTranslations("WeekEditor.totals");
  const free = usesFreeText(exercise.exerciseNumber);
  const rowLabel = `${line} px-1 text-right text-xs font-normal text-zinc-500`;

  const setCells = (field: "weight" | "reps") =>
    SETS.map((i) => {
      const set = exercise.sets[i];
      const invalid = set ? setErrors(set).includes(field) : false;
      return (
        <td key={i} className={`${line} p-0`}>
          <input
            inputMode={field === "weight" ? "decimal" : "numeric"}
            value={set?.[field] ?? ""}
            onChange={(event) =>
              handlers.onChangeSet(exercise.key, i, field, event.target.value)
            }
            aria-label={t(field === "weight" ? "weightOf" : "repsOf", {
              n: i + 1,
              name,
            })}
            aria-invalid={invalid}
            className={`${fill} text-right`}
          />
        </td>
      );
    });

  return (
    <tbody data-exercise={exercise.exerciseNumber}>
      <tr data-row="weight">
        <th
          scope="rowgroup"
          rowSpan={2}
          // Stays in view while the table scrolls sideways on phones.
          className={`${line} sticky left-0 z-[1] bg-white px-2 text-left align-middle font-medium dark:bg-zinc-950`}
        >
          {name}
        </th>
        {free ? (
          <td colSpan={MAX_SETS + 1} rowSpan={2} className={`${line} p-0`}>
            <textarea
              value={exercise.freeText}
              onChange={(event) =>
                handlers.onChangeFreeText(exercise.key, event.target.value)
              }
              rows={2}
              maxLength={500}
              aria-label={t("freeTextOf", { name })}
              placeholder={t("freeText")}
              className={`${fill} h-16 resize-none py-1`}
            />
          </td>
        ) : (
          <>
            <th scope="row" className={rowLabel}>
              {t("kg")}
            </th>
            {setCells("weight")}
          </>
        )}
        <td rowSpan={2} className={`${line} min-w-40 p-0 align-top`}>
          <textarea
            value={exercise.note}
            onChange={(event) =>
              handlers.onChangeNote(exercise.key, event.target.value)
            }
            rows={2}
            maxLength={500}
            aria-label={t("noteOf", { name })}
            className={`${fill} h-16 resize-none py-1`}
          />
        </td>
        {free ? (
          // Exercises without values have no indicators.
          <td colSpan={INDICATORS.length + 1} rowSpan={2} className={line} />
        ) : (
          <>
            <th scope="row" className={rowLabel}>
              {tt("actual")}
            </th>
            <Values kind="actual" actuals={actuals} projection={projection} />
          </>
        )}
      </tr>
      <tr data-row="reps">
        {!free && (
          <>
            <th scope="row" className={rowLabel}>
              {t("reps")}
            </th>
            {setCells("reps")}
          </>
        )}
        {!free && (
          <>
            <th scope="row" className={rowLabel}>
              {tt("plan")}
            </th>
            <Values kind="plan" actuals={actuals} projection={projection} />
          </>
        )}
      </tr>
    </tbody>
  );
}

const colour: Record<Deviation, string> = {
  above: "text-red-700 dark:text-red-400",
  below: "text-blue-700 dark:text-blue-400",
  within: "",
};

/** One row of indicator cells: the week's actual values or the plan. */
function Values({
  kind,
  actuals,
  projection,
}: {
  kind: "actual" | "plan";
  actuals: WeekActuals | undefined;
  projection: PlannedExercise | undefined;
}) {
  const t = useTranslations("WeekEditor.totals");
  const format = useFormatter();
  const values: Record<
    Indicator,
    { actual: number | null; plan: number | null; kg: boolean }
  > = {
    heaviest: {
      actual: actuals?.heaviestKg ?? null,
      plan: projection?.bestKg ?? null,
      kg: true,
    },
    average: {
      actual: actuals?.averageKg ?? null,
      plan: projection?.averageKg ?? null,
      kg: true,
    },
    setSize: {
      actual: actuals?.setSize ?? null,
      plan: projection?.setSize ?? null,
      kg: false,
    },
    reps: {
      actual: actuals?.weeklyReps ?? null,
      plan: projection?.weeklyReps ?? null,
      kg: false,
    },
  };
  return INDICATORS.map((key) => {
    const v = values[key];
    const value = kind === "actual" ? v.actual : v.plan;
    const d = kind === "actual" ? deviation(v.actual, v.plan) : null;
    const text =
      value === null
        ? t("none")
        : v.kg
          ? t("kg", { value: format.number(value) })
          : format.number(value);
    return (
      <td
        key={key}
        data-total={key}
        data-kind={kind}
        data-deviation={kind === "actual" ? (d ?? "none") : undefined}
        className={`${line} px-1 text-right text-xs whitespace-nowrap tabular-nums ${
          kind === "actual" ? "font-semibold" : "text-zinc-500"
        } ${d ? colour[d] : ""}`}
      >
        {text}
        {/* Only the colour shows the deviation; screen readers hear it. */}
        {d === "above" && <span className="sr-only">{t("above")}</span>}
        {d === "below" && <span className="sr-only">{t("below")}</span>}
      </td>
    );
  });
}
