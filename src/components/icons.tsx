/** Small line icons in the current text colour, hidden from screen readers. */

export function PlusIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

export function CloseIcon({ className = "size-3" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path d="m4 4 8 8M12 4l-8 8" />
    </svg>
  );
}

export function MinusIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path d="M3 8h10" />
    </svg>
  );
}

/** A magic wand with sparkles, for "Autofill". */
export function MagicWandIcon({
  className = "size-5",
}: {
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 17 9.5-9.5M11 6l3 3" />
      <path d="M15 2v3M13.5 3.5h3M17.5 8.5v2M16.5 9.5h2M8 2.5v2M7 3.5h2" />
    </svg>
  );
}

/** A curved arrow back, for "Undo". */
export function UndoIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.5 5 4 8.5 7.5 12" />
      <path d="M4 8.5h8a4 4 0 0 1 0 8H9" />
    </svg>
  );
}

/** A curved arrow forward, for "Redo". */
export function RedoIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.5 5 16 8.5 12.5 12" />
      <path d="M16 8.5H8a4 4 0 0 0 0 8h3" />
    </svg>
  );
}
