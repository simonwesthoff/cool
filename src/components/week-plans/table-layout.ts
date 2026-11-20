/**
 * Shared look of the week tables (week editor step 2 and the week view on
 * the athlete page): fixed column widths in rem that fit the content width
 * of 60 rem, grid lines and cells that fill like a spreadsheet.
 */
import { MAX_SETS } from "./week-draft";

export const SETS = Array.from({ length: MAX_SETS }, (_, i) => i);

/** Columns both tables have; the editor narrows the exercise column. */
export const SHARED_WIDTH = { exercise: 8, rowLabel: 2.25, set: 2.5 } as const;
const shared =
  SHARED_WIDTH.exercise + SHARED_WIDTH.rowLabel + MAX_SETS * SHARED_WIDTH.set;

/**
 * The editor: a narrow exercise column (marks and number, the name on
 * hover), the coach note, the Actual/Plan label and four equal indicator
 * columns. The width the exercise column saves goes to the note.
 */
export const EDITOR_WIDTH = {
  ...SHARED_WIDTH,
  exercise: 4.5,
  note: 11.25,
  valueLabel: 2.75,
  indicator: 3.5,
} as const;
export const EDITOR_TABLE_WIDTH =
  shared -
  SHARED_WIDTH.exercise +
  EDITOR_WIDTH.exercise +
  EDITOR_WIDTH.note +
  EDITOR_WIDTH.valueLabel +
  4 * EDITOR_WIDTH.indicator;

/**
 * The week view: a narrow exercise column (marks and number), as many set
 * columns as the week needs, then the coach comment and the feedback,
 * which share the rest of the 60 rem content width equally.
 */
export const VIEW_TABLE_WIDTH = 60;
export function viewWidths(setColumns: number) {
  const exercise = 4.5;
  const rowLabel = SHARED_WIDTH.rowLabel;
  const set = SHARED_WIDTH.set;
  const text = (VIEW_TABLE_WIDTH - exercise - rowLabel - setColumns * set) / 2;
  return { exercise, rowLabel, set, comment: text, feedback: text };
}
/** A column's share of the week view's width, so the table can shrink. */
export const viewShare = (rem: number) => `${(rem / VIEW_TABLE_WIDTH) * 100}%`;

/** The bold line between two exercises. */
export const exerciseDivider =
  "border-t-2 border-t-zinc-400 dark:border-t-zinc-500";

/** Grid lines of the table. */
export const line = "border border-zinc-200 dark:border-zinc-800";
/** An input that fills its cell, like a spreadsheet. */
export const fill =
  "block h-8 w-full min-w-0 bg-transparent px-1 tabular-nums outline-none focus:bg-zinc-100 aria-invalid:bg-red-50 aria-invalid:text-red-700 dark:focus:bg-zinc-900 dark:aria-invalid:bg-red-950 dark:aria-invalid:text-red-400";
/** The sticky exercise column, kept in view when the table scrolls. */
export const stickyName = "sticky left-0 z-[1] bg-white dark:bg-zinc-950";
