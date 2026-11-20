import type { KeyboardEvent } from "react";
import { MAX_SETS } from "./week-draft";

/** The exercises of the week's tables that have set cells, in page order. */
const exerciseBodies = () =>
  [...document.querySelectorAll("tbody[data-exercise]")].filter((b) =>
    b.querySelector("[data-cell]"),
  );
const cellIn = (body: Element | undefined, field: string, set: number) =>
  body?.querySelector<HTMLElement>(
    `[data-cell="${field}"][data-set="${set}"]`,
  ) ?? null;

/** Whether the caret is at the start (or end) of an input, or all is selected. */
function atEdge(input: HTMLInputElement, end: boolean) {
  const { selectionStart: from, selectionEnd: to, value } = input;
  if (from === null || to === null) return true;
  if (from === 0 && to === value.length) return true;
  return end ? from === value.length : to === 0;
}

/**
 * Keyboard navigation in the step 2 tables, like a spreadsheet:
 * - **Arrow keys:** between the weight and reps cells, also to the
 *   exercises above and below. Left and right move once the caret is at
 *   the edge of the value.
 * - **Enter:** weight → reps of the same set → weight of the next set;
 *   from the last set's reps to the coach note; from the note to the
 *   next exercise's first weight. Shift+Enter keeps a line break in the
 *   note.
 */
export function moveFocus(
  event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
) {
  if (event.nativeEvent.isComposing || event.altKey || event.metaKey) return;
  const el = event.currentTarget;
  const body = el.closest("tbody[data-exercise]");
  if (!body) return;
  const bodies = exerciseBodies();
  const index = bodies.indexOf(body);
  const go = (target: HTMLElement | null) => {
    if (!target) return;
    event.preventDefault();
    target.focus();
    if (target instanceof HTMLInputElement) target.select();
  };

  // The coach note: Enter goes on to the next exercise.
  if (el.dataset.note !== undefined) {
    if (event.key === "Enter" && !event.shiftKey)
      go(cellIn(bodies[index + 1], "weight", 0));
    return;
  }
  const field = el.dataset.cell;
  const set = Number(el.dataset.set);
  if (!(el instanceof HTMLInputElement) || !field) return;
  const last = MAX_SETS - 1;
  switch (event.key) {
    case "Enter":
      if (event.shiftKey) return;
      if (field === "weight") go(cellIn(body, "reps", set));
      else if (set < last) go(cellIn(body, "weight", set + 1));
      else go(body.querySelector<HTMLElement>("[data-note]"));
      return;
    case "ArrowUp":
      go(
        field === "reps"
          ? cellIn(body, "weight", set)
          : cellIn(bodies[index - 1], "reps", set),
      );
      return;
    case "ArrowDown":
      go(
        field === "weight"
          ? cellIn(body, "reps", set)
          : cellIn(bodies[index + 1], "weight", set),
      );
      return;
    case "ArrowLeft":
      if (set > 0 && atEdge(el, false)) go(cellIn(body, field, set - 1));
      return;
    case "ArrowRight":
      if (set < last && atEdge(el, true)) go(cellIn(body, field, set + 1));
      return;
  }
}
