"use client";

import { useTranslations } from "next-intl";
import { useState, type DragEvent } from "react";
import { CloseIcon, PlusIcon } from "../icons";
import { MAX_PER_DAY, sessionsOnDay, type DraftSession } from "./week-draft";

/** Drag data of an exercise moved within the week. */
export const MOVE_TYPE = "application/x-week-exercise";

/** Circle with an exclamation mark: not planned for the mesocycle. */
function OffPlanIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
    >
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 4.75v3.75M8 11.1v.15" />
    </svg>
  );
}

/** Six dots: the handle to drag an exercise. */
function GripIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4">
      {[4, 8, 12].flatMap((y) =>
        [6, 10].map((x) => (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r="1.2"
            className="fill-current"
          />
        )),
      )}
    </svg>
  );
}

export type Drop =
  /** An exercise from the catalog column. */
  | { kind: "add"; exerciseNumber: number; index: number }
  /** An exercise of the week moved here. */
  | { kind: "move"; sessionKey: string; exerciseKey: string; index: number };

/** What was dropped: an exercise moved within the week, or from the catalog. */
function dropOf(event: DragEvent, index: number): Drop | null {
  try {
    const move = JSON.parse(event.dataTransfer.getData(MOVE_TYPE)) as {
      sessionKey?: string;
      exerciseKey?: string;
    };
    if (move.sessionKey && move.exerciseKey)
      return {
        kind: "move",
        sessionKey: move.sessionKey,
        exerciseKey: move.exerciseKey,
        index,
      };
  } catch {
    // Not a move; maybe an exercise from the catalog.
  }
  const number = Number(event.dataTransfer.getData("text/plain"));
  return Number.isInteger(number) && number > 0
    ? { kind: "add", exerciseNumber: number, index }
    : null;
}

/**
 * A session in step 1: its day (the title is the day selection), its
 * exercises with drag handles, and the ways to add exercises: "+ Exercise"
 * (selection dialog) or dropping one from the catalog column.
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
  onDrop,
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
  onDrop: (drop: Drop) => void;
  /** Keyboard alternative to dragging: one place up or down. */
  onMoveExercise: (index: number, delta: -1 | 1) => void;
  onRemoveExercise: (index: number) => void;
}) {
  const t = useTranslations("WeekEditor.session");
  const [dragOver, setDragOver] = useState(false);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const several = sessionsOnDay(sessions, session.weekday) > 1;
  const icon =
    "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900";
  const allowDrop = (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = event.dataTransfer.types?.includes(
      MOVE_TYPE,
    )
      ? "move"
      : "copy";
  };

  return (
    <section
      aria-label={label}
      data-session={`${session.weekday}.${session.slot}`}
      onDragOver={(event) => {
        allowDrop(event);
        setDragOver(true);
      }}
      onDragLeave={() => {
        setDragOver(false);
        setDropIndex(null);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        setDropIndex(null);
        const drop = dropOf(event, session.exercises.length);
        if (drop) onDrop(drop);
      }}
      className={`flex flex-col gap-2 rounded-2xl border p-3 ${
        dragOver
          ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="flex items-center gap-2">
        <h3 className="flex min-w-0 flex-1 items-center gap-2">
          {/* The title is the day selection. */}
          <select
            value={session.weekday}
            onChange={(event) => onChangeDay(Number(event.target.value))}
            aria-label={t("day", { session: label })}
            className="min-h-9 min-w-0 rounded-lg border border-transparent bg-transparent py-1 pl-1 text-base font-semibold hover:border-zinc-300 focus:border-zinc-300 dark:bg-zinc-950 dark:hover:border-zinc-700"
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
          {several && (
            <span
              aria-hidden="true"
              className="rounded-full bg-zinc-100 px-2 text-sm font-semibold dark:bg-zinc-800"
            >
              {session.slot}
            </span>
          )}
        </h3>
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
                onDragOver={(event) => {
                  allowDrop(event);
                  setDropIndex(index);
                }}
                onDrop={(event) => {
                  // Dropped on a row: insert before it.
                  event.preventDefault();
                  event.stopPropagation();
                  setDragOver(false);
                  setDropIndex(null);
                  const drop = dropOf(event, index);
                  if (drop) onDrop(drop);
                }}
                className={`flex items-center gap-1 rounded-lg bg-zinc-50 py-1 pr-1 pl-1 dark:bg-zinc-900 ${
                  dropIndex === index
                    ? "shadow-[0_-2px_0_0] shadow-zinc-900 dark:shadow-zinc-100"
                    : ""
                }`}
              >
                <button
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData(
                      MOVE_TYPE,
                      JSON.stringify({
                        sessionKey: session.key,
                        exerciseKey: e.key,
                      }),
                    );
                    event.dataTransfer.effectAllowed = "move";
                    const row = event.currentTarget.closest("li");
                    if (row) event.dataTransfer.setDragImage(row, 16, 16);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowUp" && index > 0) {
                      event.preventDefault();
                      onMoveExercise(index, -1);
                    }
                    if (
                      event.key === "ArrowDown" &&
                      index < session.exercises.length - 1
                    ) {
                      event.preventDefault();
                      onMoveExercise(index, 1);
                    }
                  }}
                  aria-label={t("move", { name })}
                  className={`${icon} cursor-grab active:cursor-grabbing`}
                >
                  <GripIcon />
                </button>
                <span className="min-w-0 flex-1 truncate text-sm">{name}</span>
                {!planned && (
                  // Not planned for the week's mesocycle.
                  <span
                    data-not-planned
                    title={t("notPlanned", { block: blockName })}
                    className="inline-flex size-9 shrink-0 items-center justify-center text-zinc-600 dark:text-zinc-400"
                  >
                    <OffPlanIcon />
                    <span className="sr-only">
                      {t("notPlanned", { block: blockName })}
                    </span>
                  </span>
                )}
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
    </section>
  );
}
