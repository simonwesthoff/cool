"use client";

import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { MacrocycleBaseData } from "@/domain/macrocycles/macrocycle-types";

/** A date (YYYY-MM-DD) plus some days. */
function addDays(isoDate: string, days: number): Date {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Items({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-0.5">
          <dt className="text-sm text-zinc-600 dark:text-zinc-400">{label}</dt>
          <dd className="tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Read-only summary of a macrocycle below the exercise chart: the focus
 * points and the new macrocycle plan.
 */
export function MacrocycleSummary({
  macrocycle: m,
}: {
  macrocycle: MacrocycleBaseData;
}) {
  const t = useTranslations("MacrocycleView.summary");
  const format = useFormatter();
  const date = (value: Date) =>
    format.dateTime(value, { dateStyle: "medium", timeZone: "UTC" });
  const kg = (value: number) => t("kg", { value: format.number(value) });
  const pct = (value: number) =>
    format.number(value / 100, { style: "percent", maximumFractionDigits: 1 });

  const plan: [string, string][] = [
    [
      t("period"),
      t("periodValue", {
        start: date(addDays(m.startDate, 0)),
        end: date(addDays(m.startDate, 7 * m.durationWeeks - 1)),
      }),
    ],
    [t("duration"), t("weeks", { count: m.durationWeeks })],
    [
      t("competition"),
      t("competitionValue", {
        type: m.competitionType,
        date: date(addDays(m.competitionDate, 0)),
      }),
    ],
    [t("entryValue"), pct(m.entryValuePct)],
    [t("snatchGoal"), kg(m.snatchGoalKg)],
    [t("cleanAndJerkGoal"), kg(m.cleanAndJerkGoalKg)],
    [t("targetBodyWeight"), kg(m.targetBodyWeightKg)],
    [t("trainingFrequency"), format.number(m.trainingFrequency)],
  ];

  return (
    <div className="flex flex-col gap-8">
      <Section title={t("focusPoints")}>
        {m.focusPoints.length > 0 ? (
          <ol className="flex flex-col gap-1">
            {m.focusPoints.map((point, i) => (
              <li key={i} className="flex gap-2">
                <span className="w-5 shrink-0 text-zinc-500 tabular-nums">
                  {t("position", { position: i + 1 })}
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-zinc-500 italic">{t("noFocusPoints")}</p>
        )}
      </Section>
      <Section title={t("plan")}>
        <Items items={plan} />
      </Section>
    </div>
  );
}
