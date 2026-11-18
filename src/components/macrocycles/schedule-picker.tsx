"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import type { ScheduledSession } from "@/domain/macrocycles/macrocycle-types";
import { CloseIcon, PlusIcon } from "../icons";

const MAX_PER_DAY = 3;
const MAX_PER_WEEK = 14;
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

/** Sessions per weekday (index 0 = Monday) from a schedule. */
function countsOf(sessions: ScheduledSession[]): number[] {
  return WEEKDAYS.map((d) => sessions.filter((s) => s.weekday === d).length);
}

/** Monday 2024-01-01 plus `weekday - 1` days, for localized weekday names. */
const dayDate = (weekday: number) => new Date(Date.UTC(2024, 0, weekday));

/**
 * Weekly schedule of a macrocycle: up to three training sessions per day,
 * 1–14 per week. Submits one hidden "sessions" input per session as
 * "weekday.slot".
 */
export function SchedulePicker({
  id,
  initial,
  labelledBy,
  errorId,
  invalid,
}: {
  id: string;
  labelledBy: string;
  initial: ScheduledSession[];
  /** Id of the error text below, if any. */
  errorId?: string;
  invalid: boolean;
}) {
  const t = useTranslations("Macrocycle.baseData.schedule");
  const format = useFormatter();
  const [counts, setCounts] = useState(() => countsOf(initial));
  const total = counts.reduce((a, b) => a + b, 0);
  const dayName = (weekday: number, style: "short" | "long") =>
    format.dateTime(dayDate(weekday), { weekday: style, timeZone: "UTC" });

  function change(weekday: number, delta: number) {
    setCounts((current) =>
      current.map((c, i) => (i === weekday - 1 ? c + delta : c)),
    );
  }

  return (
    <div
      id={id}
      role="group"
      data-schedule
      aria-labelledby={labelledBy}
      aria-describedby={errorId}
      data-invalid={invalid || undefined}
      className="flex flex-col gap-2"
    >
      <ul
        className={`grid grid-cols-7 gap-1 rounded-lg border p-1 ${
          invalid ? "border-red-600" : "border-zinc-300 dark:border-zinc-700"
        }`}
      >
        {WEEKDAYS.map((weekday) => {
          const count = counts[weekday - 1]!;
          const day = dayName(weekday, "long");
          return (
            <li
              key={weekday}
              data-weekday={weekday}
              className="flex min-w-0 flex-col items-stretch gap-1"
            >
              <span
                aria-hidden="true"
                className="text-center text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                {dayName(weekday, "short")}
              </span>
              {Array.from({ length: count }, (_, i) => i + 1).map((slot) => (
                <span key={slot} className="contents">
                  <input
                    type="hidden"
                    name="sessions"
                    value={`${weekday}.${slot}`}
                  />
                  <button
                    type="button"
                    // Removing any session of a day removes the day's last
                    // slot; the slots stay 1, 2, … without gaps.
                    onClick={() => change(weekday, -1)}
                    aria-label={t("remove", { day, slot })}
                    className="flex min-h-9 items-center justify-center gap-1 rounded-md bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                  >
                    {slot}
                    <CloseIcon className="size-2.5 opacity-70" />
                  </button>
                </span>
              ))}
              {count < MAX_PER_DAY && total < MAX_PER_WEEK && (
                <button
                  type="button"
                  onClick={() => change(weekday, 1)}
                  aria-label={t("add", { day })}
                  className="flex min-h-9 items-center justify-center rounded-md border border-dashed border-zinc-300 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  <PlusIcon />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-zinc-500" aria-live="polite">
        {t("count", { count: total })}
      </p>
    </div>
  );
}
