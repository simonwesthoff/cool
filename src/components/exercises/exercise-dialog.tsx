"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, type ReactNode } from "react";
import {
  localized,
  type Exercise,
  type ExerciseGroup,
} from "@/domain/exercises/catalog-types";
import { formatRange } from "./format";

type Props = {
  /** The exercise to show; null closes the dialog. */
  exercise: Exercise | null;
  group: Omit<ExerciseGroup, "exercises"> | null;
  onClose: () => void;
};

/** Modal dialog with all information about one exercise of the catalog. */
export function ExerciseDialog({ exercise, group, onClose }: Props) {
  const t = useTranslations("Catalog");
  const format = useFormatter();
  const locale = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (exercise && !el.open) el.showModal();
    if (!exercise && el.open) el.close();
  }, [exercise]);

  const percent = (value: number | null) =>
    value === null
      ? null
      : format.number(value / 100, {
          style: "percent",
          maximumFractionDigits: 1,
        });

  const items: [string, ReactNode | null][] =
    exercise && group
      ? [
          [t("group"), `${group.code} · ${localized(group.name, locale)}`],
          [
            t("referenceLift"),
            exercise.referenceLift
              ? t(`lifts.${exercise.referenceLift}`)
              : null,
          ],
          [t("bestValueLong"), percent(exercise.bestValuePct)],
          [
            t("maxWeeklyAverageWeight"),
            percent(exercise.maxWeeklyAverageWeightPct),
          ],
          [t("repsPerSet"), formatRange(exercise.repsPerSet)],
          [t("repsPerWeek"), formatRange(exercise.repsPerWeek)],
          [
            t("comment"),
            exercise.comment ? localized(exercise.comment, locale) : null,
          ],
        ]
      : [];

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      // Escape and the close button both end up here.
      onClose={onClose}
      // A click on the backdrop targets the dialog element itself.
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-zinc-200 bg-white p-0 text-zinc-900 backdrop:bg-black/60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
    >
      {exercise && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800">
            <h2
              id={titleId}
              className="flex items-baseline gap-3 text-xl font-semibold"
            >
              <span className="text-base font-normal text-zinc-500 tabular-nums">
                {exercise.number}
              </span>
              <span className="break-words">
                {localized(exercise.name, locale)}
              </span>
            </h2>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label={t("close")}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-2xl hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <dl className="divide-y divide-zinc-200 overflow-y-auto px-4 dark:divide-zinc-800">
            {items.map(([label, value]) => (
              <div key={label} className="flex flex-col gap-1 py-3">
                <dt className="text-sm text-zinc-600 dark:text-zinc-400">
                  {label}
                </dt>
                <dd className={value === null ? "text-zinc-500 italic" : ""}>
                  {value ?? t("notDefined")}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </dialog>
  );
}
