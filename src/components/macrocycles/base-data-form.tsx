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
import type { MacrocycleBaseData } from "@/domain/macrocycles/macrocycle-types";
import { FocusPointsField } from "./focus-points-field";
import { useUnsavedChangesGuard } from "./unsaved-changes";

type FieldName = Exclude<keyof MacrocycleBaseData, "focusPoints">;
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
  "trainingFrequency",
];
const optionalFields: FieldName[] = ["bodyFatPct", "muscleMassPct"];

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
  for (const [key, raw] of data.entries()) {
    if (key === "focusPoints") continue;
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
}: Props) {
  const t = useTranslations("Macrocycle.baseData");
  const router = useRouter();
  const formId = useId();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  // The values as stored, to tell whether the form has unsaved changes.
  const stored = useRef<string | null>(null);
  const snapshot = () =>
    form.current ? JSON.stringify(valuesOf(form.current)) : null;
  useEffect(() => {
    stored.current = snapshot();
  }, []);

  /** Saves the form; true on success, otherwise the errors are shown. */
  async function save(): Promise<boolean> {
    if (!form.current) return false;
    setPending(true);
    setErrors({});
    setFormError(null);
    const body = valuesOf(form.current);
    const api = `/api/athletes/${athleteId}/macrocycle`;
    const response = await fetch(part === "swot" ? `${api}/swot` : api, {
      method: part === "swot" ? "PUT" : macrocycle ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    setPending(false);
    if (response?.ok) {
      stored.current = snapshot();
      return true;
    }
    const result = (await response?.json().catch(() => null)) as {
      error?: { code?: string; fields?: FieldErrors };
    } | null;
    if (result?.error?.code === "VALIDATION_FAILED" && result.error.fields) {
      setErrors(result.error.fields);
      setFormError(t("checkFields"));
    } else {
      setFormError(t("saveFailed"));
    }
    return false;
  }

  // The stepper asks before leaving the step with unsaved changes.
  useUnsavedChangesGuard({
    isDirty: () => stored.current !== null && snapshot() !== stored.current,
    save,
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!(await save())) return;
    const next = part === "swot" ? "intensity" : "swot";
    router.push(`/athletes/${athleteId}/macrocycle/${next}`);
    router.refresh();
  }

  const message = (code: string) =>
    (errorCodes as readonly string[]).includes(code)
      ? t(`errors.${code as ErrorCode}`)
      : t("errors.INVALID");

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
              {field(
                "trainingFrequency",
                (p) => (
                  <input
                    {...p}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={14}
                    step={1}
                    defaultValue={m?.trainingFrequency ?? ""}
                    className={inputClass}
                  />
                ),
                { hint: t("trainingFrequencyHint") },
              )}
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
      <div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center rounded-full bg-zinc-900 px-6 font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {t("continue")}
        </button>
      </div>
    </form>
  );
}
