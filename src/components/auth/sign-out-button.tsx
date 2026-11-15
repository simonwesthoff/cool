"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SIGN_IN_PATH } from "@/domain/auth/return-path";
import { authClient } from "./auth-client";

export function SignOutButton() {
  const t = useTranslations("Home");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await authClient.signOut();
    router.replace(SIGN_IN_PATH);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      className="min-h-11 rounded-full border border-zinc-300 px-5 font-medium hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900"
    >
      {t("signOut")}
    </button>
  );
}
