import type { ReactNode } from "react";
import { PendingSaveProvider } from "@/components/macrocycles/pending-save";

/**
 * Macrocycle pages: the planning steps and the week editor share their
 * pending save, which is sent before a step or the page is left.
 */
export default function MacrocycleLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <PendingSaveProvider>{children}</PendingSaveProvider>;
}
