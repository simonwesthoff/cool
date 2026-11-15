import type { ReactNode } from "react";
import { LanguageSwitcher } from "./language-switcher";

/** Page header: optional content on the left, language switcher on the right. */
export function PageHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-8">
      <div className="min-w-0">{children}</div>
      <LanguageSwitcher />
    </header>
  );
}
