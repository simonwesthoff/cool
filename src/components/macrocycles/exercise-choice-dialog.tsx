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
  /** For a new choice: the same exercise in another block, to start from. */
  prefill?: MesocycleExercise | null;
};

export type Deficits = Pick<
  MacrocycleBaseData,
  "snatchDeficits" | "cleanDeficits" | "jerkDeficits" | "otherDeficits"
>;

export type ChoiceInput = {
  tags: string[];
  ownReasons: string[];
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

const OWN_REASON_MAX = 200;
const OWN_REASONS_MAX = 10;
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
  const hintId = useId();
  const { exercise, type, choice } = target;
  const start = choice ?? target.prefill ?? null;
  const [tags, setTags] = useState<string[]>(start?.tags ?? []);
  const [ownReasons, setOwnReasons] = useState<string[]>(
    start?.ownReasons ?? [],
  );
  // Text of the own reason field that "+" opens; null while it is closed.
  const [draft, setDraft] = useState<string | null>(null);
  const [variation, setVariation] = useState(start?.variation ?? "");
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

  /** Own reasons with new texts added (trimmed, no empty ones or duplicates). */
  function withOwnReasons(current: string[], texts: string[]): string[] {
    const next = [...current];
    for (const text of texts.map((t) => t.trim())) {
      if (text && !next.includes(text) && next.length < OWN_REASONS_MAX)
        next.push(text);
    }
    return next;
  }

  /** A comma adds the text before it and keeps the field open for the next one. */
  function changeDraft(value: string) {
    setReasonError(false);
    const parts = value.split(",");
    const rest = parts.pop()!;
    if (parts.length > 0)
      setOwnReasons((current) => withOwnReasons(current, parts));
    setDraft(rest);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    // Text still in the field counts as an own reason.
    const reasons = withOwnReasons(ownReasons, [draft ?? ""]);
    if (tags.length === 0 && reasons.length === 0) {
      setReasonError(true);
      return;
    }
    setOwnReasons(reasons);
    setDraft(null);
    setFailed(false);
    setBusy(true);
    const ok = await onSave({
      tags,
      ownReasons: reasons,
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
          aria-describedby={reasonError ? reasonErrorId : undefined}
        >
          <legend className="text-sm font-medium">{t("reason")}</legend>
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
            {ownReasons.map((reason) => (
              <span
                key={reason}
                data-own-reason={reason}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-full pr-1 pl-3 text-sm ${PRESSED}`}
              >
                <CheckIcon />
                <span className="break-words">{reason}</span>
                <button
                  type="button"
                  aria-label={t("ownReasonRemove", { reason })}
                  onClick={() =>
                    setOwnReasons((current) =>
                      current.filter((r) => r !== reason),
                    )
                  }
                  className="inline-flex size-7 items-center justify-center rounded-full hover:bg-white/20 dark:hover:bg-black/10"
                >
                  <CrossIcon />
                </button>
              </span>
            ))}
            {draft !== null ? (
              <span className="inline-flex min-w-0 flex-1 basis-56 items-center gap-1">
                <input
                  // Opened by the user's tap on "+".
                  autoFocus
                  value={draft}
                  maxLength={OWN_REASON_MAX}
                  aria-label={t("ownReason")}
                  placeholder={t("ownReasonPlaceholder")}
                  aria-invalid={reasonError ? true : undefined}
                  onChange={(event) => changeDraft(event.target.value)}
                  onKeyDown={(event) => {
                    // Enter adds the reason instead of saving the dialog.
                    if (event.key === "Enter") {
                      event.preventDefault();
                      setOwnReasons((current) =>
                        withOwnReasons(current, [draft]),
                      );
                      setDraft(null);
                    } else if (event.key === "Escape") {
                      // Escape cancels the field, not the whole dialog.
                      event.preventDefault();
                      setDraft(null);
                    }
                  }}
                  className="min-h-9 min-w-0 flex-1 rounded-full border border-zinc-400 bg-transparent px-3 text-sm dark:border-zinc-600"
                />
                <button
                  type="button"
                  aria-label={t("ownReasonCancel")}
                  onClick={() => setDraft(null)}
                  className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full ${UNPRESSED}`}
                >
                  <CrossIcon />
                </button>
              </span>
            ) : (
              ownReasons.length < OWN_REASONS_MAX && (
                <button
                  type="button"
                  aria-label={t("ownReasonAdd")}
                  onClick={() => {
                    setReasonError(false);
                    setDraft("");
                  }}
                  className={`inline-flex size-9 items-center justify-center rounded-full ${UNPRESSED}`}
                >
                  <PlusIcon />
                </button>
              )
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

function CrossIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}
