import type { ReactNode } from "react";

/** Page header: optional content on the left and on the right. */
export function PageHeader({
  left,
  right,
}: {
  left?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-8">
      <div className="min-w-0">{left}</div>
      <div className="min-w-0">{right}</div>
    </header>
  );
}
