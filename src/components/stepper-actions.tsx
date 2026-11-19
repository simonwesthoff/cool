import type { ReactNode } from "react";

/** The continue button's style in every stepper step. */
export const PRIMARY_BUTTON =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-center font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";
/** The back button's style: a text button without a border. */
export const BACK_BUTTON =
  "inline-flex min-h-11 items-center justify-center rounded-full px-4 text-center font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60 dark:text-zinc-300 dark:hover:bg-zinc-900";

/**
 * The bottom row of a stepper step: back at the left, the save status and
 * continue at the right, each only where the action exists.
 */
export function StepperActions({
  back,
  status,
  next,
}: {
  back?: ReactNode;
  status?: ReactNode;
  next?: ReactNode;
}) {
  return (
    <div
      data-stepper-actions
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <div data-stepper-back>{back}</div>
      <div
        data-stepper-next
        className="ml-auto flex flex-wrap items-center justify-end gap-3"
      >
        {status}
        {next}
      </div>
    </div>
  );
}
