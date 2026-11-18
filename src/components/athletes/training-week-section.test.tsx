// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import de from "../../../messages/de.json";
import en from "../../../messages/en.json";
import type { TrainingWeeks } from "@/domain/week-plans/week-plan-types";
import { TrainingWeekSection } from "./training-week-section";

afterEach(cleanup);
const renderWith = (weeks: TrainingWeeks, locale: "en" | "de" = "en") =>
  render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "de" ? de : en}
      timeZone="UTC"
    >
      <TrainingWeekSection athleteId="a1" weeks={weeks} />
    </NextIntlClientProvider>,
  );
const href = (name: string | RegExp) =>
  (screen.getByRole("link", { name }) as HTMLAnchorElement).getAttribute(
    "href",
  );

describe("TrainingWeekSection", () => {
  it("offers to plan the next week with prefill and lists the planned weeks", () => {
    renderWith({
      current: { weekNumber: 6, planned: true },
      next: { weekNumber: 7, planned: false },
      planned: [
        { weekNumber: 5, startDate: "2026-12-28" },
        { weekNumber: 6, startDate: "2027-01-04" },
      ],
    });
    expect(href("Plan next week (week 7)")).toBe(
      "/athletes/a1/macrocycle/weeks/7?prefill=previous",
    );
    expect(screen.queryByRole("link", { name: /Plan this week/ })).toBeNull();
    expect(href("Edit week 5")).toBe("/athletes/a1/macrocycle/weeks/5");
    expect(href("Edit week 6")).toBe("/athletes/a1/macrocycle/weeks/6");
    const week6 = document.querySelector('[data-week="6"]')!;
    expect(week6.textContent).toContain("from Jan 4, 2027");
    expect(week6.textContent).toContain("Current week");
  });

  it("edits an already planned next week and offers an unplanned current week", () => {
    renderWith({
      current: { weekNumber: 6, planned: false },
      next: { weekNumber: 7, planned: true },
      planned: [{ weekNumber: 7, startDate: "2027-01-11" }],
    });
    expect(href("Edit next week (week 7)")).toBe(
      "/athletes/a1/macrocycle/weeks/7",
    );
    expect(href("Plan this week (week 6)")).toBe(
      "/athletes/a1/macrocycle/weeks/6?prefill=previous",
    );
  });

  it("has no next week after the last week, and says when nothing is planned", () => {
    renderWith({ current: null, next: null, planned: [] });
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("No week is planned yet.")).toBeTruthy();
  });

  it("uses German texts", () => {
    renderWith(
      { current: null, next: { weekNumber: 1, planned: false }, planned: [] },
      "de",
    );
    expect(
      screen.getByRole("heading", { name: "Trainingswoche" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Nächste Woche planen (Woche 1)" }),
    ).toBeTruthy();
  });
});
