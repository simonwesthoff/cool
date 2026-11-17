"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const primary =
  "inline-flex min-h-12 w-full items-center justify-center rounded-full bg-zinc-900 px-6 font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";
const secondary =
  "inline-flex min-h-12 w-full items-center justify-center rounded-full border border-zinc-300 px-6 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900";

/** Start page for users without a role. */
export function StartChoice() {
  const t = useTranslations("Start");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function startAsCoach() {
    setPending(true);
    setFailed(false);
    const response = await fetch("/api/team", { method: "POST" }).catch(
      () => null,
    );
    setPending(false);
    if (response?.ok) router.refresh();
    else setFailed(true);
  }

  return (
    <section className="flex w-full flex-col gap-4 pt-12">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-zinc-600 dark:text-zinc-400">{t("text")}</p>
      {failed && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {t("failed")}
        </p>
      )}
      <button
        type="button"
        onClick={startAsCoach}
        disabled={pending}
        className={primary}
      >
        {t("asCoach")}
      </button>
      <Link href="/start/athlete" className={secondary}>
        {t("asAthlete")}
      </Link>
    </section>
  );
}
