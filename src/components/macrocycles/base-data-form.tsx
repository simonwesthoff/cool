"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type {
  Macrocycle,
  MacrocycleBaseData,
} from "@/domain/macrocycles/macrocycle-types";
import { FocusPointsField } from "./focus-points-field";
import { SchedulePicker } from "./schedule-picker";
import {
  BACK_BUTTON,
  PRIMARY_BUTTON,
  StepperActions,
} from "../stepper-actions";
import { usePendingSave } from "./pending-save";

type FieldName = Exclude<
  keyof MacrocycleBaseData,
  "focusPoints" | "sessions" | "trainingFrequency"
>;
type FieldErrors = Partial<Record<string, string[]>>;

const errorCodes = [
  "REQUIRED",
  "OUT_OF_RANGE",
  "NOT_INTEGER",
  "NOT_MONDAY",
  "BEFORE_START",
  "INVALID_FORMAT",
  "TOO_LONG",
  "TOO_MANY",
  "WEEKS_PLANNED",
] as const;
type ErrorCode = (typeof errorCodes)[number];

const numberFields: FieldName[] = [
  "durationWeeks",
  "entryValuePct",
  "snatchBestKg",
  "cleanAndJerkBestKg",
  "snatchGoalKg",
  "cleanAndJerkGoalKg",
  "bodyWeightKg",
  "targetBodyWeightKg",
  "bodyFatPct",
  "muscleMassPct",
];
const optionalFields: FieldName[] = ["bodyFatPct", "muscleMassPct"];

/** Saving starts this long (ms) after the last change. */
const AUTOSAVE_DELAY = 600;
type SaveStatus = "idle" | "saving" | "saved" | "invalid" | "failed";

/** The base data a new macrocycle needs before it can be created. */
const requiredBaseFields: FieldName[] = [
  "snatchBestKg",
  "cleanAndJerkBestKg",
  "bodyWeightKg",
  "startDate",
  "durationWeeks",
  "competitionDate",
  "competitionType",
  "entryValuePct",
  "snatchGoalKg",
  "cleanAndJerkGoalKg",
  "targetBodyWeightKg",
];
function requiredFilled(values: Record<string, unknown>) {
  return (
    requiredBaseFields.every((f) => values[f] !== undefined) &&
    Array.isArray(values.sessions) &&
    values.sessions.length > 0
  );
}
/** The errors without those of the given fields (and their items). */
function withoutFields(errors: FieldErrors, fields: string[]): FieldErrors {
  return Object.fromEntries(
    Object.entries(errors).filter(
      ([key]) => !fields.includes(key.split(".")[0]!),
    ),
  );
}

function valuesOf(form: HTMLFormElement): Record<string, unknown> {
  const data = new FormData(form);
  const result: Record<string, unknown> = {};
  // Ordered focus points (SWOT step only); empty entries are left out.
  if (form.querySelector('[name="focusPoints"]')) {
    result.focusPoints = data
      .getAll("focusPoints")
      .map((v) => String(v).trim())
      .filter((v) => v !== "");
  }
  // Weekly schedule (base data step only): "weekday.slot" per session.
  if (form.querySelector("[data-schedule]")) {
    result.sessions = data.getAll("sessions").map((v) => {
      const [weekday, slot] = String(v).split(".").map(Number);
      return { weekday, slot };
    });
  }
  for (const [key, raw] of data.entries()) {
    if (key === "focusPoints" || key === "sessions") continue;
    const text = String(raw).trim();
    const name = key as FieldName;
    if (numberFields.includes(name)) {
      const parsed = Number(text.replace(",", "."));
      result[name] =
        text === ""
          ? optionalFields.includes(name)
            ? null
            : undefined
          : Number.isNaN(parsed)
            ? text
            : parsed;
    } else {
      result[name] = text === "" ? undefined : text;
    }
  }
  return result;
}

type Props = {
  athleteId: string;
  /** Step 1 (base data) or step 2 (SWOT). */
  part: "base" | "swot";
  /** Base data of the existing macrocycle; undefined for a new one. */
  macrocycle?: MacrocycleBaseData;
  /** Default start date for a new macrocycle (the next Monday). */
  defaultStartDate: string;
  /** The macrocycle as stored after each successful save. */
  onSaved: (macrocycle: Macrocycle) => void;
  /** "Continue" once the step is complete: the planning opens the next step. */
  onContinue: () => void;
  /** "Back to base data" (SWOT step only). */
  onBack?: () => void;
};

/** Planning steps 1 (base data) and 2 (SWOT) of a macrocycle. */
export function BaseDataForm(props: Props) {
  const { bfcacheId } = useRouter();
  return <BaseDataFormFields key={bfcacheId} {...props} />;
}

function BaseDataFormFields({
  athleteId,
  part,
  macrocycle,
  defaultStartDate,
  onSaved,
  onContinue,
  onBack,
}: Props) {
  const t = useTranslations("Macrocycle.baseData");
  const formId = useId();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const form = useRef<HTMLFormElement>(null);
  // The form's values as stored; null for a new macrocycle until created.
  const stored = useRef<Record<string, unknown> | null>(null);
  const exists = useRef(macrocycle !== undefined);
  // The values a moment after the last change, for a save after unmount.
  const lastValues = useRef<Record<string, unknown> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queue = useRef<Promise<boolean>>(Promise.resolve(true));
  const api = `/api/athletes/${athleteId}/macrocycle`;
  useEffect(() => {
    if (form.current && exists.current) stored.current = valuesOf(form.current);
  }, []);

  const current = () =>
    form.current ? valuesOf(form.current) : lastValues.current;

  /** Sends a body; the stored macrocycle, or the field errors. */
  async function send(
    body: Record<string, unknown>,
  ): Promise<
    | { ok: true; saved: Macrocycle | null }
    | { ok: false; fields: FieldErrors | null }
  > {
    const response = await fetch(part === "swot" ? `${api}/swot` : api, {
      method: part === "swot" ? "PUT" : exists.current ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      // Also sent when the tab is closed right after a change.
      keepalive: true,
    }).catch(() => null);
    if (response?.ok) {
      const saved = (await response
        .json()
        .catch(() => null)) as Macrocycle | null;
      return { ok: true, saved };
    }
    const result = (await response?.json().catch(() => null)) as {
      error?: { code?: string; fields?: FieldErrors };
    } | null;
    return {
      ok: false,
      fields:
        result?.error?.code === "VALIDATION_FAILED"
          ? (result.error.fields ?? {})
          : null,
    };
  }

  /** Records a successful save of `body`. */
  function markStored(body: Record<string, unknown>, saved: Macrocycle | null) {
    exists.current = true;
    stored.current = { ...(stored.current ?? {}), ...body };
    setErrors((all) => withoutFields(all, Object.keys(body)));
    if (saved) onSaved(saved);
  }

  /**
   * Saves the changed fields that are filled in. Fields the server rejects
   * are marked and left out, and the rest is sent once more. A new
   * macrocycle is only created once all required base data are filled.
   */
  async function saveChanges(): Promise<boolean> {
    const values = current();
    if (!values) return true;
    let body: Record<string, unknown>;
    if (!exists.current) {
      if (part !== "base" || !requiredFilled(values)) return true;
      body = values;
    } else {
      body = Object.fromEntries(
        Object.entries(values).filter(
          ([key, value]) =>
            value !== undefined &&
            !(
              Array.isArray(value) &&
              value.length === 0 &&
              key === "focusPoints"
            ) &&
            JSON.stringify(value) !== JSON.stringify(stored.current?.[key]),
        ),
      );
    }
    if (Object.keys(body).length === 0) return true;
    setStatus("saving");
    // Whether a field was left out: then the status asks to check it.
    let rejectedSome = false;
    for (;;) {
      const result = await send(body);
      if (result.ok) {
        markStored(body, result.saved);
        setStatus(rejectedSome ? "invalid" : "saved");
        return !rejectedSome;
      }
      if (!result.fields) {
        setStatus("failed");
        return false;
      }
      const fields = result.fields;
      setErrors((all) => ({
        ...withoutFields(all, Object.keys(body)),
        ...fields,
      }));
      const rejected = new Set(Object.keys(fields).map((k) => k.split(".")[0]));
      const rest = Object.fromEntries(
        Object.entries(body).filter(([key]) => !rejected.has(key)),
      );
      // A new macrocycle needs all fields; otherwise retry with the rest.
      const size = Object.keys(rest).length;
      if (!exists.current || size === 0 || size === Object.keys(body).length) {
        setStatus("invalid");
        return false;
      }
      body = rest;
      rejectedSome = true;
    }
  }

  /** Sends the pending changes now; one save after the other. */
  function flush(): Promise<boolean> {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const run = queue.current.then(saveChanges, saveChanges);
    queue.current = run;
    return run;
  }

  /** Saves shortly after the last change. */
  function scheduleSave() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), AUTOSAVE_DELAY);
    // After React applied the change (e.g. a session added by a button).
    setTimeout(() => {
      if (form.current) lastValues.current = valuesOf(form.current);
    }, 0);
  }

  // Leaving the step or the page sends what is still waiting.
  usePendingSave(flush);
  useEffect(
    () => () => {
      if (timer.current) void flush();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /**
   * "Continue": saves what is left, then checks that the step is
   * complete; with missing or invalid fields the step stays open.
   */
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.current) return;
    setPending(true);
    setFormError(null);
    await flush();
    const values = valuesOf(form.current);
    // The SWOT sends empty fields too, so the server names them.
    const body =
      part === "swot"
        ? Object.fromEntries(
            Object.entries(values).map(([k, v]) => [k, v ?? ""]),
          )
        : values;
    const result = await send(body);
    setPending(false);
    if (result.ok) {
      markStored(body, result.saved);
      setErrors({});
      onContinue();
      return;
    }
    if (result.fields) {
      setErrors(result.fields);
      setFormError(t("checkFields"));
    } else {
      setFormError(t("saveFailed"));
    }
  }

  const message = (code: string) =>
    (errorCodes as readonly string[]).includes(code)
      ? t(`errors.${code as ErrorCode}`)
      : t("errors.INVALID");

  /** The weekly schedule across both columns, with its own error texts. */
  function schedule() {
    const id = `${formId}-sessions`;
    const codes = Object.entries(errors)
      .filter(([key]) => key === "sessions" || key.startsWith("sessions."))
      .flatMap(([, list]) => list ?? []);
    const errorId = codes.length ? `${id}-error` : undefined;
    const text = (code: string) =>
      code === "REQUIRED"
        ? t("schedule.required")
        : code === "TOO_MANY"
          ? t("schedule.tooMany")
          : t("errors.INVALID");
    return (
      <div className="flex flex-col gap-1 sm:col-span-2">
        <span id={`${id}-label`} className="text-sm font-medium">
          {t("fields.sessions")}
        </span>
        <SchedulePicker
          id={id}
          labelledBy={`${id}-label`}
          initial={m?.sessions ?? []}
          errorId={errorId}
          invalid={codes.length > 0}
        />
        {errorId && (
          <p id={errorId} className="text-sm text-red-700 dark:text-red-400">
            {[...new Set(codes.map(text))].join(" ")}
          </p>
        )}
      </div>
    );
  }

  function field(
    name: FieldName,
    input: (props: {
      id: string;
      name: string;
      "aria-invalid": boolean;
      "aria-describedby"?: string;
    }) => ReactNode,
    options: { optional?: boolean; hint?: string } = {},
  ) {
    const id = `${formId}-${name}`;
    const fieldErrors = errors[name] ?? [];
    const errorId = fieldErrors.length ? `${id}-error` : undefined;
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium">
          {t(`fields.${name}`)}
          {options.optional && (
            <span className="font-normal text-zinc-500"> {t("optional")}</span>
          )}
        </label>
        {input({
          id,
          name,
          "aria-invalid": fieldErrors.length > 0,
          "aria-describedby": errorId,
        })}
        {options.hint && !errorId && (
          <p className="text-xs text-zinc-500">{options.hint}</p>
        )}
        {errorId && (
          <p id={errorId} className="text-sm text-red-700 dark:text-red-400">
            {fieldErrors.map(message).join(" ")}
          </p>
        )}
      </div>
    );
  }

  const inputClass =
    "min-h-11 w-full rounded-lg border border-zinc-300 bg-transparent px-3 aria-invalid:border-red-600 dark:border-zinc-700";
  const num = (
    name: FieldName,
    step: string,
    value: number | null | undefined,
  ) =>
    field(
      name,
      (p) => (
        <input
          {...p}
          type="number"
          inputMode="decimal"
          step={step}
          defaultValue={value ?? ""}
          className={inputClass}
        />
      ),
      { optional: optionalFields.includes(name) },
    );
  const section = (title: string, children: ReactNode) => (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-1 text-lg font-semibold">{title}</legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
  const m = macrocycle;

  return (
    <form
      ref={form}
      onSubmit={submit}
      onChange={scheduleSave}
      onClick={(event) => {
        // Buttons inside fields (sessions, focus points) change values too.
        if ((event.target as HTMLElement).closest('button[type="button"]'))
          scheduleSave();
      }}
      noValidate
      className="flex flex-col gap-8"
    >
      {formError && (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
        >
          {formError}
        </p>
      )}
      {part === "base" ? (
        <>
          {section(
            t("sections.history"),
            <>
              {num("snatchBestKg", "0.5", m?.snatchBestKg)}
              {num("cleanAndJerkBestKg", "0.5", m?.cleanAndJerkBestKg)}
              {num("bodyWeightKg", "0.1", m?.bodyWeightKg)}
              {num("bodyFatPct", "0.1", m?.bodyFatPct)}
              {num("muscleMassPct", "0.1", m?.muscleMassPct)}
            </>,
          )}
          {section(
            t("sections.plan"),
            <>
              {field(
                "startDate",
                (p) => (
                  <input
                    {...p}
                    type="date"
                    defaultValue={m?.startDate ?? defaultStartDate}
                    className={inputClass}
                  />
                ),
                { hint: t("mondayHint") },
              )}
              {field(
                "durationWeeks",
                (p) => (
                  <input
                    {...p}
                    type="number"
                    inputMode="numeric"
                    min={7}
                    max={52}
                    step={1}
                    defaultValue={m?.durationWeeks ?? ""}
                    className={inputClass}
                  />
                ),
                { hint: t("durationHint") },
              )}
              {field("competitionDate", (p) => (
                <input
                  {...p}
                  type="date"
                  defaultValue={m?.competitionDate ?? ""}
                  className={inputClass}
                />
              ))}
              {field("competitionType", (p) => (
                <input
                  {...p}
                  type="text"
                  maxLength={200}
                  defaultValue={m?.competitionType ?? ""}
                  className={inputClass}
                />
              ))}
              {field(
                "entryValuePct",
                (p) => (
                  <input
                    {...p}
                    type="number"
                    inputMode="decimal"
                    min={30}
                    max={95}
                    step={0.5}
                    defaultValue={m?.entryValuePct ?? 60}
                    className={inputClass}
                  />
                ),
                { hint: t("entryValueHint") },
              )}
              {num("snatchGoalKg", "0.5", m?.snatchGoalKg)}
              {num("cleanAndJerkGoalKg", "0.5", m?.cleanAndJerkGoalKg)}
              {num("targetBodyWeightKg", "0.1", m?.targetBodyWeightKg)}
              {schedule()}
            </>,
          )}
        </>
      ) : (
        <>
          {field("strengths", (p) => (
            <textarea
              {...p}
              rows={3}
              maxLength={2000}
              defaultValue={m?.strengths ?? ""}
              className={`${inputClass} py-2`}
            />
          ))}
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-1 text-lg font-semibold">
              {t("sections.deficits")}
            </legend>
            <p className="-mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {t("deficitsHint")}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {field("snatchDeficits", (p) => (
                <textarea
                  {...p}
                  rows={2}
                  maxLength={2000}
                  defaultValue={m?.snatchDeficits ?? ""}
                  className={`${inputClass} py-2`}
                />
              ))}
              {field("cleanDeficits", (p) => (
                <textarea
                  {...p}
                  rows={2}
                  maxLength={2000}
                  defaultValue={m?.cleanDeficits ?? ""}
                  className={`${inputClass} py-2`}
                />
              ))}
              {field("jerkDeficits", (p) => (
                <textarea
                  {...p}
                  rows={2}
                  maxLength={2000}
                  defaultValue={m?.jerkDeficits ?? ""}
                  className={`${inputClass} py-2`}
                />
              ))}
              {field("otherDeficits", (p) => (
                <textarea
                  {...p}
                  rows={2}
                  maxLength={2000}
                  defaultValue={m?.otherDeficits ?? ""}
                  className={`${inputClass} py-2`}
                />
              ))}
            </div>
          </fieldset>
          {field("experience", (p) => (
            <textarea
              {...p}
              rows={3}
              maxLength={2000}
              defaultValue={m?.experience ?? ""}
              className={`${inputClass} py-2`}
            />
          ))}
          <FocusPointsField
            initial={m?.focusPoints ?? []}
            errors={errors.focusPoints ?? []}
            itemErrors={Object.fromEntries(
              Object.entries(errors)
                .filter(([key]) => key.startsWith("focusPoints."))
                .map(([key, codes]) => [
                  Number(key.split(".")[1]),
                  codes ?? [],
                ]),
            )}
            message={message}
          />
          {field("injuriesAndIllnesses", (p) => (
            <textarea
              {...p}
              rows={3}
              maxLength={2000}
              defaultValue={m?.injuriesAndIllnesses ?? ""}
              className={`${inputClass} py-2`}
            />
          ))}
        </>
      )}
      <StepperActions
        back={
          onBack && (
            <button type="button" onClick={onBack} className={BACK_BUTTON}>
              {t("back")}
            </button>
          )
        }
        status={
          status !== "idle" && (
            <>
              <p
                role={
                  status === "saved" || status === "saving" ? "status" : "alert"
                }
                data-save-status={status}
                className={`text-sm ${
                  status === "failed" || status === "invalid"
                    ? "text-red-700 dark:text-red-400"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {t(`status.${status}`)}
              </p>
              {status === "failed" && (
                <button
                  type="button"
                  onClick={() => void flush()}
                  className={BACK_BUTTON}
                >
                  {t("retry")}
                </button>
              )}
            </>
          )
        }
        next={
          <button type="submit" disabled={pending} className={PRIMARY_BUTTON}>
            {part === "swot" ? t("continueToCurve") : t("continue")}
          </button>
        }
      />
    </form>
  );
}
