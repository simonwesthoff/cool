"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import {
  localized,
  type ExerciseGroup,
} from "@/domain/exercises/catalog-types";
import type {
  Macrocycle,
  MesocycleExercise,
  MesocycleType,
} from "@/domain/macrocycles/macrocycle-types";
import {
  ExerciseChoiceDialog,
  type ChoiceInput,
  type ChoiceTarget,
} from "./exercise-choice-dialog";

type Props = { macrocycle: Macrocycle; catalog: ExerciseGroup[] };
type Choices = Record<MesocycleType, MesocycleExercise[]>;

/** All deficits, shown above the table. */
const DEFICITS = [
  "snatchDeficits",
  "cleanDeficits",
  "jerkDeficits",
  "otherDeficits",
] as const;

/** Same colours as the mesocycle bands of the chart. */
const SWATCH = ["var(--band-1)", "var(--band-2)", "var(--band-3)"];

const choicesOf = (macrocycle: Pick<Macrocycle, "mesocycles">): Choices =>
  Object.fromEntries(
    macrocycle.mesocycles.map((m) => [m.type, m.exercises]),
  ) as Choices;

/**
 * Planning step 3: one table of the catalog with a column per mesocycle.
 * Each cell opens a dialog to choose the exercise with a reason and a
 * variation; every change is saved.
 */
export function ExerciseSelection({ macrocycle, catalog }: Props) {
  const t = useTranslations("Macrocycle.exercises");
  const tm = useTranslations("Macrocycle.mesocycles");
  const tf = useTranslations("Macrocycle.baseData.fields");
  const locale = useLocale();
  const [choices, setChoices] = useState<Choices>(() => choicesOf(macrocycle));
  const [target, setTarget] = useState<ChoiceTarget | null>(null);
  const base = `/athletes/${macrocycle.athleteId}`;
  const api = (cell: ChoiceTarget) =>
    `/api/athletes/${macrocycle.athleteId}/macrocycle/mesocycles/${cell.type}/exercises/${cell.exercise.number}`;

  async function save(input: ChoiceInput) {
    if (!target) return false;
    const response = await fetch(api(target), {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }).catch(() => null);
    if (!response?.ok) return false;
    setChoices(choicesOf((await response.json()) as Macrocycle));
    return true;
  }

  async function remove() {
    if (!target) return false;
    const cell = target;
    const response = await fetch(api(cell), { method: "DELETE" }).catch(
      () => null,
    );
    if (!response?.ok) return false;
    setChoices((current) => ({
      ...current,
      [cell.type]: current[cell.type].filter(
        (c) => c.exerciseNumber !== cell.exercise.number,
      ),
    }));
    return true;
  }

  return (
    <div className="flex flex-col gap-6">
      <dl
        aria-label={t("deficitsLabel")}
        className="grid grid-cols-1 gap-3 rounded-xl bg-zinc-100 p-3 text-sm sm:grid-cols-2 dark:bg-zinc-900"
      >
        {DEFICITS.map((key) => (
          <div key={key} data-deficit={key} className="flex flex-col gap-0.5">
            <dt className="font-semibold">{tf(key)}</dt>
            <dd
              className={
                macrocycle[key] ? "whitespace-pre-line" : "text-zinc-500 italic"
              }
            >
              {macrocycle[key] || t("notEntered")}
            </dd>
          </div>
        ))}
      </dl>
      <table className="w-full table-fixed border-collapse text-left">
        <caption className="sr-only">{t("tableCaption")}</caption>
        <colgroup>
          <col />
          <col className="w-16 sm:w-36" />
          <col className="w-16 sm:w-36" />
          <col className="w-16 sm:w-36" />
        </colgroup>
        <thead>
          <tr className="border-b border-zinc-300 align-bottom dark:border-zinc-700">
            <th scope="col" className="py-2 pr-2 text-sm font-semibold">
              {t("exercise")}
            </th>
            {macrocycle.mesocycles.map((m, i) => (
              <th
                key={m.type}
                scope="col"
                abbr={tm(m.type)}
                className="px-1 py-2 text-center text-sm font-semibold"
              >
                <span className="flex flex-col items-center gap-1">
                  <span
                    aria-hidden="true"
                    className="inline-block h-1.5 w-8 rounded-full"
                    style={{ background: SWATCH[i] }}
                  />
                  <span title={tm(m.type)}>{tm(`abbr.${m.type}`)}</span>
                  <span className="text-[11px] font-normal whitespace-nowrap text-zinc-500 tabular-nums">
                    {t("weeksShort", { first: m.firstWeek, last: m.lastWeek })}
                  </span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        {catalog.map((group) => (
          <tbody key={group.number}>
            <tr>
              <th
                scope="colgroup"
                colSpan={4}
                className="pt-5 pb-1 text-sm font-semibold text-zinc-600 dark:text-zinc-400"
              >
                {group.code}
                {" · "}
                {localized(group.name, locale)}
              </th>
            </tr>
            {group.exercises.map((exercise) => {
              const name = localized(exercise.name, locale);
              return (
                <tr
                  key={exercise.number}
                  className="border-t border-zinc-200 dark:border-zinc-800"
                >
                  <th scope="row" className="py-1 pr-2 font-normal">
                    <span className="flex items-baseline gap-2">
                      <span className="w-6 shrink-0 text-sm text-zinc-500 tabular-nums">
                        {exercise.number}
                      </span>
                      <span className="min-w-0 break-words">{name}</span>
                    </span>
                  </th>
                  {macrocycle.mesocycles.map((m) => {
                    const choice =
                      choices[m.type].find(
                        (c) => c.exerciseNumber === exercise.number,
                      ) ?? null;
                    return (
                      <td key={m.type} className="p-0.5 text-center">
                        <ChoiceCell
                          choice={choice}
                          label={
                            choice
                              ? t("cellChosen", {
                                  exercise: name,
                                  block: tm(m.type),
                                  variation: choice.variation ?? t("standard"),
                                })
                              : t("cellChoose", {
                                  exercise: name,
                                  block: tm(m.type),
                                })
                          }
                          onOpen={() =>
                            setTarget({ exercise, type: m.type, choice })
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        ))}
        <tfoot>
          <tr className="border-t-2 border-zinc-300 dark:border-zinc-700">
            <th scope="row" className="py-3 pr-2 text-sm font-semibold">
              {t("total")}
            </th>
            {macrocycle.mesocycles.map((m) => (
              <td
                key={m.type}
                data-total={m.type}
                className="py-3 text-center font-semibold tabular-nums"
              >
                {choices[m.type].length}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
      <ExerciseChoiceDialog
        target={target}
        deficits={macrocycle}
        onSave={save}
        onRemove={remove}
        onClose={() => setTarget(null)}
      />
      <div className="flex flex-wrap gap-3">
        <Link
          href={base}
          className="inline-flex min-h-11 items-center rounded-full bg-zinc-900 px-6 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {t("finish")}
        </Link>
        <Link
          href={`${base}/macrocycle/intensity`}
          className="inline-flex min-h-11 items-center rounded-full px-4 font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          {t("back")}
        </Link>
      </div>
    </div>
  );
}

/** One table cell: "+" when free, a check mark and the variation when chosen. */
function ChoiceCell({
  choice,
  label,
  onOpen,
}: {
  choice: MesocycleExercise | null;
  label: string;
  onOpen: () => void;
}) {
  const t = useTranslations("Macrocycle.exercises");
  const missingReason =
    choice !== null && choice.tags.length === 0 && !choice.note;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={missingReason ? `${label}, ${t("reasonMissing")}` : label}
      className="flex min-h-11 w-full flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-900"
    >
      {choice ? (
        <>
          <span
            aria-hidden="true"
            className={`inline-flex size-6 items-center justify-center rounded-full ${
              missingReason
                ? "border-2 border-dashed border-zinc-500"
                : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            }`}
          >
            <CheckIcon />
          </span>
          {/* Text only for a variation or a missing reason. */}
          {(missingReason || choice.variation) && (
            <span className="hidden w-full truncate text-xs text-zinc-600 sm:block dark:text-zinc-400">
              {missingReason ? t("reasonMissing") : choice.variation}
            </span>
          )}
        </>
      ) : (
        <span aria-hidden="true" className="text-zinc-400 dark:text-zinc-600">
          <PlusIcon />
        </span>
      )}
    </button>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8.5 6.5 12 13 4.5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}
