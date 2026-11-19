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
  EDITOR_TABLE_WIDTH,
  EDITOR_WIDTH,
  exerciseDivider,
  fill,
  line,
  SETS,
} from "./table-layout";
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

const WIDTH = EDITOR_WIDTH;
const TABLE_WIDTH = EDITOR_TABLE_WIDTH;

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
        <div className="overflow-x-auto overflow-y-hidden pr-px">
          <table
            className="table-fixed border-collapse text-sm"
            style={{ width: `${TABLE_WIDTH}rem` }}
          >
            <colgroup>
              <col style={{ width: `${WIDTH.exercise}rem` }} />
              <col style={{ width: `${WIDTH.rowLabel}rem` }} />
              {SETS.map((i) => (
                <col key={i} style={{ width: `${WIDTH.set}rem` }} />
              ))}
              <col style={{ width: `${WIDTH.note}rem` }} />
              <col style={{ width: `${WIDTH.valueLabel}rem` }} />
              {INDICATORS.map((key) => (
                <col
                  key={key}
                  data-col={key}
                  style={{ width: `${WIDTH.indicator}rem` }}
                />
              ))}
            </colgroup>
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900">
                <th
                  scope="col"
                  className={`${line} ${head} sticky left-0 z-[1] bg-zinc-50 text-left dark:bg-zinc-900`}
                >
                  {t("exercise")}
                </th>
                <th scope="col" className={line}>
                  <span className="sr-only">{t("row")}</span>
                </th>
                {SETS.map((i) => (
                  <th
                    key={i}
                    scope="col"
                    className={`${line} ${head} text-right`}
                  >
                    {i + 1}
                  </th>
                ))}
                <th scope="col" className={`${line} ${head} text-left`}>
                  {t("note")}
                </th>
                <th scope="col" className={line}>
                  <span className="sr-only">{tt("row")}</span>
                </th>
                {INDICATORS.map((key) => (
                  <th
                    key={key}
                    scope="col"
                    data-heading={key}
                    className={`${line} ${head} text-right break-words`}
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
    <tbody data-exercise={exercise.exerciseNumber} className={exerciseDivider}>
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
        <td rowSpan={2} className={`${line} p-0 align-top`}>
          <textarea
            value={exercise.note}
            onChange={(event) =>
              handlers.onChangeNote(exercise.key, event.target.value)
            }
            rows={exercise.feedback ? 1 : 2}
            maxLength={500}
            aria-label={t("noteOf", { name })}
            className={`${fill} ${exercise.feedback ? "h-8" : "h-16"} resize-none py-1`}
          />
          {exercise.feedback && (
            // The athlete's feedback, read-only for the coach.
            <p
              data-feedback
              title={exercise.feedback}
              className="truncate border-t border-zinc-200 px-1 py-1 text-xs text-zinc-600 italic dark:border-zinc-800 dark:text-zinc-400"
            >
              {t("feedback", { text: exercise.feedback })}
            </p>
          )}
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
