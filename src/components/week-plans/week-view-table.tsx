"use client";

import { useTranslations } from "next-intl";
import type { LiftCategory } from "@/domain/exercises/catalog-types";
import { usesFreeText } from "@/domain/week-plans/week-plan-types";
import { LiftMarks } from "../exercises/lift-marks";
import type { PlannedSession } from "@/domain/week-plans/week-plan-types";
import { FeedbackField } from "./feedback-field";
import { CellTooltip } from "./cell-tooltip";
import {
  exerciseDivider,
  line,
  stickyName,
  VIEW_TABLE_WIDTH,
  viewShare,
  viewWidths,
} from "./table-layout";
import { draftOf } from "./week-draft";

/**
 * A session of the current week, read-only like the week editor's "Sets &
 * weights" table: each exercise two rows high (marks and number, the name
 * on hover; weight above reps, or the free text from exercise 30 on), the
 * coach comment (variation and note) and the athlete's feedback. Only the
 * linked athlete can type feedback. All tables of the week have the same
 * number of set columns: the most sets of any exercise that week.
 */
export function WeekViewTable({
  athleteId,
  weekNumber,
  session,
  label,
  names,
  variations = {},
  setColumns,
  categories = {},
  canGiveFeedback,
}: {
  athleteId: string;
  weekNumber: number;
  session: PlannedSession;
  /** "Monday" or "Monday 1". */
  label: string;
  /** Display names by exercise number ("13 Snatch pull"). */
  names: Record<string, string>;
  /** The mesocycle's variation by exercise number, for the coach comment. */
  variations?: Record<number, string>;
  /** Set columns of every table of the week (at least 1). */
  setColumns: number;
  /** Lift categories by exercise number, shown as marks before the name. */
  categories?: Record<number, LiftCategory[]>;
  canGiveFeedback: boolean;
}) {
  const t = useTranslations("WeekView");
  const tv = useTranslations("WeekEditor.values");
  // Single sets from the stored set groups, as in the editor.
  const [draft] = draftOf([session]);
  const head =
    "px-1 py-1 text-xs font-semibold text-zinc-600 dark:text-zinc-400";
  const rowLabel = `${line} px-1 text-right text-xs font-normal text-zinc-500`;
  const cell = `${line} h-8 px-1 text-right tabular-nums`;
  const sets = Array.from({ length: Math.max(setColumns, 1) }, (_, i) => i);
  const width = viewWidths(sets.length);

  return (
    <section
      aria-label={label}
      data-session={`${session.weekday}.${session.slot}`}
      className="flex flex-col gap-1"
    >
      <h3 className="font-semibold">{label}</h3>
      {session.exercises.length === 0 ? (
        <p className="text-sm text-zinc-500">{tv("noExercises")}</p>
      ) : (
        // On phones the table keeps its width and scrolls sideways; on wide
        // screens it fits the container and the columns shrink in proportion.
        <div className="overflow-x-auto overflow-y-hidden pr-px lg:overflow-visible">
          <table
            className="table-fixed border-collapse text-sm lg:!w-full"
            style={{ width: `${VIEW_TABLE_WIDTH}rem` }}
          >
            <colgroup>
              <col
                data-col="exercise"
                style={{ width: viewShare(width.exercise) }}
              />
              <col style={{ width: viewShare(width.rowLabel) }} />
              {sets.map((i) => (
                <col key={i} style={{ width: viewShare(width.set) }} />
              ))}
              <col
                data-col="comment"
                style={{ width: viewShare(width.comment) }}
              />
              <col
                data-col="feedback"
                style={{ width: viewShare(width.feedback) }}
              />
            </colgroup>
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900">
                <th
                  scope="col"
                  className={`${line} ${head} sticky left-0 z-[1] bg-zinc-50 text-left dark:bg-zinc-900`}
                >
                  {tv("exercise")}
                </th>
                <th scope="col" className={line}>
                  <span className="sr-only">{tv("row")}</span>
                </th>
                {sets.map((i) => (
                  <th
                    key={i}
                    scope="col"
                    className={`${line} ${head} text-right`}
                  >
                    {i + 1}
                  </th>
                ))}
                <th
                  scope="col"
                  data-heading="comment"
                  className={`${line} ${head} text-left`}
                >
                  {t("comment")}
                </th>
                <th
                  scope="col"
                  data-heading="feedback"
                  className={`${line} ${head} text-left`}
                >
                  {t("feedback.title")}
                </th>
              </tr>
            </thead>
            {session.exercises.map((e, i) => {
              const exerciseSets = draft!.exercises[i]!.sets;
              const variation = variations[e.exerciseNumber];
              const comment = [
                variation ? t("variation", { variation }) : null,
                e.note || null,
              ]
                .filter(Boolean)
                .join("\n");
              const name = names[e.exerciseNumber] ?? String(e.exerciseNumber);
              const free = usesFreeText(e.exerciseNumber);
              const shared = (
                <>
                  <td
                    rowSpan={2}
                    data-comment
                    className={`${line} px-1 py-1 align-top text-sm whitespace-pre-wrap`}
                  >
                    {comment}
                  </td>
                  <td
                    rowSpan={2}
                    data-feedback
                    className={`${line} p-0 align-top`}
                  >
                    {canGiveFeedback ? (
                      <FeedbackField
                        target={{
                          athleteId,
                          weekNumber,
                          weekday: session.weekday,
                          slot: session.slot,
                          exerciseNumber: e.exerciseNumber,
                        }}
                        initial={e.feedback ?? ""}
                        label={t("feedback.of", { name })}
                      />
                    ) : (
                      <p className="px-1 py-1 text-sm whitespace-pre-wrap">
                        {e.feedback}
                      </p>
                    )}
                  </td>
                </>
              );
              return (
                <tbody
                  key={`${e.exerciseNumber}`}
                  data-exercise={e.exerciseNumber}
                  className={exerciseDivider}
                >
                  <tr data-row="weight">
                    <th
                      scope="rowgroup"
                      rowSpan={2}
                      className={`${line} ${stickyName} px-2 text-left align-middle font-medium`}
                    >
                      {/* Marks and number; the name on hover. */}
                      <span
                        className="flex items-center gap-1.5"
                        data-exercise-label
                      >
                        <LiftMarks
                          categories={categories[e.exerciseNumber] ?? []}
                        />
                        <span aria-hidden="true">{e.exerciseNumber}</span>
                        <span className="sr-only">{name}</span>
                      </span>
                      <CellTooltip text={name} />
                    </th>
                    {free ? (
                      <td
                        colSpan={sets.length + 1}
                        rowSpan={2}
                        data-free-text
                        className={`${line} px-1 py-1 align-top whitespace-pre-wrap`}
                      >
                        {e.freeText}
                      </td>
                    ) : (
                      <>
                        <th scope="row" className={rowLabel}>
                          {tv("kg")}
                        </th>
                        {sets.map((s) => (
                          <td key={s} data-set={s + 1} className={cell}>
                            {exerciseSets[s]?.weight}
                          </td>
                        ))}
                      </>
                    )}
                    {shared}
                  </tr>
                  <tr data-row="reps">
                    {!free && (
                      <>
                        <th scope="row" className={rowLabel}>
                          {tv("reps")}
                        </th>
                        {sets.map((s) => (
                          <td key={s} className={cell}>
                            {exerciseSets[s]?.reps}
                          </td>
                        ))}
                      </>
                    )}
                  </tr>
                </tbody>
              );
            })}
          </table>
        </div>
      )}
    </section>
  );
}
