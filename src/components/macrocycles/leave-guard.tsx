"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import { useCurrentGuard } from "./unsaved-changes";

/**
 * Asks "Save changes?" (Save, Discard, Cancel) before leaving a form with
 * unsaved changes: by a link to another page (`leave`) or by an action on
 * the same page, e.g. switching the planning step (`guard`). Returns both
 * and the dialog to render once.
 */
export function useLeaveGuard(): {
  leave: (event: MouseEvent<HTMLElement>, href: string) => void;
  guard: (action: () => void) => void;
  dialog: ReactNode;
} {
  const tu = useTranslations("Macrocycle.unsaved");
  const router = useRouter();
  const current = useCurrentGuard();
  const ref = useRef<HTMLDialogElement>(null);
  // What to do once the user decided about the unsaved changes.
  const [target, setTarget] = useState<(() => void) | null>(null);
  const [saving, setSaving] = useState(false);

  function go(href: string) {
    router.push(href);
    router.refresh();
  }

  function ask(action: () => void) {
    // A function in state must be wrapped, or React would call it.
    setTarget(() => action);
    ref.current?.showModal();
  }

  function leave(event: MouseEvent<HTMLElement>, href: string) {
    // Plain navigation without unsaved changes (and for new tabs).
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    if (!current()?.isDirty()) return;
    event.preventDefault();
    ask(() => go(href));
  }

  function guard(action: () => void) {
    if (current()?.isDirty()) ask(action);
    else action();
  }

  async function saveAndLeave() {
    const form = current();
    if (!form || !target) return;
    setSaving(true);
    const saved = await form.save();
    setSaving(false);
    ref.current?.close();
    // When saving failed the form shows why, and the step stays open.
    if (saved) target();
  }

  function discardAndLeave() {
    ref.current?.close();
    target?.();
  }

  const dialog = (
    <dialog
      ref={ref}
      aria-labelledby="unsaved-title"
      aria-describedby="unsaved-text"
      onClose={() => setTarget(null)}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 backdrop:bg-black/60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
    >
      <h2 id="unsaved-title" className="text-lg font-semibold">
        {tu("title")}
      </h2>
      <p id="unsaved-text" className="mt-2 text-zinc-600 dark:text-zinc-400">
        {tu("text")}
      </p>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={saveAndLeave}
          disabled={saving}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-zinc-900 px-3 font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {tu("save")}
        </button>
        <button
          type="button"
          onClick={discardAndLeave}
          disabled={saving}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-300 px-3 font-medium hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          {tu("discard")}
        </button>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="inline-flex min-h-11 items-center justify-center rounded-full px-3 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          {tu("cancel")}
        </button>
      </div>
    </dialog>
  );
  return { leave, guard, dialog };
}

/** "‹ Back to …" that asks about unsaved changes first. */
export function GuardedBackLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const { leave, dialog } = useLeaveGuard();
  return (
    <>
      <Link
        href={href}
        onClick={(event) => leave(event, href)}
        className="self-start text-sm font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        <span aria-hidden="true" className="mr-1">
          ‹
        </span>
        {label}
      </Link>
      {dialog}
    </>
  );
}
