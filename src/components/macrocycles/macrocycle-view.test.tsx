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
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import de from "../../../messages/de.json";
import en from "../../../messages/en.json";
import { splitMesocycles } from "@/domain/macrocycles/calculation";
import type {
  ExerciseWeeks,
  Macrocycle,
} from "@/domain/macrocycles/macrocycle-types";
import { MacrocycleView } from "./macrocycle-view";

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(
        private cb: (entries: { contentRect: { width: number } }[]) => void,
      ) {}
      observe() {
        this.cb([{ contentRect: { width: 800 } }]);
      }
      disconnect() {}
    },
  );
});
const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => cleanup());

const N = 21;
const spans = splitMesocycles(N);
const macrocycle = {
  athleteId: "a1",
  startDate: "2026-11-30",
  durationWeeks: N,
  entryValuePct: 60,
  snatchBestKg: 90,
  cleanAndJerkBestKg: 115,
  snatchGoalKg: 100,
  cleanAndJerkGoalKg: 130,
  bodyWeightKg: 81,
  targetBodyWeightKg: 80.5,
  bodyFatPct: null,
  muscleMassPct: 45,
  snatchDeficits: "Slow turnover",
  cleanDeficits: "",
  jerkDeficits: "Short dip",
  otherDeficits: "Ankle mobility",
  injuriesAndIllnesses: "None",
  strengths: "Fast",
  experience: "6 years",
  trainingFrequency: 8,
  sessions: [],
  focusPoints: ["Turnover", "Squat strength"],
  competitionDate: "2027-04-24",
  competitionType: "German Championships",
  mesocycles: spans.map((m) => ({ ...m, exerciseNumbers: [], exercises: [] })),
  weeks: Array.from({ length: N }, (_, i) => ({
    number: i + 1,
    startDate: new Date(Date.UTC(2026, 10, 30 + 7 * i))
      .toISOString()
      .slice(0, 10),
    mesocycle: spans.find((m) => i + 1 >= m.firstWeek && i + 1 <= m.lastWeek)!
      .type,
    level: "medium",
    intensityPct: 80,
    volume: null,
    exercises: [],
  })),
} as unknown as Macrocycle;
const valuesOf = (exerciseNumber: number, best: number): ExerciseWeeks => ({
  exerciseNumber,
  weeks: Array.from({ length: N }, (_, i) => ({
    number: i + 1,
    bestKg: best,
    averageKg: best - 10,
    setSize: 3,
    weeklyReps: 20,
  })),
});
const exercises = [
  { number: 1, name: { de: "Reißen", en: "Snatch" } },
  { number: 13, name: { de: "Zug breit", en: "Snatch pull" } },
];

function renderView(
  props: Partial<React.ComponentProps<typeof MacrocycleView>> = {},
  locale: "en" | "de" = "en",
) {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "de" ? de : en}
      timeZone="UTC"
    >
      <MacrocycleView
        macrocycle={macrocycle}
        initialValues={valuesOf(1, 80)}
        exercises={exercises}
        today="2027-01-06"
        {...props}
      />
    </NextIntlClientProvider>,
  );
}
const valueOfWeek1 = (container: HTMLElement) =>
  container
    .querySelector('[data-curve] [data-point="1"]')!
    .getAttribute("data-value");

describe("MacrocycleView", () => {
  it("shows the two selections, the chart, the focus points and the plan in this order", () => {
    const { container } = renderView({
      editHref: "/athletes/a1/macrocycle/base-data",
    });
    const exercise = screen.getByLabelText("Exercise") as HTMLSelectElement;
    const value = screen.getByLabelText("Value") as HTMLSelectElement;
    expect([...exercise.options].map((o) => o.textContent)).toEqual([
      "1 Snatch",
      "13 Snatch pull",
    ]);
    expect(exercise.value).toBe("1");
    expect([...value.options].map((o) => o.textContent)).toEqual([
      "Best value (kg)",
      "Average weight (kg)",
      "Set size",
      "Weekly reps",
    ]);
    expect(value.value).toBe("bestKg");
    const order = [
      exercise,
      value,
      container.querySelector("figure")!,
      screen.getByRole("heading", { name: "Focus points" }),
      screen.getByRole("heading", { name: "New macrocycle plan" }),
      screen.getByRole("link", { name: "Change planning" }),
    ];
    for (let i = 1; i < order.length; i++) {
      expect(
        order[i - 1]!.compareDocumentPosition(order[i]!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
    // The selections are the only controls above the chart.
    const chartSection = exercise.closest("section")!;
    expect(within(chartSection).queryAllByRole("button")).toHaveLength(0);
    expect(within(chartSection).queryAllByRole("link")).toHaveLength(0);
    // No historical data, deficits or injuries.
    expect(
      screen.queryByRole("heading", { name: "Historical data" }),
    ).toBeNull();
    const text = document.body.textContent!;
    for (const hidden of [
      "Personal best",
      "Body weight",
      "Muscle mass",
      "Slow turnover",
      "Ankle mobility",
      "Deficits",
    ])
      expect(text).not.toContain(hidden);
  });

  it("shows the plan and the focus points", () => {
    renderView();
    const text = document.body.textContent!;
    expect(text).toContain("PeriodNov 30, 2026 – Apr 25, 2027");
    expect(text).toContain("Duration21 weeks");
    expect(text).toContain(
      "Main competitionGerman Championships, Apr 24, 2027",
    );
    expect(text).toContain("Entry value60%");
    expect(text).toContain("Goal snatch100 kg");
    expect(text).toContain("Target body weight80.5 kg");
    const points = screen.getByRole("heading", {
      name: "Focus points",
    }).parentElement!;
    expect(
      [...points.querySelectorAll("li")].map((li) => li.textContent),
    ).toEqual(["1.Turnover", "2.Squat strength"]);
  });

  it("says that no focus points are entered yet", () => {
    renderView({ macrocycle: { ...macrocycle, focusPoints: [] } });
    expect(screen.getByText("No focus points entered yet.")).toBeTruthy();
  });

  it("switches the value without loading anything", async () => {
    const { container } = renderView();
    expect(valueOfWeek1(container)).toBe("80");
    await userEvent.selectOptions(screen.getByLabelText("Value"), "weeklyReps");
    expect(
      container.querySelector("[data-curve]")!.getAttribute("data-curve"),
    ).toBe("weeklyReps");
    expect(valueOfWeek1(container)).toBe("20");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads another exercise's values and keeps them for switching back", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(valuesOf(13, 95)), { status: 200 }),
    );
    const { container } = renderView();
    await userEvent.selectOptions(screen.getByLabelText("Exercise"), "13");
    expect(fetchMock.mock.calls[0]![0]).toBe(
      "/api/athletes/a1/macrocycle/exercises/13",
    );
    await waitFor(() => expect(valueOfWeek1(container)).toBe("95"));
    await userEvent.selectOptions(screen.getByLabelText("Exercise"), "1");
    expect(valueOfWeek1(container)).toBe("80");
    await userEvent.selectOptions(screen.getByLabelText("Exercise"), "13");
    expect(valueOfWeek1(container)).toBe("95");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the previous exercise and shows a message when loading fails", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }));
    const { container } = renderView();
    await userEvent.selectOptions(screen.getByLabelText("Exercise"), "13");
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect((screen.getByLabelText("Exercise") as HTMLSelectElement).value).toBe(
      "1",
    );
    expect(valueOfWeek1(container)).toBe("80");
  });

  it("offers Change planning only with an edit link", () => {
    renderView();
    expect(screen.queryByRole("link", { name: "Change planning" })).toBeNull();
    // The way back is at the top of the page, not in the view.
    expect(screen.queryByRole("link", { name: /Back/ })).toBeNull();
    cleanup();
    renderView({ editHref: "/athletes/a1/macrocycle/base-data" });
    expect(
      screen.getByRole("link", { name: "Change planning" }),
    ).toHaveProperty("pathname", "/athletes/a1/macrocycle/base-data");
  });

  it("uses German texts", () => {
    renderView({}, "de");
    const text = document.body.textContent!;
    expect(screen.getByLabelText("Übung")).toBeTruthy();
    expect(screen.getByLabelText("Wert")).toBeTruthy();
    expect(text).toContain("Dauer21 Wochen");
    expect(text).toContain("Zielleistung Reißen100 kg");
    expect(text).toMatch(/Einstiegswert60\s%/);
  });
});
