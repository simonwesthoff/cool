/**
 * Shared look of the week tables (week editor step 2 and the week view on
 * the athlete page): fixed column widths in rem that fit the content width
 * of 60 rem, grid lines and cells that fill like a spreadsheet.
 */
import { MAX_SETS } from "./week-draft";

export const SETS = Array.from({ length: MAX_SETS }, (_, i) => i);

/** Columns both tables have, with the same widths. */
export const SHARED_WIDTH = { exercise: 8, rowLabel: 2.25, set: 2.5 } as const;
const shared =
  SHARED_WIDTH.exercise + SHARED_WIDTH.rowLabel + MAX_SETS * SHARED_WIDTH.set;

/** The editor: note, Actual/Plan label and four equal indicator columns. */
export const EDITOR_WIDTH = {
  ...SHARED_WIDTH,
  note: 7.75,
  valueLabel: 2.75,
  indicator: 3.5,
} as const;
export const EDITOR_TABLE_WIDTH =
  shared +
  EDITOR_WIDTH.note +
  EDITOR_WIDTH.valueLabel +
  4 * EDITOR_WIDTH.indicator;

/** The week view: note and feedback instead of the indicators. */
export const VIEW_WIDTH = {
  ...SHARED_WIDTH,
  note: 11,
  feedback: 13.75,
} as const;
export const VIEW_TABLE_WIDTH = shared + VIEW_WIDTH.note + VIEW_WIDTH.feedback;

/** Grid lines of the table. */
export const line = "border border-zinc-200 dark:border-zinc-800";
/** An input that fills its cell, like a spreadsheet. */
export const fill =
  "block h-8 w-full min-w-0 bg-transparent px-1 tabular-nums outline-none focus:bg-zinc-100 aria-invalid:bg-red-50 aria-invalid:text-red-700 dark:focus:bg-zinc-900 dark:aria-invalid:bg-red-950 dark:aria-invalid:text-red-400";
/** The sticky exercise column, kept in view when the table scrolls. */
export const stickyName = "sticky left-0 z-[1] bg-white dark:bg-zinc-950";
