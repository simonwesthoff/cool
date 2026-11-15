"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { genders, today, type Athlete } from "@/domain/athletes/basic-data";

/** Field error codes the API can return, with a message each. */
const knownCodes = [
  "REQUIRED",
  "TOO_LONG",
  "IN_FUTURE",
  "BEFORE_DATE_OF_BIRTH",
  "OUT_OF_RANGE",
  "NOT_INTEGER",
  "INVALID_FORMAT",
] as const;
type KnownCode = (typeof knownCodes)[number];

type FieldName =
  "name" | "dateOfBirth" | "gender" | "careerStartDate" | "heightCm";
type FieldErrors = Partial<Record<string, string[]>>;

type Props = { athlete?: Athlete };

function formValues(form: HTMLFormElement) {
  const data = new FormData(form);
  const text = (key: FieldName) => String(data.get(key) ?? "").trim();
  const height = text("heightCm");
  return {
    name: text("name"),
    dateOfBirth: text("dateOfBirth") || null,
    gender: text("gender") || null,
    careerStartDate: text("careerStartDate") || null,
    heightCm:
      height === ""
        ? null
        : Number.isNaN(Number(height))
          ? height
          : Number(height),
  };
}

/**
 * Form to add an athlete or edit their basic data, sent to the API.
 *
 * Next.js keeps visited pages alive and restores their state. Keying the
 * form by `bfcacheId` makes every link or button navigation start with a
 * fresh form showing the stored data, while browser back/forward still
 * restores what was typed.
 */
export function AthleteForm({ athlete }: Props) {
  const { bfcacheId } = useRouter();
  return <AthleteFormFields key={bfcacheId} athlete={athlete} />;
}

function AthleteFormFields({ athlete }: Props) {
  const t = useTranslations("AthleteForm");
  const router = useRouter();
  const formId = useId();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function message(code: string): string {
    return (knownCodes as readonly string[]).includes(code)
      ? t(`errors.${code as KnownCode}`)
      : t("errors.INVALID");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setErrors({});
    setFormError(null);
    const values = formValues(form);
    // New athletes: send only what was entered. Edits: null clears a value.
    const body = athlete
      ? values
      : Object.fromEntries(
          Object.entries(values).filter(([, v]) => v !== null),
        );
    try {
      const response = await fetch(
        athlete ? `/api/athletes/${athlete.id}` : "/api/athletes",
        {
          method: athlete ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (response.ok) {
        // Leave nothing behind for a restored page (e.g. browser back).
        if (!athlete) form.reset();
        setPending(false);
        router.push("/");
        router.refresh();
        return;
      }
      const result = (await response.json().catch(() => null)) as {
        error?: { code?: string; fields?: FieldErrors };
      } | null;
      if (result?.error?.code === "VALIDATION_FAILED" && result.error.fields) {
        setErrors(result.error.fields);
      } else if (response.status === 404) {
        setFormError(t("notFound"));
      } else {
        setFormError(t("saveFailed"));
      }
    } catch {
      setFormError(t("saveFailed"));
    }
    setPending(false);
  }

  function field(
    name: FieldName,
    label: string,
    input: (props: {
      id: string;
      name: FieldName;
      "aria-invalid": boolean;
      "aria-describedby"?: string;
    }) => ReactNode,
  ) {
    const id = `${formId}-${name}`;
    const fieldErrors = errors[name] ?? [];
    const errorId = fieldErrors.length > 0 ? `${id}-error` : undefined;
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {input({
          id,
          name,
          "aria-invalid": fieldErrors.length > 0,
          "aria-describedby": errorId,
        })}
        {errorId && (
          <p id={errorId} className="text-sm text-red-700 dark:text-red-400">
            {fieldErrors.map(message).join(" ")}
          </p>
        )}
      </div>
    );
  }

  const inputClass =
    "min-h-11 rounded-lg border border-zinc-300 bg-transparent px-3 aria-invalid:border-red-600 dark:border-zinc-700";

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">
        {athlete ? t("editTitle") : t("newTitle")}
      </h1>
      {formError && (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
        >
          {formError}
        </p>
      )}
      {field("name", t("name"), (props) => (
        <input
          {...props}
          type="text"
          autoComplete="off"
          maxLength={100}
          defaultValue={athlete?.name ?? ""}
          className={inputClass}
        />
      ))}
      {field("dateOfBirth", t("dateOfBirth"), (props) => (
        <input
          {...props}
          type="date"
          max={today()}
          defaultValue={athlete?.dateOfBirth ?? ""}
          className={inputClass}
        />
      ))}
      {field("gender", t("gender"), (props) => (
        <select
          {...props}
          defaultValue={athlete?.gender ?? ""}
          className={inputClass}
        >
          <option value="">{t("notSpecified")}</option>
          {genders.map((gender) => (
            <option key={gender} value={gender}>
              {t(`genders.${gender}`)}
            </option>
          ))}
        </select>
      ))}
      {field("careerStartDate", t("careerStartDate"), (props) => (
        <input
          {...props}
          type="date"
          max={today()}
          defaultValue={athlete?.careerStartDate ?? ""}
          className={inputClass}
        />
      ))}
      {field("heightCm", t("heightCm"), (props) => (
        <input
          {...props}
          type="number"
          inputMode="numeric"
          min={100}
          max={250}
          step={1}
          defaultValue={athlete?.heightCm ?? ""}
          className={inputClass}
        />
      ))}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center rounded-full bg-zinc-900 px-6 font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {t("save")}
        </button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-full px-4 font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          {t("cancel")}
        </Link>
      </div>
    </form>
  );
}
