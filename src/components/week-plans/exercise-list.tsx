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

/**
 * All catalog exercises by group, with the ones chosen for the week's
 * mesocycle highlighted (bar, bold, and a spoken hint). Rows are draggable
 * (desktop catalog column) or buttons (selection dialog).
 */
export function ExerciseList({
  catalog,
  chosen,
  blockName,
  onPick,
  disabled = [],
  draggable = false,
}: {
  catalog: CatalogGroup[];
  chosen: number[];
  /** Name of the week's mesocycle, for the highlight hint. */
  blockName: string;
  /** Picking by click (selection dialog); without it rows are drag sources. */
  onPick?: (exerciseNumber: number) => void;
  /** Exercises that cannot be picked (already in the session). */
  disabled?: number[];
  draggable?: boolean;
}) {
  const t = useTranslations("WeekEditor.catalog");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const groups = catalog
    .map((g) => ({
      ...g,
      exercises: g.exercises.filter(
        (e) =>
          !q ||
          String(e.number).startsWith(q) ||
          localized(e.name, locale).toLowerCase().includes(q),
      ),
    }))
    .filter((g) => g.exercises.length > 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label={t("search")}
        placeholder={t("search")}
        className="min-h-11 rounded-lg border border-zinc-300 bg-transparent px-3 dark:border-zinc-700"
      />
      {draggable && (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          {t("dragHint")}
        </p>
      )}
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        <span
          aria-hidden="true"
          className="mr-1 inline-block h-3 w-1 rounded-full bg-zinc-900 align-middle dark:bg-zinc-100"
        />
        {t("legend", { block: blockName })}
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
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
                const highlighted = chosen.includes(e.number);
                const off = disabled.includes(e.number);
                const name = `${e.number} ${localized(e.name, locale)}`;
                const row = `flex min-h-10 w-full items-center gap-2 rounded-md border-l-4 px-2 text-left text-sm ${
                  highlighted
                    ? "border-zinc-900 bg-zinc-100 font-semibold dark:border-zinc-100 dark:bg-zinc-900"
                    : "border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                }`;
                const content = (
                  <>
                    <span className="min-w-0 flex-1 truncate">{name}</span>
                    {highlighted && (
                      <span className="sr-only">
                        {t("inBlock", { block: blockName })}
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
                        data-highlighted={highlighted || undefined}
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
                        data-highlighted={highlighted || undefined}
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
      className="mx-auto mt-auto mb-0 h-[85vh] w-full max-w-lg rounded-t-2xl border border-zinc-200 bg-white p-4 text-zinc-900 backdrop:bg-black/60 sm:m-auto sm:h-[80vh] sm:rounded-2xl dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
    >
      {open && (
        <div className="flex h-full flex-col gap-3">
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
