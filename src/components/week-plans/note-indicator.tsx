"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

const TOOLTIP_WIDTH = 224;
const noSubscription = () => () => {};
/** False while server-rendering and hydrating, true afterwards. */
const useMounted = () =>
  useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );

/**
 * A small note icon after an exercise name: the coach's note appears as a
 * tooltip when hovering the cell (a `group/note` ancestor), and on focus
 * for keyboards and touch. The tooltip is rendered into the page body and
 * fixed to the viewport: it never makes the table's scroll area grow (no
 * vertical scrolling) and no sticky table cell covers it.
 */
export function NoteIndicator({
  note,
  label,
}: {
  note: string;
  label: string;
}) {
  const id = useId();
  const mounted = useMounted();
  const button = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  // Hover or focus of the cell: the tooltip lives outside it (portal).
  const [shown, setShown] = useState(false);

  const place = useCallback(() => {
    const cell =
      button.current?.closest("th, td") ?? button.current?.parentElement;
    if (!cell) return;
    const rect = cell.getBoundingClientRect();
    setPosition({
      left: Math.max(
        8,
        Math.min(rect.left, window.innerWidth - TOOLTIP_WIDTH - 8),
      ),
      top: rect.bottom + 4,
    });
  }, []);

  useEffect(() => {
    const cell =
      button.current?.closest("th, td") ?? button.current?.parentElement;
    if (!cell) return;
    const enter = () => {
      place();
      setShown(true);
    };
    const leave = () => setShown(false);
    // Hidden again on scrolling: the cell has moved away from it.
    const hide = () => setPosition(null);
    cell.addEventListener("pointerenter", enter);
    cell.addEventListener("pointerleave", leave);
    window.addEventListener("scroll", hide, true);
    return () => {
      cell.removeEventListener("pointerenter", enter);
      cell.removeEventListener("pointerleave", leave);
      window.removeEventListener("scroll", hide, true);
    };
  }, [place]);

  const tooltip = (
    <span
      id={id}
      role="tooltip"
      style={
        position
          ? { left: position.left, top: position.top, width: TOOLTIP_WIDTH }
          : { width: TOOLTIP_WIDTH }
      }
      className={`pointer-events-none fixed z-50 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-normal whitespace-pre-wrap text-zinc-900 shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 ${
        position && shown ? "visible" : "invisible"
      }`}
    >
      {note}
    </span>
  );

  return (
    <span className="ml-1 inline-flex align-middle">
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-describedby={id}
        data-note-indicator
        onFocus={() => {
          place();
          setShown(true);
        }}
        onBlur={() => setShown(false)}
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
      {/* Rendered at once (for its accessible description), outside the table. */}
      {mounted && createPortal(tooltip, document.body)}
    </span>
  );
}
