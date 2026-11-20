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

const noSubscription = () => () => {};
/** False while server-rendering and hydrating, true afterwards. */
const useMounted = () =>
  useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );

/**
 * A tooltip with `text` while the pointer is over the surrounding table
 * cell, in the style of the coach-note tooltip. Rendered into the page body
 * and fixed to the viewport, so no sticky cell covers it and the table's
 * scroll area never grows. Screen readers get the text from the cell.
 */
export function CellTooltip({ text }: { text: string }) {
  const id = useId();
  const mounted = useMounted();
  const anchor = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);

  const cellOf = useCallback(
    () => anchor.current?.closest("th, td") ?? null,
    [],
  );
  useEffect(() => {
    const cell = cellOf();
    if (!cell) return;
    const enter = () => {
      const rect = cell.getBoundingClientRect();
      setPosition({ left: Math.max(8, rect.left), top: rect.bottom + 4 });
    };
    const leave = () => setPosition(null);
    cell.addEventListener("pointerenter", enter);
    cell.addEventListener("pointerleave", leave);
    window.addEventListener("scroll", leave, true);
    return () => {
      cell.removeEventListener("pointerenter", enter);
      cell.removeEventListener("pointerleave", leave);
      window.removeEventListener("scroll", leave, true);
    };
  }, [cellOf]);

  return (
    <>
      <span ref={anchor} hidden />
      {mounted &&
        position &&
        createPortal(
          <span
            id={id}
            role="tooltip"
            data-cell-tooltip
            style={{ left: position.left, top: position.top }}
            className="pointer-events-none fixed z-50 max-w-56 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-normal text-zinc-900 shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          >
            {text}
          </span>,
          document.body,
        )}
    </>
  );
}
