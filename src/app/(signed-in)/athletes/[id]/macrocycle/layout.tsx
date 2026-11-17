import type { ReactNode } from "react";
import { UnsavedChangesProvider } from "@/components/macrocycles/unsaved-changes";

/**
 * Macrocycle pages: the planning steps share the current form's unsaved
 * changes with the stepper.
 */
export default function MacrocycleLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <UnsavedChangesProvider>{children}</UnsavedChangesProvider>;
}
