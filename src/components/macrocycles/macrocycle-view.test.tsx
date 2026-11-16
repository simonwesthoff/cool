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
        back={{ href: "/athletes/a1", label: "Back to the athlete" }}
        {...props}
      />
    </NextIntlClientProvider>,
  );
}
const bestValueOfWeek1 = (container: HTMLElement) =>
  container
    .querySelector('[data-curve="bestKg"] [data-point="1"]')!
    .getAttribute("data-value");

describe("MacrocycleView", () => {
  it("shows the exercise picker, chart, focus points, base data and deficits in this order", () => {
    const { container } = renderView({
      editHref: "/athletes/a1/macrocycle/base-data",
    });
    const picker = screen.getByLabelText("Exercise") as HTMLSelectElement;
    expect([...picker.options].map((o) => o.textContent)).toEqual([
      "1 Snatch",
      "13 Snatch pull",
    ]);
    expect(picker.value).toBe("1");
    const order = [
      picker,
      container.querySelector("figure")!,
      screen.getByRole("heading", { name: "Focus points" }),
      screen.getByRole("heading", { name: "Historical data" }),
      screen.getByRole("heading", { name: "New macrocycle plan" }),
      screen.getByRole("heading", { name: "Deficits, injuries and illnesses" }),
      screen.getByRole("link", { name: "Change planning" }),
    ];
    for (let i = 1; i < order.length; i++) {
      expect(
        order[i - 1]!.compareDocumentPosition(order[i]!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
    // The picker is the only control above the chart.
    const chartSection = picker.closest("section")!;
    expect(within(chartSection).queryAllByRole("button")).toHaveLength(0);
    expect(within(chartSection).queryAllByRole("link")).toHaveLength(0);
  });

  it("shows the base data, focus points and deficits", () => {
    renderView();
    const text = document.body.textContent!;
    expect(text).toContain("PeriodNov 30, 2026 – Apr 25, 2027");
    expect(text).toContain("Duration21 weeks");
    expect(text).toContain(
      "Main competitionGerman Championships, Apr 24, 2027",
    );
    expect(text).toContain("Entry value60%");
    expect(text).toContain("Personal best snatch90 kg");
    expect(text).toContain("Target body weight80.5 kg");
    expect(text).toContain("Muscle mass45%");
    // Body fat is not entered and left out.
    expect(text).not.toContain("Body fat");
    const points = screen.getByRole("heading", {
      name: "Focus points",
    }).parentElement!;
    expect(
      [...points.querySelectorAll("li")].map((li) => li.textContent),
    ).toEqual(["1.Turnover", "2.Squat strength"]);
    expect(
      document.querySelector('[data-summary="cleanDeficits"]')!.textContent,
    ).toBe("Deficits in the cleanNot entered yet");
    expect(
      document.querySelector('[data-summary="injuriesAndIllnesses"]')!
        .textContent,
    ).toContain("None");
  });

  it("reads no focus points and not entered SWOT values for an unsaved SWOT", () => {
    renderView({
      macrocycle: {
        ...macrocycle,
        focusPoints: [],
        snatchDeficits: "",
        injuriesAndIllnesses: "",
      },
    });
    expect(screen.getByText("No focus points entered yet.")).toBeTruthy();
    expect(
      document.querySelector('[data-summary="snatchDeficits"]')!.textContent,
    ).toContain("Not entered yet");
  });

  it("loads another exercise's values and keeps them for switching back", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(valuesOf(13, 95)), { status: 200 }),
    );
    const { container } = renderView();
    expect(bestValueOfWeek1(container)).toBe("80");
    await userEvent.selectOptions(screen.getByLabelText("Exercise"), "13");
    expect(fetchMock.mock.calls[0]![0]).toBe(
      "/api/athletes/a1/macrocycle/exercises/13",
    );
    await waitFor(() => expect(bestValueOfWeek1(container)).toBe("95"));
    await userEvent.selectOptions(screen.getByLabelText("Exercise"), "1");
    expect(bestValueOfWeek1(container)).toBe("80");
    await userEvent.selectOptions(screen.getByLabelText("Exercise"), "13");
    expect(bestValueOfWeek1(container)).toBe("95");
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
    expect(bestValueOfWeek1(container)).toBe("80");
  });

  it("offers Change planning only with an edit link", () => {
    renderView({ back: { href: "/training", label: "Back to My training" } });
    expect(screen.queryByRole("link", { name: "Change planning" })).toBeNull();
    expect(
      screen.getByRole("link", { name: "Back to My training" }),
    ).toHaveProperty("pathname", "/training");
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
    expect(text).toContain("Dauer21 Wochen");
    expect(text).toContain("Zielleistung Reißen100 kg");
    expect(text).toMatch(/Einstiegswert60\s%/);
  });
});
