"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { localized, type Exercise } from "@/domain/exercises/catalog-types";
import type {
  MacrocycleBaseData,
  MesocycleExercise,
  MesocycleType,
} from "@/domain/macrocycles/macrocycle-types";

export type ChoiceTarget = {
  exercise: Exercise;
  type: MesocycleType;
  /** The current choice; null when the exercise is not chosen yet. */
  choice: MesocycleExercise | null;
};

export type Deficits = Pick<
  MacrocycleBaseData,
  "snatchDeficits" | "cleanDeficits" | "jerkDeficits" | "otherDeficits"
>;

export type ChoiceInput = {
  tags: string[];
  note: string | null;
  variation: string | null;
};

type Props = {
  /** The cell being edited; null closes the dialog. */
  target: ChoiceTarget | null;
  deficits: Deficits;
  /** Resolves to false when saving failed. */
  onSave: (input: ChoiceInput) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
  onClose: () => void;
};

const NOTE_MAX = 500;
const PRESSED = "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900";
const UNPRESSED =
  "border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900";
const VARIATION_MAX = 200;

/** The deficits relevant for an exercise: those of its reference lift (none without one). */
export function relevantDeficits(
  exercise: Pick<Exercise, "referenceLift">,
): (keyof Deficits)[] {
  if (exercise.referenceLift === "snatch") return ["snatchDeficits"];
  if (exercise.referenceLift === "clean_and_jerk")
    return ["cleanDeficits", "jerkDeficits"];
  return [];
}

/** Dialog for one cell of the exercise table: reason (tags, own reason) and variation. */
export function ExerciseChoiceDialog({
  target,
  deficits,
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
      // The close event arrives after the dialog closed; if another cell was
      // opened in the meantime, the dialog is open again and stays open.
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}
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
          deficits={deficits}
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
  deficits,
  onSave,
  onRemove,
  close,
}: {
  target: ChoiceTarget;
  deficits: Deficits;
  onSave: Props["onSave"];
  onRemove: Props["onRemove"];
  close: () => void;
}) {
  const t = useTranslations("Macrocycle.exercises");
  const tm = useTranslations("Macrocycle.mesocycles");
  const tf = useTranslations("Macrocycle.baseData.fields");
  const tc = useTranslations("Catalog");
  const locale = useLocale();
  const variationId = useId();
  const reasonErrorId = useId();
  const reasonHintId = useId();
  const hintId = useId();
  const { exercise, type, choice } = target;
  const [tags, setTags] = useState<string[]>(choice?.tags ?? []);
  // The own reason (free text); edited in a field that "+" opens.
  const [note, setNote] = useState(choice?.note ?? "");
  const [editingNote, setEditingNote] = useState(false);
  const [variation, setVariation] = useState(choice?.variation ?? "");
  const [reasonError, setReasonError] = useState(false);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  // Title: number and name as one text, as in the catalog dialog.
  const title = `${exercise.number} ${localized(exercise.name, locale)}`;
  const subtitle = [
    tm(type),
    exercise.referenceLift
      ? tc(`liftExercise.${exercise.referenceLift}`)
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  function toggle(key: string) {
    setReasonError(false);
    setTags((current) =>
      current.includes(key)
        ? current.filter((k) => k !== key)
        : // Keep the catalog order of the exercise's points.
          exercise.addresses
            .map((a) => a.key)
            .filter((k) => k === key || current.includes(k)),
    );
  }

  function finishNote() {
    setNote((current) => current.trim());
    setEditingNote(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (tags.length === 0 && note.trim().length === 0) {
      setReasonError(true);
      return;
    }
    setFailed(false);
    setBusy(true);
    const ok = await onSave({
      tags,
      note: note.trim() || null,
      variation: variation.trim() || null,
    });
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
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
      </div>
      <div className="flex flex-col gap-5 p-4">
        {failed && (
          <p
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
          >
            {t("saveFailed")}
          </p>
        )}
        {relevantDeficits(exercise).length > 0 && (
          <dl className="flex flex-col gap-3 rounded-xl bg-zinc-100 p-3 text-sm dark:bg-zinc-900">
            {relevantDeficits(exercise).map((key) => (
              <div
                key={key}
                data-deficit={key}
                className="flex flex-col gap-0.5"
              >
                <dt className="font-semibold">{tf(key)}</dt>
                <dd
                  className={
                    deficits[key]
                      ? "whitespace-pre-line"
                      : "text-zinc-500 italic"
                  }
                >
                  {deficits[key] || t("notEntered")}
                </dd>
              </div>
            ))}
          </dl>
        )}
        <fieldset
          className="flex flex-col gap-2"
          aria-describedby={
            reasonError ? `${reasonHintId} ${reasonErrorId}` : reasonHintId
          }
        >
          <legend className="text-sm font-medium">{t("reason")}</legend>
          <p id={reasonHintId} className="text-xs text-zinc-500">
            {exercise.addresses.length > 0
              ? t("reasonHint")
              : t("reasonHintNoTags")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {exercise.addresses.map((tag) => {
              const pressed = tags.includes(tag.key);
              return (
                <button
                  key={tag.key}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => toggle(tag.key)}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-left text-sm ${
                    pressed ? PRESSED : UNPRESSED
                  }`}
                >
                  {pressed && <CheckIcon />}
                  {localized(tag.name, locale)}
                </button>
              );
            })}
            {editingNote ? (
              <input
                // Opened by the user's tap on "+" or on the own reason.
                autoFocus
                value={note}
                maxLength={NOTE_MAX}
                aria-label={t("ownReason")}
                placeholder={t("ownReasonPlaceholder")}
                aria-invalid={reasonError ? true : undefined}
                onChange={(event) => {
                  setReasonError(false);
                  setNote(event.target.value);
                }}
                onBlur={finishNote}
                onKeyDown={(event) => {
                  // Enter confirms the own reason instead of saving the dialog.
                  if (event.key === "Enter") {
                    event.preventDefault();
                    finishNote();
                  }
                }}
                className="min-h-9 min-w-0 flex-1 basis-48 rounded-full border border-zinc-400 bg-transparent px-3 text-sm dark:border-zinc-600"
              />
            ) : note ? (
              <button
                type="button"
                aria-pressed
                aria-label={t("ownReasonEdit", { reason: note })}
                onClick={() => setEditingNote(true)}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-left text-sm ${PRESSED}`}
              >
                <CheckIcon />
                <span className="break-words">{note}</span>
              </button>
            ) : (
              <button
                type="button"
                aria-label={t("ownReasonAdd")}
                onClick={() => {
                  setReasonError(false);
                  setEditingNote(true);
                }}
                className={`inline-flex size-9 items-center justify-center rounded-full ${UNPRESSED}`}
              >
                <PlusIcon />
              </button>
            )}
          </div>
          {reasonError && (
            <p
              id={reasonErrorId}
              className="text-sm text-red-700 dark:text-red-400"
            >
              {t("reasonRequired")}
            </p>
          )}
        </fieldset>
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

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8.5 6.5 12 13 4.5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}
