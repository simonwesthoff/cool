"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { InvitationInfo } from "@/domain/invitations/invitations";

type Props = {
  token: string;
  /** null: the invitation does not exist. */
  info: InvitationInfo | null;
  /** The user is already linked to an athlete. */
  alreadyLinked: boolean;
};

type Problem = "unknown" | "expired" | "used" | "alreadyLinked" | "failed";

const problemByCode: Record<string, Problem> = {
  INVITATION_NOT_FOUND: "unknown",
  INVITATION_EXPIRED: "expired",
  INVITATION_USED: "used",
  ALREADY_LINKED: "alreadyLinked",
  ATHLETE_ALREADY_LINKED: "used",
};

function initialProblem(
  info: InvitationInfo | null,
  alreadyLinked: boolean,
): Problem | null {
  if (!info) return "unknown";
  if (info.status !== "valid") return info.status;
  return alreadyLinked ? "alreadyLinked" : null;
}

/** Invitation page: shows the invitation and lets the user accept it. */
export function AcceptInvitation({ token, info, alreadyLinked }: Props) {
  const t = useTranslations("InvitationPage");
  const router = useRouter();
  const [problem, setProblem] = useState<Problem | null>(() =>
    initialProblem(info, alreadyLinked),
  );
  const [pending, setPending] = useState(false);

  async function accept() {
    setPending(true);
    const response = await fetch(`/api/invitations/${token}/accept`, {
      method: "POST",
    }).catch(() => null);
    if (response?.ok) {
      router.push("/training");
      router.refresh();
      return;
    }
    const body = (await response?.json().catch(() => null)) as {
      error?: { code?: string };
    } | null;
    setProblem(problemByCode[body?.error?.code ?? ""] ?? "failed");
    setPending(false);
  }

  return (
    <section className="mx-auto flex w-full max-w-sm flex-col gap-4 pt-12">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      {info && (
        <p className="text-lg">
          {t("invites", { coach: info.coachName, athlete: info.athleteName })}
        </p>
      )}
      {problem ? (
        <>
          <p
            role="alert"
            className="rounded-lg border border-zinc-300 px-4 py-3 dark:border-zinc-700"
          >
            {t(`problems.${problem}`)}
          </p>
          <Link href="/" className="font-medium underline underline-offset-4">
            {t("home")}
          </Link>
        </>
      ) : (
        <button
          type="button"
          onClick={accept}
          disabled={pending}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-zinc-900 px-6 font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {t("accept")}
        </button>
      )}
    </section>
  );
}
