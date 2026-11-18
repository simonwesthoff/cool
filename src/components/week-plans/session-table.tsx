"use client";

import { useFormatter, useTranslations } from "next-intl";
import type { PlannedExercise } from "@/domain/macrocycles/calculation";
import {
  deviation,
  type Deviation,
  type WeekActuals,
} from "@/domain/week-plans/calculation";
import { MinusIcon, PlusIcon } from "../icons";
import {
  MAX_SETS,
  setErrors,
  type DraftExercise,
  type DraftSession,
} from "./week-draft";

/**
 * A session in step 2 as a table: each exercise two rows high (weight on
 * top, reps below), one column per set (at most 10), and on the right the
 * coach note and the week's totals against the projection.
 */
export function SessionTable({
  session,
  label,
  exerciseName,
  actualsOf,
  projectionOf,
  onChangeSet,
  onAddSet,
  onRemoveSet,
  onChangeNote,
}: {
  session: DraftSession;
  /** "Monday" or "Monday 1". */
  label: string;
  exerciseName: (exerciseNumber: number) => string;
  actualsOf: (exerciseNumber: number) => WeekActuals | undefined;
  projectionOf: (exerciseNumber: number) => PlannedExercise | undefined;
  onChangeSet: (
    exerciseKey: string,
    index: number,
    field: "weight" | "reps",
    value: string,
  ) => void;
  onAddSet: (exerciseKey: string) => void;
  onRemoveSet: (exerciseKey: string) => void;
  onChangeNote: (exerciseKey: string, note: string) => void;
}) {
  const t = useTranslations("WeekEditor.values");
  // Columns for the sets: the most sets of an exercise, plus one for "+".
  const columns = Math.min(
    MAX_SETS,
    Math.max(1, ...session.exercises.map((e) => e.sets.length)),
  );

  return (
    <section
      aria-label={label}
      data-session={`${session.weekday}.${session.slot}`}
      className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800"
    >
      <h3 className="font-semibold">{label}</h3>
      {session.exercises.length === 0 ? (
        <p className="text-sm text-zinc-500">{t("noExercises")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-x-1 border-spacing-y-0 text-sm">
            <tbody>
              {session.exercises.map((e) => (
                <ExerciseRows
                  key={e.key}
                  exercise={e}
                  name={exerciseName(e.exerciseNumber)}
                  columns={columns}
                  actuals={actualsOf(e.exerciseNumber)}
                  projection={projectionOf(e.exerciseNumber)}
                  onChangeSet={(i, field, value) =>
                    onChangeSet(e.key, i, field, value)
                  }
                  onAddSet={() => onAddSet(e.key)}
                  onRemoveSet={() => onRemoveSet(e.key)}
                  onChangeNote={(note) => onChangeNote(e.key, note)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ExerciseRows({
  exercise,
  name,
  columns,
  actuals,
  projection,
  onChangeSet,
  onAddSet,
  onRemoveSet,
  onChangeNote,
}: {
  exercise: DraftExercise;
  name: string;
  columns: number;
  actuals: WeekActuals | undefined;
  projection: PlannedExercise | undefined;
  onChangeSet: (index: number, field: "weight" | "reps", value: string) => void;
  onAddSet: () => void;
  onRemoveSet: () => void;
  onChangeNote: (note: string) => void;
}) {
  const t = useTranslations("WeekEditor.values");
  const cell =
    "h-9 w-12 rounded-md border bg-transparent px-1.5 text-right tabular-nums aria-invalid:border-red-600 dark:bg-zinc-950";
  const border = (invalid: boolean) =>
    invalid ? "border-red-600" : "border-zinc-300 dark:border-zinc-700";
  const extra = (
    <ExerciseSide
      name={name}
      note={exercise.note}
      onChangeNote={onChangeNote}
      actuals={actuals}
      projection={projection}
    />
  );
  const row = (field: "weight" | "reps") => (
    <>
      <th
        scope="row"
        className={`w-10 pr-1 text-right text-xs font-normal text-zinc-500 ${field === "weight" ? "pt-3" : "pt-1"}`}
      >
        {field === "weight" ? t("kg") : t("reps")}
      </th>
      {Array.from({ length: columns }, (_, i) => {
        const set = exercise.sets[i];
        if (!set) return <td key={i} />;
        const invalid = setErrors(set).includes(field);
        return (
          <td key={set.key} className={field === "weight" ? "pt-3" : "pt-1"}>
            <input
              inputMode={field === "weight" ? "decimal" : "numeric"}
              value={set[field]}
              onChange={(event) => onChangeSet(i, field, event.target.value)}
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
  const icon =
    "inline-flex size-8 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-900";

  return (
    <>
      <tr data-exercise={exercise.exerciseNumber} data-row="weight">
        <th
          scope="rowgroup"
          rowSpan={2}
          className="min-w-32 pt-3 pr-2 text-left align-middle font-medium"
        >
          {name}
        </th>
        {row("weight")}
        <td rowSpan={2} className="w-16 align-middle">
          <div className="flex flex-col items-center">
            <button
              type="button"
              disabled={exercise.sets.length >= MAX_SETS}
              onClick={onAddSet}
              aria-label={t("addSetTo", { name })}
              className={icon}
            >
              <PlusIcon />
            </button>
            <button
              type="button"
              disabled={exercise.sets.length === 0}
              onClick={onRemoveSet}
              aria-label={t("removeSetOf", { name })}
              className={icon}
            >
              <MinusIcon />
            </button>
          </div>
        </td>
        {/* Free space after the sets, so short exercises stay compact. */}
        <td rowSpan={2} aria-hidden="true" className="w-full" />
        {/* Note and totals on the right on wide screens. */}
        <td
          rowSpan={2}
          className="hidden w-72 min-w-72 pt-3 pl-2 align-top lg:table-cell"
        >
          {extra}
        </td>
      </tr>
      <tr data-row="reps">{row("reps")}</tr>
      {/* On phones below the sets. */}
      <tr className="lg:hidden">
        <td colSpan={columns + 4} className="pb-2">
          {/* Stays in view while the sets scroll sideways. */}
          <div className="sticky left-0 w-[calc(100vw-4rem)] max-w-full">
            {extra}
          </div>
        </td>
      </tr>
    </>
  );
}

function ExerciseSide({
  name,
  note,
  onChangeNote,
  actuals,
  projection,
}: {
  name: string;
  note: string;
  onChangeNote: (note: string) => void;
  actuals: WeekActuals | undefined;
  projection: PlannedExercise | undefined;
}) {
  const t = useTranslations("WeekEditor.values");
  return (
    <div data-values className="flex flex-col gap-1">
      <input
        value={note}
        onChange={(event) => onChangeNote(event.target.value)}
        maxLength={500}
        aria-label={t("noteOf", { name })}
        placeholder={t("note")}
        className="h-9 rounded-md border border-zinc-300 bg-transparent px-2 dark:border-zinc-700"
      />
      <Totals actuals={actuals} projection={projection} />
    </div>
  );
}

const colour: Record<Deviation, string> = {
  above: "text-red-700 dark:text-red-400",
  below: "text-blue-700 dark:text-blue-400",
  within: "",
};

/** The week's totals of the exercise against the projection. */
function Totals({
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
    <dl
      aria-label={t("title")}
      className="grid grid-cols-[auto_1fr] gap-x-2 text-xs"
    >
      {rows.map((row) => {
        const d = deviation(row.actual, row.projected);
        return (
          <div
            key={row.key}
            data-total={row.key}
            data-deviation={d ?? "none"}
            className="col-span-2 grid grid-cols-subgrid items-baseline whitespace-nowrap"
          >
            <dt className="text-zinc-500">{t(row.key)}</dt>
            <dd className={`tabular-nums ${d ? colour[d] : ""}`}>
              <span className="font-semibold">
                {row.actual === null ? t("none") : row.text(row.actual)}
              </span>
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
              {row.projected !== null && (
                <span className="ml-1 text-zinc-500">
                  {t("projected", { value: row.text(row.projected) })}
                </span>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
