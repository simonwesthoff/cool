"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

/** Sends a change that is still waiting for its save; resolves when done. */
type Flush = () => Promise<unknown>;

type Registry = {
  /** Registers a flush and returns how to remove exactly that one. */
  register: (flush: Flush) => () => void;
  flushAll: () => Promise<void>;
};

const Context = createContext<Registry | null>(null);

/**
 * Shares the shown step's pending save, so leaving the step or the page
 * sends it first instead of asking. Closing the tab sends it too: the
 * forms save with `keepalive`, so the request outlives the page.
 */
export function PendingSaveProvider({ children }: { children: ReactNode }) {
  const flushes = useRef(new Set<Flush>());
  const register = useCallback((flush: Flush) => {
    flushes.current.add(flush);
    return () => {
      flushes.current.delete(flush);
    };
  }, []);
  const flushAll = useCallback(async () => {
    await Promise.all([...flushes.current].map((f) => f().catch(() => {})));
  }, []);
  useEffect(() => {
    const onHide = () => void flushAll();
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [flushAll]);
  const value = useMemo(() => ({ register, flushAll }), [register, flushAll]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/** Registers a form's flush while the form is shown. */
export function usePendingSave(flush: Flush) {
  const registry = useContext(Context);
  const latest = useRef(flush);
  useEffect(() => {
    latest.current = flush;
  });
  useEffect(() => {
    if (!registry) return;
    return registry.register(() => latest.current());
  }, [registry]);
}

/** Sends every pending save; resolves when they are done. */
export function useFlushPending(): () => Promise<void> {
  const registry = useContext(Context);
  return registry?.flushAll ?? (() => Promise.resolve());
}

/** "‹ Back to …" that sends a pending save before it leaves. */
export function SavingBackLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const router = useRouter();
  const flush = useFlushPending();
  return (
    <Link
      href={href}
      onClick={(event) => {
        // A new tab or window leaves this page open: nothing to wait for.
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        void flush().then(() => {
          router.push(href);
          router.refresh();
        });
      }}
      className="self-start text-sm font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
    >
      <span aria-hidden="true" className="mr-1">
        ‹
      </span>
      {label}
    </Link>
  );
}
