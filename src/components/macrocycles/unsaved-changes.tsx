"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

/** What a planning step with a form offers before the step is left. */
export type UnsavedChangesGuard = {
  /** Whether the form differs from what is stored. */
  isDirty: () => boolean;
  /** Saves the form; false when saving failed (errors are shown in the form). */
  save: () => Promise<boolean>;
};

type Registry = {
  /** Registers a guard and returns how to remove exactly that guard. */
  register: (guard: UnsavedChangesGuard) => () => void;
  current: () => UnsavedChangesGuard | null;
};

const Context = createContext<Registry | null>(null);

/** Shares the current step's guard between its form and the stepper. */
export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const guard = useRef<UnsavedChangesGuard | null>(null);
  const register = useCallback((next: UnsavedChangesGuard) => {
    guard.current = next;
    // A hidden previous page may clean up after the next page registered;
    // only remove the own guard.
    return () => {
      if (guard.current === next) guard.current = null;
    };
  }, []);
  const current = useCallback(() => guard.current, []);
  const value = useMemo(() => ({ register, current }), [register, current]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/** Registers a form's guard while the form is shown. */
export function useUnsavedChangesGuard(guard: UnsavedChangesGuard) {
  const registry = useContext(Context);
  // The latest functions, without re-registering on every render.
  const latest = useRef(guard);
  useEffect(() => {
    latest.current = guard;
  });
  useEffect(() => {
    if (!registry) return;
    return registry.register({
      isDirty: () => latest.current.isDirty(),
      save: () => latest.current.save(),
    });
  }, [registry]);
}

/** The guard of the step currently shown, if its form has one. */
export function useCurrentGuard(): () => UnsavedChangesGuard | null {
  const registry = useContext(Context);
  return registry?.current ?? (() => null);
}
