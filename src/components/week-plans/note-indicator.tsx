"use client";

import { useId } from "react";

/**
 * A small note icon after an exercise name: the coach's note appears as a
 * tooltip when hovering the cell (a `group/note` ancestor), and on focus
 * for keyboards and touch.
 */
export function NoteIndicator({
  note,
  label,
}: {
  note: string;
  label: string;
}) {
  const id = useId();
  return (
    <span className="relative ml-1 inline-flex align-middle">
      <button
        type="button"
        aria-label={label}
        aria-describedby={id}
        data-note-indicator
        className="inline-flex size-5 items-center justify-center rounded text-zinc-500 hover:text-zinc-900 focus:text-zinc-900 dark:hover:text-zinc-100 dark:focus:text-zinc-100"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinejoin="round"
        >
          <path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" />
        </svg>
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none invisible absolute top-full left-0 z-20 mt-1 w-56 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-normal whitespace-pre-wrap text-zinc-900 shadow-md group-focus-within/note:visible group-hover/note:visible dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
      >
        {note}
      </span>
    </span>
  );
}
