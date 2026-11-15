"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LinkedAccount } from "@/domain/athletes/basic-data";
import { Avatar } from "../avatar";

/** Shows the user account a linked athlete uses (email and picture). */
export function LinkedAccountSection({
  name,
  account,
}: {
  name: string;
  account: LinkedAccount;
}) {
  const t = useTranslations("Invitation");
  return (
    <section className="flex flex-col gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
      <h2 className="font-semibold">{t("linkedTitle")}</h2>
      <div className="flex items-center gap-3">
        <Avatar
          name={name}
          image={account.image}
          alt={t("linkedPictureAlt", { name })}
          size={40}
        />
        <p className="min-w-0 truncate text-sm">{account.email}</p>
      </div>
    </section>
  );
}

/** "This is me": links the coach's own account to this athlete. */
export function ThisIsMeButton({ athleteId }: { athleteId: string }) {
  const t = useTranslations("Invitation");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function linkSelf() {
    setPending(true);
    setFailed(false);
    const response = await fetch(`/api/athletes/${athleteId}/link-self`, {
      method: "POST",
    }).catch(() => null);
    setPending(false);
    if (response?.ok) router.refresh();
    else setFailed(true);
  }

  return (
    <section className="flex flex-col gap-2 border-t border-zinc-200 pt-5 dark:border-zinc-800">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {t("thisIsMeText")}
      </p>
      {failed && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {t("failed")}
        </p>
      )}
      <div>
        <button
          type="button"
          onClick={linkSelf}
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-300 px-5 font-medium hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          {t("thisIsMe")}
        </button>
      </div>
    </section>
  );
}
