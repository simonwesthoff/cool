import type { ReactNode } from "react";

/**
 * The main area of every page: one content width for the whole app on
 * desktop (the width of the macrocycle planning's intensity step).
 */
export function PageMain({
  children,
  className = "",
}: {
  children: ReactNode;
  /** Extra classes, e.g. to centre a short page vertically. */
  className?: string;
}) {
  return (
    <main
      className={`mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pt-4 pb-24 sm:px-8 ${className}`.trim()}
    >
      {children}
    </main>
  );
}
