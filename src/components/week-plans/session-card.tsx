"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { CloseIcon, PlusIcon } from "../icons";
import { MAX_PER_DAY, sessionsOnDay, type DraftSession } from "./week-draft";

/**
 * A session in step 1: its day, its exercises (reorder, remove) and the
 * ways to add exercises: "+ Exercise" (selection dialog) or dropping an
 * exercise from the catalog column.
 */
export function SessionCard({
  session,
  sessions,
  label,
  dayName,
  exerciseName,
  chosen,
  blockName,
  onChangeDay,
  onRemove,
  onAddClick,
  onDropExercise,
  onMoveExercise,
  onRemoveExercise,
}: {
  session: DraftSession;
  sessions: DraftSession[];
  /** "Monday" or "Monday 1". */
  label: string;
  dayName: (weekday: number) => string;
  exerciseName: (exerciseNumber: number) => string;
  chosen: number[];
  blockName: string;
  onChangeDay: (weekday: number) => void;
  onRemove: () => void;
  onAddClick: () => void;
  onDropExercise: (exerciseNumber: number) => void;
  onMoveExercise: (index: number, delta: -1 | 1) => void;
  onRemoveExercise: (index: number) => void;
}) {
  const t = useTranslations("WeekEditor.session");
  const [dragOver, setDragOver] = useState(false);
  const icon =
    "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-900";

  return (
    <section
      aria-label={label}
      data-session={`${session.weekday}.${session.slot}`}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        const number = Number(event.dataTransfer.getData("text/plain"));
        if (Number.isInteger(number) && number > 0) onDropExercise(number);
      }}
      className={`flex flex-col gap-2 rounded-2xl border p-3 ${
        dragOver
          ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="flex items-center gap-2">
        <h3 className="min-w-0 flex-1 font-semibold">{label}</h3>
        <select
          value={session.weekday}
          onChange={(event) => onChangeDay(Number(event.target.value))}
          aria-label={t("day", { session: label })}
          className="min-h-9 rounded-lg border border-zinc-300 bg-transparent px-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <option
              key={day}
              value={day}
              disabled={
                day !== session.weekday &&
                sessionsOnDay(sessions, day) >= MAX_PER_DAY
              }
            >
              {dayName(day)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("remove", { session: label })}
          className={icon}
        >
          <CloseIcon />
        </button>
      </div>
      {session.exercises.length === 0 ? (
        <p className="text-sm text-zinc-500">{t("empty")}</p>
      ) : (
        <ol className="flex flex-col gap-1">
          {session.exercises.map((e, index) => {
            const name = exerciseName(e.exerciseNumber);
            const planned = chosen.includes(e.exerciseNumber);
            return (
              <li
                key={e.key}
                data-exercise={e.exerciseNumber}
                className="flex items-center gap-1 rounded-lg bg-zinc-50 py-1 pr-1 pl-3 dark:bg-zinc-900"
              >
                <span className="min-w-0 flex-1 text-sm">
                  <span className="block truncate">{name}</span>
                  {!planned && (
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      {t("notPlanned", { block: blockName })}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => onMoveExercise(index, -1)}
                  aria-label={t("up", { name })}
                  className={icon}
                >
                  <span aria-hidden="true">↑</span>
                </button>
                <button
                  type="button"
                  disabled={index === session.exercises.length - 1}
                  onClick={() => onMoveExercise(index, 1)}
                  aria-label={t("down", { name })}
                  className={icon}
                >
                  <span aria-hidden="true">↓</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveExercise(index)}
                  aria-label={t("removeExercise", { name, session: label })}
                  className={icon}
                >
                  <CloseIcon />
                </button>
              </li>
            );
          })}
        </ol>
      )}
      <button
        type="button"
        onClick={onAddClick}
        aria-label={t("addTo", { session: label })}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
      >
        <PlusIcon />
        {t("addExercise")}
      </button>
      <p className="hidden text-center text-xs text-zinc-500 lg:block">
        {t("dropHint")}
      </p>
    </section>
  );
}
