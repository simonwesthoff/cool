"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";

export type CreatedInvitation = { url: string; expiresAt: string };

const button =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-300 px-5 font-medium hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900";

/** Shows an invitation link with its expiry and a copy button. */
export function InvitationLink({
  invitation,
}: {
  invitation: CreatedInvitation;
}) {
  const t = useTranslations("Invitation");
  const format = useFormatter();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(invitation.url);
      setCopy("copied");
      return;
    } catch {
      // Clipboard access refused (e.g. permission); fall back below.
    }
    input.current?.select();
    // Deprecated, but still the only fallback where the Clipboard API fails.
    const copied = document.execCommand?.("copy") ?? false;
    setCopy(copied ? "copied" : "failed");
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {t("linkLabel")}
      </label>
      <input
        ref={input}
        id={id}
        readOnly
        value={invitation.url}
        onFocus={(event) => event.currentTarget.select()}
        className="min-h-11 rounded-lg border border-zinc-300 bg-zinc-50 px-3 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {t("expires", {
          date: format.dateTime(new Date(invitation.expiresAt), {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        })}
      </p>
      <div>
        <button type="button" onClick={copyLink} className={button}>
          {copy === "copied" ? t("copied") : t("copy")}
        </button>
      </div>
      {copy === "failed" && (
        <p role="status" className="text-sm text-zinc-600 dark:text-zinc-400">
          {t("copyFailed")}
        </p>
      )}
    </div>
  );
}

/**
 * "Invite" for an unlinked athlete: creates a new link on request. Keyed by
 * `bfcacheId`, so a revisited page does not show an old link.
 */
export function InvitationPanel({ athleteId }: { athleteId: string }) {
  const { bfcacheId } = useRouter();
  return <InvitationPanelContent key={bfcacheId} athleteId={athleteId} />;
}

function InvitationPanelContent({ athleteId }: { athleteId: string }) {
  const t = useTranslations("Invitation");
  const [invitation, setInvitation] = useState<CreatedInvitation | null>(null);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function invite() {
    setPending(true);
    setFailed(false);
    const created = await requestInvitation(athleteId);
    setPending(false);
    if (created) setInvitation(created);
    else setFailed(true);
  }

  return (
    <section className="flex flex-col gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
      <h2 className="font-semibold">{t("title")}</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("text")}</p>
      {invitation && <InvitationLink invitation={invitation} />}
      {failed && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {t("failed")}
        </p>
      )}
      <div>
        <button
          type="button"
          onClick={invite}
          disabled={pending}
          className={button}
        >
          {invitation ? t("newLink") : t("invite")}
        </button>
      </div>
    </section>
  );
}

/** Creates an invitation through the API; null on failure. */
export async function requestInvitation(
  athleteId: string,
): Promise<CreatedInvitation | null> {
  const response = await fetch(`/api/athletes/${athleteId}/invitations`, {
    method: "POST",
  }).catch(() => null);
  return response?.ok ? ((await response.json()) as CreatedInvitation) : null;
}
