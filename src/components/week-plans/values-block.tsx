"use client";

import { useFormatter, useTranslations } from "next-intl";
import type { PlannedExercise } from "@/domain/macrocycles/calculation";
import {
  deviation,
  type Deviation,
  type WeekActuals,
} from "@/domain/week-plans/calculation";
import { CloseIcon, PlusIcon } from "../icons";
import type { DraftExercise, DraftGroup } from "./week-draft";

type Field = "sets" | "reps" | "weight";

/**
 * Step 2 values of one exercise in a session: its set groups ("sets × reps
 * @ kg"), the coach note, and the week's totals of the exercise next to the
 * projection, with red ↑ / blue ↓ beyond 5 %.
 */
export function ValuesBlock({
  exercise,
  name,
  path,
  errors,
  actuals,
  projection,
  onChangeGroup,
  onAddGroup,
  onRemoveGroup,
  onChangeNote,
}: {
  exercise: DraftExercise;
  /** "1 Snatch". */
  name: string;
  /** Payload path of the exercise, e.g. "sessions.0.exercises.1". */
  path: string;
  errors: Record<string, string[]>;
  actuals: WeekActuals | undefined;
  projection: PlannedExercise | undefined;
  onChangeGroup: (index: number, field: Field, value: string) => void;
  onAddGroup: () => void;
  onRemoveGroup: (index: number) => void;
  onChangeNote: (note: string) => void;
}) {
  const t = useTranslations("WeekEditor.values");
  const te = useTranslations("WeekEditor.errors");
  const message = (code: string) =>
    te.has(code as never) ? te(code as never) : te("INVALID");
  const input =
    "min-h-10 w-full rounded-lg border bg-transparent px-2 text-right tabular-nums aria-invalid:border-red-600 dark:bg-zinc-950";
  const groupErrors = (i: number) =>
    (["sets", "reps", "weightKg"] as const).flatMap(
      (f) => errors[`${path}.setGroups.${i}.${f}`] ?? [],
    );

  return (
    <div
      data-values={exercise.exerciseNumber}
      className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800"
    >
      <p className="font-medium lg:sr-only">{name}</p>
      {exercise.groups.length === 0 && (
        <p className="text-sm text-zinc-500">{t("noGroups")}</p>
      )}
      <ol className="flex flex-col gap-1">
        {exercise.groups.map((g, i) => (
          <GroupRow
            key={g.key}
            group={g}
            index={i}
            name={name}
            input={input}
            errorOf={(field) =>
              (errors[`${path}.setGroups.${i}.${field}`] ?? []).length > 0
            }
            errorText={groupErrors(i).map(message).join(" ")}
            onChange={(field, value) => onChangeGroup(i, field, value)}
            onRemove={() => onRemoveGroup(i)}
          />
        ))}
      </ol>
      <button
        type="button"
        onClick={onAddGroup}
        aria-label={t("addGroupTo", { name })}
        className="inline-flex min-h-9 items-center justify-center gap-2 self-start rounded-full px-3 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
      >
        <PlusIcon />
        {t("addGroup")}
      </button>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{t("note")}</span>
        <textarea
          value={exercise.note}
          onChange={(event) => onChangeNote(event.target.value)}
          rows={2}
          maxLength={500}
          aria-invalid={(errors[`${path}.note`] ?? []).length > 0}
          className="rounded-lg border border-zinc-300 bg-transparent px-2 py-1 aria-invalid:border-red-600 dark:border-zinc-700"
        />
      </label>
      <Totals actuals={actuals} projection={projection} />
    </div>
  );
}

function GroupRow({
  group,
  index,
  name,
  input,
  errorOf,
  errorText,
  onChange,
  onRemove,
}: {
  group: DraftGroup;
  index: number;
  name: string;
  input: string;
  errorOf: (field: "sets" | "reps" | "weightKg") => boolean;
  errorText: string;
  onChange: (field: Field, value: string) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("WeekEditor.values");
  const n = index + 1;
  const border = (invalid: boolean) =>
    invalid ? "border-red-600" : "border-zinc-300 dark:border-zinc-700";
  return (
    <li data-group={n} className="flex flex-col gap-1">
      <div className="flex items-center gap-1 text-sm">
        <input
          inputMode="numeric"
          value={group.sets}
          onChange={(event) => onChange("sets", event.target.value)}
          aria-label={t("setsOf", { n, name })}
          aria-invalid={errorOf("sets")}
          className={`${input} ${border(errorOf("sets"))} max-w-16`}
        />
        <span aria-hidden="true" className="text-zinc-500">
          {t("times")}
        </span>
        <input
          inputMode="numeric"
          value={group.reps}
          onChange={(event) => onChange("reps", event.target.value)}
          aria-label={t("repsOf", { n, name })}
          aria-invalid={errorOf("reps")}
          className={`${input} ${border(errorOf("reps"))} max-w-16`}
        />
        <span aria-hidden="true" className="text-zinc-500">
          {t("at")}
        </span>
        <input
          inputMode="decimal"
          value={group.weight}
          onChange={(event) => onChange("weight", event.target.value)}
          aria-label={t("weightOf", { n, name })}
          aria-invalid={errorOf("weightKg")}
          className={`${input} ${border(errorOf("weightKg"))} max-w-24`}
        />
        <span className="text-zinc-500">{t("kg")}</span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("removeGroup", { n, name })}
          className="ml-auto inline-flex size-9 shrink-0 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          <CloseIcon />
        </button>
      </div>
      {errorText && (
        <p className="text-xs text-red-700 dark:text-red-400">{errorText}</p>
      )}
    </li>
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
  const rows: {
    key: string;
    actual: number | null;
    projected: number | null;
    text: (v: number) => string;
  }[] = [
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
      text: (v) => format.number(v),
    },
    {
      key: "reps",
      actual: actuals?.weeklyReps ?? null,
      projected: projection?.weeklyReps ?? null,
      text: (v) => format.number(v),
    },
  ];
  return (
    <div className="border-t border-zinc-200 pt-2 dark:border-zinc-800">
      <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {t("title")}
      </p>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        {rows.map((row) => {
          const d = deviation(row.actual, row.projected);
          return (
            <div
              key={row.key}
              data-total={row.key}
              data-deviation={d ?? "none"}
            >
              <dt className="text-xs text-zinc-500">
                {t(row.key as "heaviest")}
              </dt>
              <dd className={`tabular-nums ${d ? colour[d] : ""}`}>
                <span className="font-semibold">
                  {row.actual === null ? t("none") : row.text(row.actual)}
                </span>
                {d === "above" && (
                  <span aria-label={t("above")} className="ml-1">
                    ↑
                  </span>
                )}
                {d === "below" && (
                  <span aria-label={t("below")} className="ml-1">
                    ↓
                  </span>
                )}
                {row.projected !== null && (
                  <span className="ml-1 text-xs text-zinc-500">
                    {t("projected", { value: row.text(row.projected) })}
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
