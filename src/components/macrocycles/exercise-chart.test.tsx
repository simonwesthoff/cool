// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import de from "../../../messages/de.json";
import en from "../../../messages/en.json";
import {
  cycleProgress,
  plannedExercise,
  splitMesocycles,
} from "@/domain/macrocycles/calculation";
import type { ExerciseWeek } from "@/domain/macrocycles/macrocycle-types";
import { currentWeekIndex, niceDomain } from "./chart-geometry";
import { ExerciseChart } from "./exercise-chart";

let containerWidth = 800;
beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(
        private cb: (entries: { contentRect: { width: number } }[]) => void,
      ) {}
      observe() {
        this.cb([{ contentRect: { width: containerWidth } }]);
      }
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  containerWidth = 800;
});

const N = 21;
const mesocycles = splitMesocycles(N);
const weeks = Array.from({ length: N }, (_, i) => ({
  number: i + 1,
  startDate: new Date(Date.UTC(2026, 10, 30 + 7 * i))
    .toISOString()
    .slice(0, 10),
  mesocycle: mesocycles.find(
    (m) => i + 1 >= m.firstWeek && i + 1 <= m.lastWeek,
  )!.type,
}));
/** Snatch (exercise 1) with a 100 kg goal and entry value 60 %, all weeks medium. */
const snatch: ExerciseWeek[] = weeks.map((w) => ({
  number: w.number,
  ...plannedExercise(
    {
      referenceLift: "snatch",
      bestValuePct: 100,
      maxWeeklyAverageWeightPct: 86,
      repsPerSet: { min: 1, max: 5 },
      repsPerWeek: { min: 10, max: 30 },
    },
    { snatchGoalKg: 100, cleanAndJerkGoalKg: 130 },
    0.6,
    cycleProgress(w.number, N),
    "medium",
  ),
}));

function renderChart(
  props: Partial<React.ComponentProps<typeof ExerciseChart>> = {},
  locale: "en" | "de" = "en",
) {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "de" ? de : en}
      timeZone="UTC"
    >
      <ExerciseChart
        weeks={weeks}
        mesocycles={mesocycles}
        values={snatch}
        value="bestKg"
        competition={{ date: "2027-04-24", type: "German Championships" }}
        today="2027-01-06"
        {...props}
      />
    </NextIntlClientProvider>,
  );
}

const PLOT = { top: 28, height: 240 };
// Width 800, margins 56 / 16: 728 px for 21 weeks.
const xOf = (index: number) => 56 + (728 / 21) * index;
const pointOf = (container: HTMLElement, week: number) =>
  container.querySelector(`[data-curve] [data-point="${week}"]`);
const yOf = (d: { min: number; max: number }, v: number) =>
  PLOT.top + PLOT.height * (1 - (v - d.min) / (d.max - d.min));

describe("ExerciseChart", () => {
  it("has the snatch values of the spec in week 11", () => {
    expect(snatch[10]).toEqual({
      number: 11,
      bestKg: 80,
      averageKg: 69,
      setSize: 3,
      weeklyReps: 20,
    });
  });

  it("draws only the selected value as one white curve on a kg axis without a unit title", () => {
    const { container } = renderChart();
    expect(container.querySelectorAll("[data-curve]")).toHaveLength(1);
    expect(
      container.querySelector("[data-curve]")!.getAttribute("data-curve"),
    ).toBe("bestKg");
    expect(container.querySelector("[data-line]")!.getAttribute("class")).toBe(
      "stroke-white",
    );
    const kg = niceDomain(snatch.map((w) => w.bestKg!));
    const dot = pointOf(container, 11)!.querySelectorAll("circle")[1]!;
    expect(Number(dot.getAttribute("cy"))).toBeCloseTo(yOf(kg, 80), 5);
    expect(Number(dot.getAttribute("cx"))).toBeCloseTo(xOf(10), 5);
    expect(
      [...container.querySelectorAll("[data-axis]")].map((t) =>
        Number(t.textContent),
      ),
    ).toEqual(kg.ticks);
    // No unit written next to the axis.
    expect(container.querySelector("[data-axis-title]")).toBeNull();
  });

  it("uses a reps axis from 0 for set size and weekly reps", () => {
    const { container } = renderChart({ value: "weeklyReps" });
    const reps = niceDomain(
      snatch.map((w) => w.weeklyReps!),
      { fromZero: true },
    );
    expect(reps.min).toBe(0);
    expect(pointOf(container, 11)!.getAttribute("data-value")).toBe("20");
    expect(
      [...container.querySelectorAll("[data-axis]")].map((t) =>
        Number(t.textContent),
      ),
    ).toEqual(reps.ticks);
  });

  it("has the mesocycles, competition and current week in the legend, and only week numbers on the x-axis", () => {
    const { container } = renderChart();
    const legend = screen.getByRole("list", { name: "Legend" });
    // Hidden for now, but still there for screen readers.
    expect(legend.className).toBe("sr-only");
    expect(
      [...legend.querySelectorAll("li")].map((li) => li.textContent),
    ).toEqual([
      "General preparation block",
      "Special preparation block",
      "Competition preparation block",
      "Main competition",
      "Current week",
    ]);
    const bands = container.querySelectorAll("svg[role=group] > g > rect");
    expect([0, 1, 2].map((i) => bands[i]!.getAttribute("fill"))).toEqual([
      "var(--band-1)",
      "var(--band-2)",
      "var(--band-3)",
    ]);
    const texts = [...container.querySelectorAll("svg text")].map(
      (t) => t.textContent,
    );
    expect(texts).not.toContain("Week");
    expect(texts).toEqual(expect.arrayContaining(["1", "4", "14"]));
  });

  it("leaves a gap where a week has no value", () => {
    const values = snatch.map((w) =>
      w.number === 5 ? { ...w, bestKg: null } : w,
    );
    const { container } = renderChart({ values });
    expect(
      container.querySelector("[data-line]")!.getAttribute("d")!.match(/M/g),
    ).toHaveLength(2);
    expect(pointOf(container, 5)).toBeNull();
  });

  it("shows the selected value, the week and its block in the tooltip", () => {
    const { container } = renderChart({ value: "averageKg" });
    fireEvent.pointerEnter(container.querySelector('rect[data-week="11"]')!);
    const lines = [
      ...screen.getByTestId("exercise-tooltip").querySelectorAll("p"),
    ].map((p) => p.textContent);
    expect(lines).toEqual([
      "Average weight: 69 kg",
      "Week 11 from Feb 8, 2027",
      "SPB",
    ]);
  });

  it("uses German texts", () => {
    const { container } = renderChart({}, "de");
    fireEvent.pointerEnter(container.querySelector('rect[data-week="11"]')!);
    const lines = [
      ...screen.getByTestId("exercise-tooltip").querySelectorAll("p"),
    ].map((p) => p.textContent);
    expect(lines).toEqual(["Bestwert: 80 kg", "Woche 11 ab 08.02.2027", "ABP"]);
  });

  it("marks the current week with a line, and none outside the cycle", () => {
    const { container } = renderChart();
    const line = container.querySelector("[data-current-week]")!;
    expect(line.getAttribute("data-current-week")).toBe("6");
    expect(Number(line.getAttribute("x1"))).toBeCloseTo(xOf(5), 5);
    cleanup();
    for (const today of ["2026-11-20", "2027-05-03"]) {
      const view = renderChart({ today });
      expect(view.container.querySelector("[data-current-week]")).toBeNull();
      expect(screen.queryByText("Current week")).toBeNull();
      cleanup();
    }
    expect(currentWeekIndex("2026-11-30", 21, "2027-04-25")).toBe(20);
    expect(currentWeekIndex("2026-11-30", 21, "2027-04-26")).toBeNull();
  });

  it("is read-only and dims the curve while another exercise loads", () => {
    const { container } = renderChart({ dimmed: true });
    expect(screen.queryAllByRole("slider")).toHaveLength(0);
    expect(container.querySelector("[data-border]")).toBeNull();
    expect(
      container.querySelector("[data-curve]")!.getAttribute("opacity"),
    ).toBe("0.35");
  });
});
