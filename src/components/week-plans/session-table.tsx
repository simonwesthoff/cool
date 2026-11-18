"use client";

import { useFormatter, useTranslations } from "next-intl";
import type { PlannedExercise } from "@/domain/macrocycles/calculation";
import {
  deviation,
  type Deviation,
  type WeekActuals,
} from "@/domain/week-plans/calculation";
import { usesFreeText } from "@/domain/week-plans/week-plan-types";
import { MinusIcon, PlusIcon } from "../icons";
import {
  MAX_SETS,
  setErrors,
  type DraftExercise,
  type DraftSession,
} from "./week-draft";

/** Fixed widths, so "Actual" and "Plan" line up over every exercise. */
const INDICATOR_GRID = "grid grid-cols-[4.5rem_4rem_3.5rem] gap-x-1";

type Handlers = {
  onChangeSet: (
    exerciseKey: string,
    index: number,
    field: "weight" | "reps",
    value: string,
  ) => void;
  onAddSet: (exerciseKey: string) => void;
  onRemoveSet: (exerciseKey: string) => void;
  onChangeNote: (exerciseKey: string, note: string) => void;
  onChangeFreeText: (exerciseKey: string, text: string) => void;
};

/**
 * A session in step 2 as a table: each exercise two rows high (weight on
 * top, reps below) with one column per set (at most 10), separated by
 * lines; exercises from 30 on get a free text instead. On the right the
 * coach note and, for exercises with values, the week's actual values
 * next to the plan.
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
  const withSets = session.exercises.filter(
    (e) => !usesFreeText(e.exerciseNumber),
  );
  // Columns for the sets: the most sets of an exercise.
  const columns = Math.min(
    MAX_SETS,
    Math.max(1, ...withSets.map((e) => e.sets.length)),
  );
  // Name, label, sets, +/−, free space, note, indicators.
  const span = columns + 6;

  return (
    <section
      aria-label={label}
      data-session={`${session.weekday}.${session.slot}`}
      className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800"
    >
      {session.exercises.length === 0 ? (
        <>
          <h3 className="font-semibold">{label}</h3>
          <p className="text-sm text-zinc-500">{t("noExercises")}</p>
        </>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th
                  colSpan={columns + 5}
                  scope="colgroup"
                  className="pb-1 text-left text-base font-semibold"
                >
                  <h3>{label}</h3>
                </th>
                <th className="hidden pb-1 align-bottom lg:table-cell">
                  {withSets.length > 0 && <IndicatorHeader />}
                </th>
              </tr>
            </thead>
            {session.exercises.map((e) => (
              <ExerciseRows
                key={e.key}
                exercise={e}
                name={exerciseName(e.exerciseNumber)}
                columns={columns}
                span={span}
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

function IndicatorHeader() {
  const t = useTranslations("WeekEditor.totals");
  return (
    <div
      className={`${INDICATOR_GRID} text-left text-xs font-semibold text-zinc-600 dark:text-zinc-400`}
    >
      <span />
      <span data-heading="actual">{t("actual")}</span>
      <span data-heading="plan">{t("plan")}</span>
    </div>
  );
}

function ExerciseRows({
  exercise,
  name,
  columns,
  span,
  actuals,
  projection,
  handlers,
}: {
  exercise: DraftExercise;
  name: string;
  columns: number;
  span: number;
  actuals: WeekActuals | undefined;
  projection: PlannedExercise | undefined;
  handlers: Handlers;
}) {
  const t = useTranslations("WeekEditor.values");
  const free = usesFreeText(exercise.exerciseNumber);
  const note = (
    <input
      value={exercise.note}
      onChange={(event) =>
        handlers.onChangeNote(exercise.key, event.target.value)
      }
      maxLength={500}
      aria-label={t("noteOf", { name })}
      placeholder={t("note")}
      className="h-9 w-full rounded-md border border-zinc-300 bg-transparent px-2 dark:border-zinc-700"
    />
  );
  const indicators = free ? null : (
    <Indicators actuals={actuals} projection={projection} />
  );
  const cell =
    "h-9 w-12 rounded-md border bg-transparent px-1.5 text-right tabular-nums dark:bg-zinc-950";
  const border = (invalid: boolean) =>
    invalid ? "border-red-600" : "border-zinc-300 dark:border-zinc-700";
  const icon =
    "inline-flex size-8 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-900";
  const nameCell = (rows: number) => (
    <th
      scope="rowgroup"
      rowSpan={rows}
      className="min-w-32 py-2 pr-2 text-left align-middle font-medium"
    >
      {name}
    </th>
  );
  const side = (rows: number) => (
    <>
      <td
        rowSpan={rows}
        className="hidden w-44 min-w-44 py-2 pl-2 align-middle lg:table-cell"
      >
        {note}
      </td>
      <td
        rowSpan={rows}
        className="hidden py-2 pl-2 align-middle lg:table-cell"
      >
        {indicators}
      </td>
    </>
  );
  const row = (field: "weight" | "reps") => (
    <>
      <th
        scope="row"
        className={`w-10 pr-1 text-right text-xs font-normal text-zinc-500 ${field === "weight" ? "pt-2" : "pb-2"}`}
      >
        {field === "weight" ? t("kg") : t("reps")}
      </th>
      {Array.from({ length: columns }, (_, i) => {
        const set = exercise.sets[i];
        if (!set) return <td key={i} />;
        const invalid = setErrors(set).includes(field);
        return (
          <td
            key={set.key}
            className={`px-0.5 ${field === "weight" ? "pt-2" : "pt-1 pb-2"}`}
          >
            <input
              inputMode={field === "weight" ? "decimal" : "numeric"}
              value={set[field]}
              onChange={(event) =>
                handlers.onChangeSet(exercise.key, i, field, event.target.value)
              }
              aria-label={t(field === "weight" ? "weightOf" : "repsOf", {
                n: i + 1,
                name,
              })}
              aria-invalid={invalid}
              className={`${cell} ${border(invalid)}`}
            />
          </td>
        );
      })}
    </>
  );
  // Note and indicators below the sets on phones.
  const phoneRow = (
    <tr className="lg:hidden">
      <td colSpan={span} className="pb-2">
        <div className="sticky left-0 flex w-[calc(100vw-4rem)] max-w-full flex-col gap-1">
          {note}
          {indicators && (
            <>
              <IndicatorHeader />
              {indicators}
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <tbody
      data-exercise={exercise.exerciseNumber}
      className="border-t border-zinc-200 dark:border-zinc-800"
    >
      {free ? (
        <tr data-row="free-text">
          {nameCell(1)}
          <td colSpan={columns + 2} className="py-2">
            <input
              value={exercise.freeText}
              onChange={(event) =>
                handlers.onChangeFreeText(exercise.key, event.target.value)
              }
              maxLength={500}
              aria-label={t("freeTextOf", { name })}
              placeholder={t("freeText")}
              className="h-9 w-full min-w-48 rounded-md border border-zinc-300 bg-transparent px-2 dark:border-zinc-700"
            />
          </td>
          <td aria-hidden="true" className="w-full" />
          {side(1)}
        </tr>
      ) : (
        <>
          <tr data-row="weight">
            {nameCell(2)}
            {row("weight")}
            <td rowSpan={2} className="w-10 align-middle">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  disabled={exercise.sets.length >= MAX_SETS}
                  onClick={() => handlers.onAddSet(exercise.key)}
                  aria-label={t("addSetTo", { name })}
                  className={icon}
                >
                  <PlusIcon />
                </button>
                <button
                  type="button"
                  disabled={exercise.sets.length === 0}
                  onClick={() => handlers.onRemoveSet(exercise.key)}
                  aria-label={t("removeSetOf", { name })}
                  className={icon}
                >
                  <MinusIcon />
                </button>
              </div>
            </td>
            {/* Free space after the sets, so short exercises stay compact. */}
            <td rowSpan={2} aria-hidden="true" className="w-full" />
            {side(2)}
          </tr>
          <tr data-row="reps">{row("reps")}</tr>
        </>
      )}
      {phoneRow}
    </tbody>
  );
}

const colour: Record<Deviation, string> = {
  above: "text-red-700 dark:text-red-400",
  below: "text-blue-700 dark:text-blue-400",
  within: "",
};

/** The week's actual values of the exercise next to the plan. */
function Indicators({
  actuals,
  projection,
}: {
  actuals: WeekActuals | undefined;
  projection: PlannedExercise | undefined;
}) {
  const t = useTranslations("WeekEditor.totals");
  const format = useFormatter();
  const kg = (v: number) => t("kg", { value: format.number(v) });
  const rows = [
    {
      key: "heaviest",
      actual: actuals?.heaviestKg ?? null,
      projected: projection?.bestKg ?? null,
      text: kg,
    },
    {
      key: "average",
      actual: actuals?.averageKg ?? null,
      projected: projection?.averageKg ?? null,
      text: kg,
    },
    {
      key: "setSize",
      actual: actuals?.setSize ?? null,
      projected: projection?.setSize ?? null,
      text: (v: number) => format.number(v),
    },
    {
      key: "reps",
      actual: actuals?.weeklyReps ?? null,
      projected: projection?.weeklyReps ?? null,
      text: (v: number) => format.number(v),
    },
  ] as const;
  return (
    <dl aria-label={t("title")} className="flex flex-col text-xs">
      {rows.map((row) => {
        const d = deviation(row.actual, row.projected);
        return (
          <div
            key={row.key}
            data-total={row.key}
            data-deviation={d ?? "none"}
            className={`${INDICATOR_GRID} items-baseline whitespace-nowrap`}
          >
            <dt className="text-zinc-500">{t(row.key)}</dt>
            <dd
              data-actual
              className={`font-semibold tabular-nums ${d ? colour[d] : ""}`}
            >
              {row.actual === null ? t("none") : row.text(row.actual)}
              {d === "above" && (
                <span aria-label={t("above")} className="ml-0.5">
                  ↑
                </span>
              )}
              {d === "below" && (
                <span aria-label={t("below")} className="ml-0.5">
                  ↓
                </span>
              )}
            </dd>
            <dd data-plan className="text-zinc-500 tabular-nums">
              {row.projected === null ? t("none") : row.text(row.projected)}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
