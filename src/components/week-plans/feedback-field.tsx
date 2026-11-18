"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

type Target = {
  athleteId: string;
  weekNumber: number;
  weekday: number;
  slot: number;
  exerciseNumber: number;
};

/**
 * The athlete's feedback on an exercise of a session, saved on its own
 * shortly after typing; one save at a time.
 */
export function FeedbackField({
  target,
  initial,
  label,
}: {
  target: Target;
  initial: string;
  /** Accessible name, e.g. "Feedback on 1 Snatch". */
  label: string;
}) {
  const t = useTranslations("WeekView.feedback");
  const [text, setText] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">(
    "idle",
  );
  const stored = useRef(initial);
  const latest = useRef(initial);
  const inFlight = useRef<Promise<void> | null>(null);
  const { athleteId, weekNumber, weekday, slot, exerciseNumber } = target;

  useEffect(() => {
    latest.current = text;
    if (text === stored.current) return;
    const timer = setTimeout(async () => {
      if (inFlight.current) await inFlight.current;
      // Save until what is stored is the latest text.
      while (latest.current !== stored.current) {
        const body = latest.current;
        setStatus("saving");
        const run = fetch(
          `/api/athletes/${athleteId}/macrocycle/weeks/${weekNumber}/plan/feedback`,
          {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              weekday,
              slot,
              exerciseNumber,
              feedback: body,
            }),
          },
        )
          .then((response) => response.ok)
          .catch(() => false);
        inFlight.current = run.then(() => undefined);
        const ok = await run;
        inFlight.current = null;
        if (!ok) {
          setStatus("failed");
          return;
        }
        stored.current = body;
      }
      setStatus("saved");
    }, 600);
    return () => clearTimeout(timer);
  }, [text, athleteId, weekNumber, weekday, slot, exerciseNumber]);

  return (
    <div className="relative h-full">
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={2}
        maxLength={500}
        aria-label={label}
        placeholder={t("placeholder")}
        className="block h-16 w-full resize-none bg-transparent px-1 py-1 outline-none focus:bg-zinc-100 dark:focus:bg-zinc-900"
      />
      {status !== "idle" && (
        <span
          role={status === "failed" ? "alert" : "status"}
          data-feedback-status={status}
          className={`pointer-events-none absolute right-1 bottom-0.5 text-[10px] ${
            status === "failed"
              ? "text-red-700 dark:text-red-400"
              : "text-zinc-500"
          }`}
        >
          {t(status)}
        </span>
      )}
    </div>
  );
}
