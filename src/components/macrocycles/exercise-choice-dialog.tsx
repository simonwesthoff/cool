"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { localized, type Exercise } from "@/domain/exercises/catalog-types";
import type {
  MesocycleExercise,
  MesocycleType,
} from "@/domain/macrocycles/macrocycle-types";

export type ChoiceTarget = {
  exercise: Exercise;
  type: MesocycleType;
  /** The current choice; null when the exercise is not chosen yet. */
  choice: MesocycleExercise | null;
};

type Props = {
  /** The cell being edited; null closes the dialog. */
  target: ChoiceTarget | null;
  /** Resolves to false when saving failed. */
  onSave: (variation: string, reason: string) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
  onClose: () => void;
};

const REASON_MAX = 500;
const VARIATION_MAX = 200;

/** Dialog for one cell of the exercise table: variation and reason. */
export function ExerciseChoiceDialog({
  target,
  onSave,
  onRemove,
  onClose,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (target && !el.open) el.showModal();
    if (!target && el.open) el.close();
  }, [target]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="exercise-choice-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-zinc-200 bg-white p-0 text-zinc-900 backdrop:bg-black/60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
    >
      {target && (
        <ChoiceForm
          // A new cell starts with a fresh form.
          key={`${target.type}-${target.exercise.number}`}
          target={target}
          onSave={onSave}
          onRemove={onRemove}
          close={() => dialog.current?.close()}
        />
      )}
    </dialog>
  );
}

function ChoiceForm({
  target,
  onSave,
  onRemove,
  close,
}: {
  target: ChoiceTarget;
  onSave: Props["onSave"];
  onRemove: Props["onRemove"];
  close: () => void;
}) {
  const t = useTranslations("Macrocycle.exercises");
  const tm = useTranslations("Macrocycle.mesocycles");
  const locale = useLocale();
  const variationId = useId();
  const reasonId = useId();
  const reasonErrorId = useId();
  const hintId = useId();
  const [variation, setVariation] = useState(target.choice?.variation ?? "");
  const [reason, setReason] = useState(target.choice?.reason ?? "");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const { exercise, type, choice } = target;
  // Title: number and name as one text, as in the catalog dialog.
  const title = `${exercise.number} ${localized(exercise.name, locale)}`;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (reason.trim().length === 0) {
      setReasonError(t("reasonRequired"));
      return;
    }
    setReasonError(null);
    setFailed(false);
    setBusy(true);
    const ok = await onSave(variation.trim(), reason.trim());
    setBusy(false);
    if (ok) close();
    else setFailed(true);
  }

  async function remove() {
    setFailed(false);
    setBusy(true);
    const ok = await onRemove();
    setBusy(false);
    if (ok) close();
    else setFailed(true);
  }

  const inputClass =
    "min-h-11 w-full rounded-lg border border-zinc-300 bg-transparent px-3 aria-invalid:border-red-600 dark:border-zinc-700";

  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex max-h-[85vh] flex-col overflow-y-auto"
    >
      <div className="flex flex-col gap-1 border-b border-zinc-200 p-4 dark:border-zinc-800">
        <h2
          id="exercise-choice-title"
          className="text-xl font-semibold break-words"
        >
          {title}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{tm(type)}</p>
      </div>
      <div className="flex flex-col gap-4 p-4">
        {failed && (
          <p
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
          >
            {t("saveFailed")}
          </p>
        )}
        <div className="flex flex-col gap-1">
          <label htmlFor={variationId} className="text-sm font-medium">
            {t("variation")}
            <span className="font-normal text-zinc-500"> {t("optional")}</span>
          </label>
          <input
            id={variationId}
            value={variation}
            maxLength={VARIATION_MAX}
            onChange={(event) => setVariation(event.target.value)}
            placeholder={t("variationPlaceholder")}
            aria-describedby={exercise.comment ? hintId : undefined}
            className={inputClass}
          />
          {exercise.comment && (
            <p id={hintId} className="text-xs text-zinc-500">
              {t("catalogHint", {
                comment: localized(exercise.comment, locale),
              })}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={reasonId} className="text-sm font-medium">
            {t("reason")}
          </label>
          <textarea
            id={reasonId}
            value={reason}
            rows={3}
            maxLength={REASON_MAX}
            required
            onChange={(event) => setReason(event.target.value)}
            aria-invalid={reasonError ? true : undefined}
            aria-describedby={reasonError ? reasonErrorId : undefined}
            className={`${inputClass} py-2`}
          />
          {reasonError && (
            <p
              id={reasonErrorId}
              className="text-sm text-red-700 dark:text-red-400"
            >
              {reasonError}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-3 border-t border-zinc-200 p-4 dark:border-zinc-800">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-11 items-center rounded-full bg-zinc-900 px-6 font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {choice ? t("save") : t("choose")}
        </button>
        {choice && (
          <button
            type="button"
            disabled={busy}
            onClick={remove}
            className="inline-flex min-h-11 items-center rounded-full border border-zinc-300 px-5 font-medium hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            {t("remove")}
          </button>
        )}
        <button
          type="button"
          onClick={close}
          className="inline-flex min-h-11 items-center rounded-full px-4 font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
