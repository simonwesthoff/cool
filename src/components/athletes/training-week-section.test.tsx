// @vitest-environment jsdom
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import de from "../../../messages/de.json";
import en from "../../../messages/en.json";
import type { CurrentWeek } from "@/domain/week-plans/week-plan-types";
import { TrainingWeekSection } from "./training-week-section";

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(cleanup);

const names = {
  1: { de: "Reißen", en: "Snatch" },
  33: { de: "Klimmzug", en: "Pull-up" },
};
/** Week 11 of 21 from Monday 2027-02-08 with the snatch on Monday. */
const week = (planned = true): CurrentWeek => ({
  state: "week",
  calendarWeek: 6,
  next: { weekNumber: 12, planned: false },
  week: {
    weekNumber: 11,
    durationWeeks: 21,
    startDate: "2027-02-08",
    mesocycle: "special_preparation",
    level: "medium",
    planned,
    check: { chosen: [1], missing: [], notPlanned: [] },
    variations: {},
    sessions: planned
      ? [
          {
            weekday: 1,
            slot: 1,
            exercises: [
              {
                exerciseNumber: 1,
                note: "Fast turnover",
                feedback: "Last set felt heavy",
                setGroups: [
                  { sets: 2, reps: 3, weightKg: 60 },
                  { sets: 1, reps: 1, weightKg: 80 },
                ],
              },
              {
                exerciseNumber: 33,
                note: null,
                freeText: "3 × 10, slow",
                setGroups: [],
              },
            ],
          },
        ]
      : [],
  },
});

function renderSection(
  props: Partial<React.ComponentProps<typeof TrainingWeekSection>> = {},
  locale: "en" | "de" = "en",
) {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "de" ? de : en}
      timeZone="UTC"
    >
      <TrainingWeekSection
        athleteId="a1"
        current={week()}
        names={names}
        categories={{ 1: ["snatch"], 33: [] }}
        canEdit={false}
        canGiveFeedback={false}
        {...props}
      />
    </NextIntlClientProvider>,
  );
}
const table = () => screen.getByRole("region", { name: "Monday" });

describe("TrainingWeekSection", () => {
  it("shows the current week's header and its sessions read-only", () => {
    const { container } = renderSection();
    expect(container.querySelector("[data-week-header]")!.textContent).toBe(
      "Week 11 of 21from Feb 8, 2027Calendar week 6Special preparation block · Medium week",
    );
    const monday = table();
    const snatch = monday.querySelector('tbody[data-exercise="1"]')!;
    expect(
      [...snatch.querySelectorAll('tr[data-row="weight"] td[data-set]')]
        .map((td) => td.textContent)
        .filter(Boolean),
    ).toEqual(["60", "60", "80"]);
    // The coach note is an indicator after the name with a tooltip.
    const indicator = within(snatch as HTMLElement).getByRole("button", {
      name: "Coach note on 1 Snatch",
    });
    expect(
      document.getElementById(indicator.getAttribute("aria-describedby")!)!
        .textContent,
    ).toBe("Fast turnover");
    expect(snatch.querySelector("[data-note]")).toBeNull();
    // Fixed to the viewport, so it never makes the table scroll vertically.
    const tooltip = document.getElementById(
      indicator.getAttribute("aria-describedby")!,
    )!;
    expect(tooltip.className).toContain("fixed");
    expect(monday.querySelector("table")!.parentElement!.className).toContain(
      "overflow-y-hidden",
    );
    // A cyan mark (snatch) before the name; the pull-up has none.
    expect(
      [...snatch.querySelectorAll("[data-lift]")].map((d) =>
        d.getAttribute("data-lift"),
      ),
    ).toEqual(["snatch"]);
    expect(
      monday.querySelector('tbody[data-exercise="33"] [data-lift-marks]'),
    ).toBeNull();
    // Bold lines between exercises; no note column.
    expect(snatch.className).toContain("border-t-2");
    expect(snatch.querySelector("[data-feedback]")!.textContent).toBe(
      "Last set felt heavy",
    );
    // Free text from exercise 30 on.
    expect(
      monday.querySelector('tbody[data-exercise="33"] [data-free-text]')!
        .textContent,
    ).toBe("3 × 10, slow");
    // Read-only, no indicator columns, a feedback column.
    expect(within(monday).queryAllByRole("textbox")).toHaveLength(0);
    expect(
      monday.querySelector('tbody[data-exercise="33"] [data-note-indicator]'),
    ).toBeNull();
    const headings = [...monday.querySelectorAll("thead th")].map(
      (th) => th.textContent,
    );
    expect(headings).toContain("Feedback");
    expect(headings).not.toContain("Best value");
    expect(headings).not.toContain("mHG");
    expect(headings).not.toContain("Coach note");
    // The table fits the container on wide screens (no sideways scrolling).
    expect(monday.querySelector("table")!.className).toContain("lg:!w-full");
    expect(monday.querySelector("table")!.className).toContain("table-fixed");
  });

  it("gives the coach Edit week (left) and Plan next week (right) below the week, and the athlete neither", () => {
    const { container } = renderSection({ canEdit: true });
    const actions = container.querySelector("[data-week-actions]")!;
    expect(actions.className).toContain("justify-between");
    // Below the session tables.
    expect(
      table().compareDocumentPosition(actions) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      [...actions.querySelectorAll("a")].map((a) => a.textContent),
    ).toEqual(["Edit week", "Plan next week"]);
    expect(
      screen.getByRole("link", { name: "Edit week" }).getAttribute("href"),
    ).toBe("/athletes/a1/macrocycle/weeks/11");
    expect(
      screen.getByRole("link", { name: "Plan next week" }).getAttribute("href"),
    ).toBe("/athletes/a1/macrocycle/weeks/12?prefill=previous");
    cleanup();
    renderSection();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("offers Plan this week for an unplanned current week", () => {
    renderSection({ canEdit: true, current: week(false) });
    expect(screen.getByText("No plan for this week yet.")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Plan this week" }).getAttribute("href"),
    ).toBe("/athletes/a1/macrocycle/weeks/11?prefill=previous");
  });

  it("says when the macrocycle starts or that it has ended", () => {
    renderSection({ current: { state: "before", startDate: "2026-11-30" } });
    expect(
      screen.getByText("The macrocycle starts on Nov 30, 2026."),
    ).toBeTruthy();
    cleanup();
    renderSection({ current: { state: "after" } });
    expect(screen.getByText("The macrocycle has ended.")).toBeTruthy();
  });

  it("lets the linked athlete write feedback, saved on its own", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    renderSection({ canGiveFeedback: true });
    const field = within(table()).getByRole("textbox", {
      name: "Feedback on 1 Snatch",
    }) as HTMLTextAreaElement;
    expect(field.value).toBe("Last set felt heavy");
    // Only the feedback is editable.
    expect(within(table()).getAllByRole("textbox")).toHaveLength(2);
    await userEvent.type(field, ", knees ok");
    await waitFor(() => expect(fetchMock).toHaveBeenCalled(), {
      timeout: 5000,
    });
    const [url, init] = fetchMock.mock.lastCall!;
    expect(url).toBe("/api/athletes/a1/macrocycle/weeks/11/plan/feedback");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body)).toEqual({
      weekday: 1,
      slot: 1,
      exerciseNumber: 1,
      feedback: "Last set felt heavy, knees ok",
    });
    expect(
      await screen.findByText("Saved", {}, { timeout: 5000 }),
    ).toBeTruthy();
  });

  it("says when feedback could not be saved", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }));
    renderSection({ canGiveFeedback: true });
    await userEvent.type(
      within(table()).getByRole("textbox", { name: "Feedback on 1 Snatch" }),
      "!",
    );
    expect(
      await screen.findByText("Not saved", {}, { timeout: 5000 }),
    ).toBeTruthy();
  });

  it("uses German texts", () => {
    const { container } = renderSection({ canEdit: true }, "de");
    expect(
      container.querySelector("[data-week-header]")!.textContent,
    ).toContain("KW 6");
    expect(screen.getByRole("link", { name: "Woche bearbeiten" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Nächste Woche planen" }),
    ).toBeTruthy();
    expect(
      [...container.querySelectorAll("thead th")].map((th) => th.textContent),
    ).toContain("Rückmeldung");
  });
});
