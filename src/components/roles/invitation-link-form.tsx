"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";

/**
 * Returns the invitation page path for a pasted invitation link of this app
 * (same origin, path `/invite/<token>`), or null.
 */
export function invitationPathFromLink(
  value: string,
  origin: string,
): string | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.origin !== origin) return null;
  return /^\/invite\/[A-Za-z0-9_-]{43}$/.test(url.pathname)
    ? url.pathname
    : null;
}

/** "Start as Athlete": asks for the invitation link from the coach. */
export function InvitationLinkForm() {
  const t = useTranslations("StartAthlete");
  const router = useRouter();
  const id = useId();
  const [invalid, setInvalid] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("link") ?? "");
    const path = invitationPathFromLink(value, window.location.origin);
    setInvalid(path === null);
    if (path) router.push(path);
  }

  return (
    <form onSubmit={submit} noValidate className="flex w-full flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-zinc-600 dark:text-zinc-400">{t("text")}</p>
      <label htmlFor={id} className="text-sm font-medium">
        {t("label")}
      </label>
      <input
        id={id}
        name="link"
        type="url"
        autoComplete="off"
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined}
        className="min-h-11 rounded-lg border border-zinc-300 bg-transparent px-3 aria-invalid:border-red-600 dark:border-zinc-700"
      />
      {invalid && (
        <p
          id={`${id}-error`}
          className="text-sm text-red-700 dark:text-red-400"
        >
          {t("invalid")}
        </p>
      )}
      <button
        type="submit"
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-zinc-900 px-6 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {t("continue")}
      </button>
    </form>
  );
}
