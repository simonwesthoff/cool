"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  localized,
  type LocalizedText,
} from "@/domain/exercises/catalog-types";

export type CatalogGroup = {
  code: string;
  name: LocalizedText;
  exercises: { number: number; name: LocalizedText }[];
};

/** Empty circle: chosen for the mesocycle, not in the week yet. */
function OpenIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeDasharray="2.5 2"
    >
      <circle cx="8" cy="8" r="6" />
    </svg>
  );
}

/** Filled circle with a check: chosen for the mesocycle and in the week. */
function DoneIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0">
      <circle cx="8" cy="8" r="7" className="fill-current" />
      <path
        d="m5 8.2 2 2 4-4.4"
        fill="none"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-white dark:stroke-zinc-950"
      />
    </svg>
  );
}

/**
 * The exercises of the week's mesocycle, each with whether it is in the
 * week yet. "Show all exercises" adds the rest of the catalog, greyed out
 * but still selectable. Rows are drag sources (desktop catalog column) or
 * buttons (selection dialog).
 */
export function ExerciseList({
  catalog,
  chosen,
  onWeek,
  blockName,
  onPick,
  disabled = [],
  draggable = false,
}: {
  catalog: CatalogGroup[];
  /** Exercises chosen for the week's mesocycle. */
  chosen: number[];
  /** Exercises that are in the week. */
  onWeek: number[];
  /** Name of the week's mesocycle. */
  blockName: string;
  /** Picking by click (selection dialog); without it rows are drag sources. */
  onPick?: (exerciseNumber: number) => void;
  /** Exercises that cannot be picked (already in the session). */
  disabled?: number[];
  draggable?: boolean;
}) {
  const t = useTranslations("WeekEditor.catalog");
  const locale = useLocale();
  const [showAll, setShowAll] = useState(false);
  const groups = catalog
    .map((g) => ({
      ...g,
      exercises: showAll
        ? g.exercises
        : g.exercises.filter((e) => chosen.includes(e.number)),
    }))
    .filter((g) => g.exercises.length > 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {draggable && (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          {t("dragHint")}
        </p>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {groups.length === 0 && (
          <p className="py-2 text-sm text-zinc-600 dark:text-zinc-400">
            {t("emptyBlock", { block: blockName })}
          </p>
        )}
        {groups.map((group) => (
          <section key={group.code} className="mb-3">
            <h3 className="sticky top-0 z-[3] bg-white py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
              {t("group", {
                code: group.code,
                name: localized(group.name, locale),
              })}
            </h3>
            <ul className="flex flex-col">
              {group.exercises.map((e) => {
                const inBlock = chosen.includes(e.number);
                const inWeek = onWeek.includes(e.number);
                const off = disabled.includes(e.number);
                const name = `${e.number} ${localized(e.name, locale)}`;
                const row = `flex min-h-10 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900 ${
                  inBlock ? "" : "text-zinc-400 dark:text-zinc-500"
                }`;
                const content = (
                  <>
                    <span className="min-w-0 flex-1 truncate">{name}</span>
                    {inBlock ? (
                      <span
                        data-in-week={inWeek || undefined}
                        className="text-zinc-700 dark:text-zinc-300"
                      >
                        {inWeek ? <DoneIcon /> : <OpenIcon />}
                        <span className="sr-only">
                          {inWeek ? t("inWeek") : t("notInWeek")}
                        </span>
                      </span>
                    ) : (
                      <span className="sr-only">
                        {t("notInBlock", { block: blockName })}
                      </span>
                    )}
                  </>
                );
                return (
                  <li key={e.number}>
                    {draggable || !onPick ? (
                      // Drag source for the sessions; keyboards use "+ Exercise".
                      <div
                        data-exercise={e.number}
                        data-in-block={inBlock || undefined}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData(
                            "text/plain",
                            String(e.number),
                          );
                          event.dataTransfer.effectAllowed = "copy";
                        }}
                        className={`${row} cursor-grab active:cursor-grabbing`}
                      >
                        {content}
                      </div>
                    ) : (
                      <button
                        type="button"
                        data-exercise={e.number}
                        data-in-block={inBlock || undefined}
                        disabled={off}
                        onClick={() => onPick(e.number)}
                        className={`${row} disabled:opacity-40`}
                      >
                        {content}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
          className="mt-1 inline-flex min-h-10 w-full items-center justify-center rounded-full border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          {showAll ? t("showBlock", { block: blockName }) : t("showAll")}
        </button>
      </div>
    </div>
  );
}

/** The exercise selection for one session, as a dialog (bottom sheet on phones). */
export function ExercisePicker({
  open,
  title,
  onClose,
  ...list
}: {
  open: boolean;
  title: string;
  onClose: () => void;
} & Omit<Parameters<typeof ExerciseList>[0], "draggable">) {
  const t = useTranslations("WeekEditor.catalog");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      aria-labelledby="exercise-picker-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
      className="mx-auto mt-auto mb-0 max-h-[85vh] w-full max-w-lg rounded-t-2xl border border-zinc-200 bg-white p-4 text-zinc-900 backdrop:bg-black/60 sm:m-auto sm:max-h-[80vh] sm:rounded-2xl dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
    >
      {open && (
        <div className="flex max-h-[calc(85vh-2rem)] flex-col gap-3 sm:max-h-[calc(80vh-2rem)]">
          <div className="flex items-center justify-between gap-3">
            <h2 id="exercise-picker-title" className="text-lg font-semibold">
              {title}
            </h2>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="inline-flex min-h-11 items-center rounded-full px-3 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              {t("close")}
            </button>
          </div>
          <ExerciseList {...list} />
        </div>
      )}
    </dialog>
  );
}
