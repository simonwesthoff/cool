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
        competition={{ date: "2027-04-24", type: "German Championships" }}
        today="2027-01-06"
        {...props}
      />
    </NextIntlClientProvider>,
  );
}

const PLOT = { top: 28, height: 240 };
// Width 800, margins 56 / 16 + 34 for the reps axis: 694 px for 21 weeks.
const xOf = (index: number) => 56 + (694 / 21) * index;
const pointOf = (container: HTMLElement, curve: string, week: number) =>
  container.querySelector(`[data-curve="${curve}"] [data-point="${week}"]`);

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

  it("names the four curves with their units in the legend, plus blocks, competition and current week", () => {
    renderChart();
    const legend = screen.getByRole("list", { name: "Legend" });
    const items = [...legend.querySelectorAll("li")].map(
      (li) => li.textContent,
    );
    expect(items).toEqual([
      "Best value (kg)",
      "Average weight (kg)",
      "Set size (reps)",
      "Weekly reps (reps)",
      "General preparation block",
      "Special preparation block",
      "Competition preparation block",
      "Main competition",
      "Current week",
    ]);
  });

  it("draws each curve in its value colour with its own line style", () => {
    const { container } = renderChart();
    const style = (curve: string) => {
      const line = container.querySelector(
        `[data-curve="${curve}"] [data-line]`,
      )!;
      return [
        line.getAttribute("stroke"),
        line.getAttribute("stroke-dasharray"),
      ];
    };
    expect(style("bestKg")).toEqual(["var(--value-best)", null]);
    expect(style("averageKg")).toEqual(["var(--value-average)", "7 4"]);
    expect(style("setSize")).toEqual(["var(--value-set-size)", "1.5 4"]);
    expect(style("weeklyReps")).toEqual([
      "var(--value-weekly-reps)",
      "8 3 1.5 3",
    ]);
  });

  it("places weights on the kg axis and reps on the reps axis", () => {
    const { container } = renderChart();
    const kg = niceDomain(snatch.flatMap((w) => [w.bestKg!, w.averageKg!]));
    const reps = niceDomain(
      snatch.flatMap((w) => [w.setSize!, w.weeklyReps!]),
      { fromZero: true },
    );
    const yOf = (d: { min: number; max: number }, v: number) =>
      PLOT.top + PLOT.height * (1 - (v - d.min) / (d.max - d.min));
    const yOfPoint = (curve: string, week: number) =>
      Number(
        pointOf(container, curve, week)!
          .querySelector("circle, rect, path")!
          .getAttribute(curve === "bestKg" ? "cy" : "y") ?? NaN,
      );
    expect(yOfPoint("bestKg", 11)).toBeCloseTo(yOf(kg, 80), 5);
    expect(
      pointOf(container, "averageKg", 11)!.getAttribute("data-value"),
    ).toBe("69");
    expect(
      pointOf(container, "weeklyReps", 11)!.getAttribute("data-value"),
    ).toBe("20");
    const best = pointOf(container, "bestKg", 11)!.querySelector("circle")!;
    expect(Number(best.getAttribute("cx"))).toBeCloseTo(xOf(10), 5);
    // Axis ticks on both sides.
    expect(
      [...container.querySelectorAll('[data-axis="kg"]')].map((t) =>
        Number(t.textContent),
      ),
    ).toEqual(kg.ticks);
    expect(
      [...container.querySelectorAll('[data-axis="reps"]')].map((t) =>
        Number(t.textContent),
      ),
    ).toEqual(reps.ticks);
    expect(reps.ticks[0]).toBe(0);
  });

  it("shows week numbers only on the x-axis", () => {
    const { container } = renderChart();
    const texts = [...container.querySelectorAll("svg text")].map(
      (t) => t.textContent,
    );
    expect(texts).not.toContain("Week");
    expect(texts).toEqual(expect.arrayContaining(["1", "4", "14"]));
  });

  it("leaves gaps where a week has no value", () => {
    const values = snatch.map((w) =>
      w.number === 5 ? { ...w, bestKg: null } : w,
    );
    const { container } = renderChart({ values });
    const d = container
      .querySelector('[data-curve="bestKg"] [data-line]')!
      .getAttribute("d")!;
    expect(d.match(/M/g)).toHaveLength(2);
    expect(pointOf(container, "bestKg", 5)).toBeNull();
    expect(pointOf(container, "averageKg", 5)).not.toBeNull();
  });

  it("shows the week, its block and the four values in the tooltip", () => {
    const { container } = renderChart();
    fireEvent.pointerEnter(container.querySelector('rect[data-week="11"]')!);
    const lines = [
      ...screen.getByTestId("exercise-tooltip").querySelectorAll("p"),
    ].map((p) => p.textContent);
    expect(lines).toEqual([
      "Week 11 from Feb 8, 2027",
      "SPB",
      "Best value: 80 kg",
      "Average weight: 69 kg",
      "Set size: 3",
      "Weekly reps: 20",
    ]);
  });

  it("uses German texts", () => {
    const { container } = renderChart({}, "de");
    fireEvent.pointerEnter(container.querySelector('rect[data-week="11"]')!);
    const lines = [
      ...screen.getByTestId("exercise-tooltip").querySelectorAll("p"),
    ].map((p) => p.textContent);
    expect(lines.slice(0, 3)).toEqual([
      "Woche 11 ab 08.02.2027",
      "ABP",
      "Bestwert: 80 kg",
    ]);
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

  it("is read-only and dims the curves while another exercise loads", () => {
    const { container } = renderChart({ dimmed: true });
    expect(screen.queryAllByRole("slider")).toHaveLength(0);
    expect(container.querySelector("[data-border]")).toBeNull();
    expect(
      container
        .querySelector('[data-curve="bestKg"]')!
        .parentElement!.getAttribute("opacity"),
    ).toBe("0.35");
  });
});
