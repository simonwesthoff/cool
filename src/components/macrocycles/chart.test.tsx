// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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
import {
  cycleProgress,
  intensity,
  splitMesocycles,
  type Curve,
} from "@/domain/macrocycles/calculation";
import type {
  Macrocycle,
  WeekLevel,
} from "@/domain/macrocycles/macrocycle-types";
import {
  baseIntensity,
  fitsLabel,
  intensityAt,
  intensityDomain,
  labelEvery,
  levelForValue,
  stepLevel,
} from "./chart-geometry";
import { IntensityPlanner } from "./intensity-planner";
import { MacrocycleChart, type ChartWeek } from "./macrocycle-chart";

// jsdom has no layout: the chart is measured at this width.
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

function makeWeeks(
  count = 21,
  levels: Record<number, WeekLevel> = {},
): ChartWeek[] {
  const spans = splitMesocycles(count);
  return Array.from({ length: count }, (_, i) => {
    const level = levels[i + 1] ?? "medium";
    return {
      number: i + 1,
      startDate: new Date(Date.UTC(2026, 10, 30 + 7 * i))
        .toISOString()
        .slice(0, 10),
      mesocycle: spans.find((m) => i + 1 >= m.firstWeek && i + 1 <= m.lastWeek)!
        .type,
      level,
      intensityPct:
        Math.round(intensity(0.6, cycleProgress(i + 1, count), level) * 1000) /
        10,
      volume: i === 10 ? 66 : null,
    };
  });
}
const mesocycles = splitMesocycles(21);

function renderIn(node: React.ReactNode, locale: "en" | "de" = "en") {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "de" ? de : en}
      timeZone="UTC"
    >
      {node}
    </NextIntlClientProvider>,
  );
}

const pointOf = (container: HTMLElement, week: number) =>
  container.querySelector(`[data-point="${week}"]`)!;
const dotX = (container: HTMLElement, week: number) =>
  Number(pointOf(container, week).querySelector("circle")!.getAttribute("cx"));

describe("chart geometry", () => {
  it("separates the curve from the week's step", () => {
    expect(baseIntensity(85, "high")).toBe(80);
    expect(baseIntensity(75, "low")).toBe(80);
    expect(intensityAt(80, "high")).toBe(85);
  });

  it("steps one level at a time and stops at high and low", () => {
    expect(stepLevel("medium", 1)).toBe("high");
    expect(stepLevel("high", 1)).toBe("high");
    expect(stepLevel("high", -1)).toBe("medium");
    expect(stepLevel("low", -1)).toBe("low");
  });

  it("snaps a pointer value to the nearest of the three positions", () => {
    expect(levelForValue(80, 93)).toBe("high");
    expect(levelForValue(80, 82.4)).toBe("medium");
    expect(levelForValue(80, 82.6)).toBe("high");
    expect(levelForValue(80, 70)).toBe("low");
  });

  it("labels a band only when the name fits", () => {
    expect(fitsLabel("General preparation", 84)).toBe(false);
    expect(fitsLabel("General preparation", 130)).toBe(true);
  });

  it("chooses an axis covering low weeks and clean ticks", () => {
    expect(intensityDomain([60, 80, 100])).toEqual({
      min: 50,
      max: 110,
      ticks: [50, 60, 70, 80, 90, 100, 110],
    });
    expect(labelEvery(40)).toBe(1);
    expect(labelEvery(7)).toBe(6);
  });
});

describe("MacrocycleChart", () => {
  it("describes every week's level and intensity", () => {
    const { container } = renderIn(
      <MacrocycleChart
        weeks={makeWeeks(21, { 11: "high" })}
        mesocycles={mesocycles}
        onLevelChange={() => {}}
      />,
    );
    expect(pointOf(container, 11).getAttribute("aria-label")).toBe(
      "Week 11, High week, 85%",
    );
    expect(pointOf(container, 1).getAttribute("aria-label")).toBe(
      "Week 1, Medium week, 60%",
    );
  });

  it("has axis titles and no volume chart, no table and no keyboard handles", () => {
    const { container } = renderIn(
      <MacrocycleChart
        weeks={makeWeeks()}
        mesocycles={mesocycles}
        onLevelChange={() => {}}
        onBordersChange={() => {}}
      />,
    );
    const texts = [...container.querySelectorAll("text")].map(
      (t) => t.textContent,
    );
    expect(texts).toContain("Intensity");
    expect(texts).toContain("Week");
    expect(container.querySelectorAll("svg")).toHaveLength(1);
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryAllByRole("slider")).toHaveLength(0);
    expect(container.querySelectorAll("[tabindex]")).toHaveLength(0);
  });

  it("names the mesocycles in German in the legend", () => {
    renderIn(
      <MacrocycleChart weeks={makeWeeks()} mesocycles={mesocycles} />,
      "de",
    );
    const legend = screen.getByRole("list", { name: "Legende" });
    expect(legend.textContent).toContain("Grundlagenphase (GLP)");
    expect(legend.textContent).toContain("Leistungsausprägungsphase (LAP)");
  });

  it("shows no legend on screen but keeps it for screen readers", () => {
    renderIn(
      <MacrocycleChart
        weeks={makeWeeks()}
        mesocycles={mesocycles}
        competition={{ date: "2027-04-24", type: "German Championships" }}
      />,
    );
    const legend = screen.getByRole("list", { name: "Legend" });
    expect(legend.className).toBe("sr-only");
    expect(legend.textContent).toContain("General preparation block");
    expect(legend.textContent).toContain("High / low week");
    expect(legend.textContent).toContain("Main competition");
  });

  it("snaps a dragged handle to high and reports it on release", () => {
    const onLevelChange = vi.fn();
    const { container } = renderIn(
      <MacrocycleChart
        weeks={makeWeeks()}
        mesocycles={mesocycles}
        onLevelChange={onLevelChange}
      />,
    );
    const column = container.querySelector('rect[data-week="11"]')!;
    // y-axis 50–110 % over 220 px from y = 28: 100 % is at y ≈ 64.7.
    fireEvent.pointerDown(column, { clientY: 101, pointerId: 1 });
    fireEvent.pointerMove(column, { clientY: 64, pointerId: 1 });
    expect(pointOf(container, 11).getAttribute("aria-label")).toBe(
      "Week 11, High week, 85%",
    );
    fireEvent.pointerUp(column, { clientY: 64, pointerId: 1 });
    expect(onLevelChange).toHaveBeenCalledWith(11, "high");
  });

  it("moves one step on a tap below the point", () => {
    const onLevelChange = vi.fn();
    const { container } = renderIn(
      <MacrocycleChart
        weeks={makeWeeks()}
        mesocycles={mesocycles}
        onLevelChange={onLevelChange}
      />,
    );
    const column = container.querySelector('rect[data-week="11"]')!;
    fireEvent.pointerDown(column, { clientY: 240, pointerId: 1 });
    fireEvent.pointerUp(column, { clientY: 240, pointerId: 1 });
    expect(onLevelChange).toHaveBeenCalledWith(11, "low");
  });
});

describe("fit to the width", () => {
  it.each([
    [390, 21],
    [390, 52],
    [1280, 52],
  ])("at %s px all %s weeks fit without scrolling", (widthPx, count) => {
    containerWidth = widthPx;
    const weeks = makeWeeks(count);
    const { container } = renderIn(
      <MacrocycleChart
        weeks={weeks}
        mesocycles={splitMesocycles(count)}
        onLevelChange={() => {}}
      />,
    );
    const svg = container.querySelector("svg")!;
    expect(Number(svg.getAttribute("width"))).toBe(widthPx);
    expect(dotX(container, count)).toBeLessThan(widthPx);
    expect(dotX(container, 1)).toBeGreaterThan(0);
    // Points never get smaller than a 2.5 px radius.
    const r = Number(
      pointOf(container, 1).querySelector("circle")!.getAttribute("r"),
    );
    expect(r).toBeGreaterThanOrEqual(3);
  });
});

describe("week positions and style", () => {
  it("puts a week's point and number on the line where its block starts", () => {
    const { container } = renderIn(
      <MacrocycleChart
        weeks={makeWeeks()}
        mesocycles={mesocycles}
        onLevelChange={() => {}}
      />,
    );
    const specialStart = Number(
      container
        .querySelector('[data-block-start="4"] line')!
        .getAttribute("x1"),
    );
    expect(dotX(container, 4)).toBeCloseTo(specialStart, 5);
    const label4 = container.querySelector('[data-week-label="4"]')!;
    expect(Number(label4.getAttribute("x"))).toBeCloseTo(specialStart, 5);
    const numbers = [...container.querySelectorAll("[data-week-label]")].map(
      (t) => Number(t.textContent),
    );
    expect(numbers).toEqual(expect.arrayContaining([1, 4, 14]));
  });

  it("has no mesocycle colours and draws the intensity as one pink curve with pink handles, a y-axis and ▲▼", () => {
    const { container } = renderIn(
      <MacrocycleChart
        weeks={makeWeeks(21, { 11: "high" })}
        mesocycles={mesocycles}
        onLevelChange={() => {}}
      />,
    );
    expect(container.querySelectorAll("rect[fill^='var(--band']")).toHaveLength(
      0,
    );
    expect(container.querySelectorAll("[data-block-start]")).toHaveLength(3);
    const line = container.querySelector("[data-line]")!;
    expect(line.getAttribute("stroke")).toBe("var(--chart-curve)");
    expect(line.getAttribute("d")).toContain(" C");
    expect(container.querySelector("[data-area]")).toBeTruthy();
    expect(
      pointOf(container, 4).querySelector("circle")!.getAttribute("fill"),
    ).toBe("var(--chart-curve)");
    expect(pointOf(container, 11).textContent).toBe("▲");
    expect(
      [...container.querySelectorAll("[data-axis]")].map((t) => t.textContent),
      // 0–110 % in both planning steps; every other value when tight.
    ).toEqual(["0%", "20%", "40%", "60%", "80%", "100%"]);
  });
});

describe("mesocycle borders", () => {
  const border = (container: HTMLElement, index: 0 | 1) =>
    container.querySelector(`[data-border="${index}"]`)!;

  it("names the position of both borders", () => {
    const { container } = renderIn(
      <MacrocycleChart
        weeks={makeWeeks()}
        mesocycles={mesocycles}
        onBordersChange={() => {}}
      />,
    );
    expect(border(container, 0).getAttribute("aria-label")).toBe(
      "Special preparation block from week 4",
    );
    expect(border(container, 1).getAttribute("aria-label")).toBe(
      "Competition preparation block from week 14",
    );
  });

  it("drags a border to a week boundary and reports it on release", () => {
    const onBordersChange = vi.fn();
    const { container } = renderIn(
      <MacrocycleChart
        weeks={makeWeeks()}
        mesocycles={mesocycles}
        onBordersChange={onBordersChange}
      />,
    );
    // Width 800, margins 56/16: column ≈ 34.86 px; week 6 starts at ≈ 230 px.
    fireEvent.pointerDown(border(container, 0), { clientX: 160, pointerId: 1 });
    fireEvent.pointerMove(border(container, 0), { clientX: 232, pointerId: 1 });
    expect(border(container, 0).getAttribute("aria-label")).toBe(
      "Special preparation block from week 6",
    );
    fireEvent.pointerUp(border(container, 0), { clientX: 232, pointerId: 1 });
    expect(onBordersChange).toHaveBeenCalledWith(6, 14);
  });

  it("stops so that every block keeps at least one week", () => {
    const onBordersChange = vi.fn();
    const { container } = renderIn(
      <MacrocycleChart
        weeks={makeWeeks()}
        mesocycles={mesocycles}
        onBordersChange={onBordersChange}
      />,
    );
    fireEvent.pointerDown(border(container, 1), { clientX: 500, pointerId: 1 });
    fireEvent.pointerMove(border(container, 1), { clientX: 0, pointerId: 1 });
    fireEvent.pointerUp(border(container, 1), { clientX: 0, pointerId: 1 });
    expect(onBordersChange).toHaveBeenCalledWith(4, 5);
  });
});

describe("week tooltip", () => {
  function box(el: HTMLElement) {
    const left = parseFloat(el.style.left);
    const top = parseFloat(el.style.top);
    return {
      left,
      right: left + parseFloat(el.style.width),
      top,
      bottom: top + parseFloat(el.style.minHeight),
    };
  }

  it("appears left of and below a point at the top right", () => {
    const { container } = renderIn(
      <MacrocycleChart weeks={makeWeeks()} mesocycles={mesocycles} />,
    );
    fireEvent.pointerEnter(container.querySelector('rect[data-week="21"]')!);
    const tooltip = screen.getByTestId("chart-tooltip");
    const tip = box(tooltip);
    const hit = container.querySelector('rect[data-week="21"]')!;
    expect(tip.right).toBeLessThanOrEqual(Number(hit.getAttribute("x")));
    expect(tip.top).toBeGreaterThan(64 + 10);
    expect(tooltip.textContent).not.toContain("Volume");
  });

  it("appears right of and above a point at the bottom left", () => {
    const { container } = renderIn(
      <MacrocycleChart
        weeks={makeWeeks(21, { 1: "low" })}
        mesocycles={mesocycles}
      />,
    );
    fireEvent.pointerEnter(container.querySelector('rect[data-week="1"]')!);
    const tip = box(screen.getByTestId("chart-tooltip"));
    const hit = container.querySelector('rect[data-week="1"]')!;
    expect(tip.left).toBeGreaterThanOrEqual(
      Number(hit.getAttribute("x")) + Number(hit.getAttribute("width")),
    );
    expect(tip.bottom).toBeLessThan(230 - 10);
  });

  it("shows intensity (level), week with start date and block abbreviation, no volume", () => {
    // Week 11 has a volume of 66 in these test weeks; it is not shown.
    const { container } = renderIn(
      <MacrocycleChart
        weeks={makeWeeks(21, { 11: "high" })}
        mesocycles={mesocycles}
      />,
    );
    fireEvent.pointerEnter(container.querySelector('rect[data-week="11"]')!);
    const lines = [
      ...screen.getByTestId("chart-tooltip").querySelectorAll("p"),
    ].map((p) => p.textContent);
    expect(lines).toEqual(["85% (high)", "Week 11 from Feb 8, 2027", "SPB"]);
  });

  it("uses the German texts and abbreviations", () => {
    const { container } = renderIn(
      <MacrocycleChart
        weeks={makeWeeks(21, { 2: "low" })}
        mesocycles={mesocycles}
      />,
      "de",
    );
    fireEvent.pointerEnter(container.querySelector('rect[data-week="2"]')!);
    const lines = [
      ...screen.getByTestId("chart-tooltip").querySelectorAll("p"),
    ].map((p) => p.textContent);
    expect(lines[0]).toMatch(/^\d+(,\d)?\s% \(niedrig\)$/);
    expect(lines.slice(1)).toEqual(["Woche 2 ab 07.12.2026", "GLP"]);
  });
});

describe("IntensityPlanner", () => {
  const fetchMock = vi.fn();
  const onSaved = vi.fn();
  const onContinue = vi.fn();
  const onBack = vi.fn();
  const macrocycle = {
    athleteId: "a1",
    competitionDate: "2027-04-24",
    competitionType: "German Championships",
    mesocycles: mesocycles.map((m) => ({ ...m, exerciseNumbers: [] })),
    weeks: makeWeeks().map((w) => ({ ...w, exercises: [] })),
    curve: { entryPct: 60, anchors: [] },
  } as unknown as Macrocycle;
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("saves a dragged week level", async () => {
    const saved = { ...macrocycle, weeks: makeWeeks(21, { 11: "high" }) };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(saved), { status: 200 }),
    );
    const { container } = renderIn(
      <IntensityPlanner
        mode="weeks"
        macrocycle={macrocycle}
        onSaved={onSaved}
        onContinue={onContinue}
        onBack={onBack}
      />,
    );
    const column = container.querySelector('rect[data-week="11"]')!;
    fireEvent.pointerDown(column, { clientY: 101, pointerId: 1 });
    fireEvent.pointerMove(column, { clientY: 64, pointerId: 1 });
    fireEvent.pointerUp(column, { clientY: 64, pointerId: 1 });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/athletes/a1/macrocycle/weeks/11");
    expect(JSON.parse(init.body)).toEqual({ level: "high" });
    await waitFor(() =>
      expect(pointOf(container, 11).getAttribute("aria-label")).toBe(
        "Week 11, High week, 85%",
      ),
    );
    // The planning gets the stored macrocycle.
    expect(onSaved).toHaveBeenCalledWith(saved);
  });

  it("continues and goes back on the same page", async () => {
    renderIn(
      <IntensityPlanner
        mode="weeks"
        macrocycle={macrocycle}
        onSaved={onSaved}
        onContinue={onContinue}
        onBack={onBack}
      />,
    );
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to exercises" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Back to curve" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("saves dragged borders", async () => {
    const moved = {
      ...macrocycle,
      mesocycles: [
        {
          type: "general_preparation",
          firstWeek: 1,
          lastWeek: 5,
          exerciseNumbers: [],
        },
        {
          type: "special_preparation",
          firstWeek: 6,
          lastWeek: 13,
          exerciseNumbers: [],
        },
        {
          type: "competition_preparation",
          firstWeek: 14,
          lastWeek: 21,
          exerciseNumbers: [],
        },
      ],
    };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(moved), { status: 200 }),
    );
    const { container } = renderIn(
      <IntensityPlanner
        mode="weeks"
        macrocycle={macrocycle}
        onSaved={onSaved}
        onContinue={onContinue}
        onBack={onBack}
      />,
    );
    const first = container.querySelector('[data-border="0"]')!;
    fireEvent.pointerDown(first, { clientX: 160, pointerId: 1 });
    fireEvent.pointerMove(first, { clientX: 232, pointerId: 1 });
    fireEvent.pointerUp(first, { clientX: 232, pointerId: 1 });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/athletes/a1/macrocycle/mesocycles/borders");
    expect(JSON.parse(init.body)).toEqual({
      specialPreparationStart: 6,
      competitionPreparationStart: 14,
    });
    await waitFor(() =>
      expect(
        container
          .querySelector('[data-border="0"]')!
          .getAttribute("aria-label"),
      ).toBe("Special preparation block from week 6"),
    );
  });

  it("reverts and shows a message when saving fails", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }));
    const { container } = renderIn(
      <IntensityPlanner
        mode="weeks"
        macrocycle={macrocycle}
        onSaved={onSaved}
        onContinue={onContinue}
        onBack={onBack}
      />,
    );
    const column = container.querySelector('rect[data-week="11"]')!;
    fireEvent.pointerDown(column, { clientY: 240, pointerId: 1 });
    fireEvent.pointerUp(column, { clientY: 240, pointerId: 1 });
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(pointOf(container, 11).getAttribute("aria-label")).toBe(
      "Week 11, Medium week, 80%",
    );
  });

  it("shows the anchors in the curve step and the week handles in the weeks step", () => {
    const curveStep = renderIn(
      <IntensityPlanner
        mode="curve"
        macrocycle={macrocycle}
        onSaved={onSaved}
        onContinue={onContinue}
        onBack={onBack}
      />,
    );
    expect(
      curveStep.container.querySelector('[data-anchor="entry"]'),
    ).toBeTruthy();
    expect(curveStep.container.querySelector("[data-border]")).toBeNull();
    expect(curveStep.container.querySelector("rect[data-week]")).toBeNull();
    expect(
      screen.getByText(
        "Shape the overall progression curve. Add new anchors by clicking into the curve and drag them around to shape the progression for your athlete. High and low weeks can be set in the next step.",
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Weeks" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Continue to weeks" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back to SWOT" })).toBeTruthy();
    cleanup();
    const weeksStep = renderIn(
      <IntensityPlanner
        mode="weeks"
        macrocycle={macrocycle}
        onSaved={onSaved}
        onContinue={onContinue}
        onBack={onBack}
      />,
    );
    expect(
      weeksStep.container.querySelector('[data-anchor="entry"]'),
    ).toBeNull();
    expect(weeksStep.container.querySelector("[data-border]")).toBeTruthy();
    expect(weeksStep.container.querySelector("rect[data-week]")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Continue to exercises" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back to curve" })).toBeTruthy();
  });

  it("saves a curve change and takes the server's weeks", async () => {
    const saved = {
      ...macrocycle,
      curve: { entryPct: 60, anchors: [{ t: 0.25, pct: 90 }] },
    };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(saved), { status: 200 }),
    );
    const { container } = renderIn(
      <IntensityPlanner
        mode="curve"
        macrocycle={macrocycle}
        onSaved={onSaved}
        onContinue={onContinue}
        onBack={onBack}
      />,
    );
    const area = container.querySelector("[data-curve-area]")!;
    fireEvent.pointerDown(area, { clientX: 300, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(area, { clientX: 300, clientY: 100, pointerId: 1 });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/athletes/a1/macrocycle/curve");
    expect(init.method).toBe("PUT");
    const body = JSON.parse(init.body);
    expect(body.entryValuePct).toBe(60);
    expect(body.anchors).toHaveLength(1);
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(saved));
  });

  it("reverts a curve change and says so when saving fails", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }));
    const { container } = renderIn(
      <IntensityPlanner
        mode="curve"
        macrocycle={macrocycle}
        onSaved={onSaved}
        onContinue={onContinue}
        onBack={onBack}
      />,
    );
    const area = container.querySelector("[data-curve-area]")!;
    fireEvent.pointerDown(area, { clientX: 300, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(area, { clientX: 300, clientY: 100, pointerId: 1 });
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(container.querySelectorAll("[data-anchor]")).toHaveLength(2);
  });
});
describe("main competition marker", () => {
  const competition = { date: "2027-04-24", type: "German Championships" };
  const markerOf = (container: HTMLElement) =>
    container.querySelector("[data-competition]")!;
  // Width 800, margins 56/16; day 0 = Monday 2026-11-30. The chart ends at
  // the competition (day 145, Saturday of week 21), or at week 21's point.
  const xOfDay = (day: number, end = 145) =>
    56 + (728 / Math.max(end / 7, 20)) * (day / 7);

  it("draws a line at the competition day, labelled with its name above the chart, where the chart ends", () => {
    const { container } = renderIn(
      <MacrocycleChart
        weeks={makeWeeks()}
        mesocycles={mesocycles}
        competition={competition}
      />,
    );
    const marker = markerOf(container);
    expect(marker.getAttribute("aria-label")).toBe(
      "Main competition: German Championships, Apr 24, 2027",
    );
    // Saturday of week 21 = day 145.
    const line = marker.querySelector("line")!;
    expect(Number(line.getAttribute("x1"))).toBeCloseTo(xOfDay(145), 5);
    // The curve continues to the competition and the chart ends there.
    expect(Number(line.getAttribute("x1"))).toBeCloseTo(784, 5);
    expect(container.querySelector("[data-line]")!.getAttribute("d")).toMatch(
      /784\.0,[\d.]+$/,
    );
    const text = marker.querySelector("text")!;
    expect(text.textContent).toBe("German Championships");
    // Same style as the mesocycle labels, one row above them (plot top 44).
    expect(text.getAttribute("y")).toBe("20");
    expect(text.getAttribute("class")).toBe(
      "fill-zinc-600 text-[11px] dark:fill-zinc-400",
    );
    expect(text.getAttribute("text-anchor")).toBe("end");
    expect(Number(text.getAttribute("x"))).toBeCloseTo(xOfDay(145) - 4, 5);
    expect(screen.getByRole("list", { name: "Legend" }).textContent).toContain(
      "Main competition",
    );
  });

  it("labels the blocks with their abbreviations, with the competition's name one row above them so none is hidden", () => {
    const blockLabels = (container: HTMLElement) =>
      [...container.querySelectorAll("svg text")]
        .map((t) => t.textContent)
        .filter((t) => ["GPB", "SPB", "CPB"].includes(t!));
    const { container } = renderIn(
      <MacrocycleChart
        weeks={makeWeeks()}
        mesocycles={mesocycles}
        competition={competition}
      />,
    );
    expect(blockLabels(container)).toEqual(["GPB", "SPB", "CPB"]);
    cleanup();
    // On a phone the competition label reaches into the CPB label.
    containerWidth = 390;
    const view = renderIn(
      <MacrocycleChart
        weeks={makeWeeks()}
        mesocycles={mesocycles}
        competition={competition}
      />,
    );
    expect(blockLabels(view.container)).toEqual(["GPB", "SPB", "CPB"]);
    const rowOf = (text: string) =>
      Number(
        [...view.container.querySelectorAll("svg text")]
          .find((t) => t.textContent === text)!
          .getAttribute("y"),
      );
    expect(rowOf("German Championships")).toBe(rowOf("CPB") - 16);
  });

  it("starts at the line early in the cycle", () => {
    const { container } = renderIn(
      <MacrocycleChart
        weeks={makeWeeks()}
        mesocycles={mesocycles}
        competition={{ date: "2026-12-12", type: "Club competition" }}
      />,
    );
    const text = markerOf(container).querySelector("text")!;
    expect(text.getAttribute("text-anchor")).toBe("start");
    // The cycle ends at week 21's point (day 140).
    expect(Number(text.getAttribute("x"))).toBeCloseTo(xOfDay(12, 140) + 4, 5);
  });

  it("marks a competition after the cycle at the end, with its name only", () => {
    const { container } = renderIn(
      <MacrocycleChart
        weeks={makeWeeks()}
        mesocycles={mesocycles}
        competition={{ date: "2027-05-08", type: "European Championships" }}
      />,
    );
    const marker = markerOf(container);
    expect(
      Number(marker.querySelector("line")!.getAttribute("x1")),
    ).toBeCloseTo(784, 5);
    expect(marker.querySelector("text")!.textContent).toBe(
      "European Championships",
    );
  });

  it("shortens a long type to the available width and keeps it in the label", () => {
    containerWidth = 390;
    const type =
      "International Weightlifting Federation Junior World Championships";
    const { container } = renderIn(
      <MacrocycleChart
        weeks={makeWeeks()}
        mesocycles={mesocycles}
        competition={{ ...competition, type }}
      />,
    );
    const marker = markerOf(container);
    const text = marker.querySelector("text")!.textContent!;
    expect(text).toMatch(/…$/);
    // Fits between the y-axis and the line.
    expect(text.length * 6.2).toBeLessThanOrEqual(
      Number(marker.querySelector("text")!.getAttribute("x")) - 44,
    );
    expect(marker.getAttribute("aria-label")).toContain(type);
  });

  it("is not drawn for an invalid date", () => {
    const { container } = renderIn(
      <MacrocycleChart
        weeks={makeWeeks()}
        mesocycles={mesocycles}
        competition={{ date: "", type: "x" }}
      />,
    );
    expect(container.querySelector("[data-competition]")).toBeNull();
  });

  it("is not drawn without a competition, and names the German date only for screen readers", () => {
    const { container } = renderIn(
      <MacrocycleChart weeks={makeWeeks()} mesocycles={mesocycles} />,
    );
    expect(container.querySelector("[data-competition]")).toBeNull();
    cleanup();
    const view = renderIn(
      <MacrocycleChart
        weeks={makeWeeks()}
        mesocycles={mesocycles}
        competition={competition}
      />,
      "de",
    );
    expect(
      view.container.querySelector("[data-competition] text")!.textContent,
    ).toBe("German Championships");
    expect(
      view.container
        .querySelector("[data-competition]")!
        .getAttribute("aria-label"),
    ).toContain("24.04.2027");
  });

  const segmentsOf = (container: HTMLElement) =>
    [...container.querySelectorAll("[data-competition-line]")].map((l) => [
      Number(l.getAttribute("y1")),
      Number(l.getAttribute("y2")),
    ]);
  // Planning chart at 800 px: the competition's row puts the plot at 44;
  // the plot keeps the desktop proportions (220 px high at 960 px).
  const plotTop = 44;
  const plotBottom = 44 + 220 * (800 / 960);

  it("runs the line from the top of the name to the plot's bottom", () => {
    const { container } = renderIn(
      <MacrocycleChart
        weeks={makeWeeks()}
        mesocycles={mesocycles}
        competition={competition}
      />,
    );
    const name = markerOf(container).querySelector("text")!;
    const segments = segmentsOf(container);
    expect(segments).toHaveLength(1);
    const [top, bottom] = segments[0]!;
    // The name's baseline is 24 px above the plot; its top 8 px higher.
    expect(Number(name.getAttribute("y"))).toBe(plotTop - 24);
    expect(top).toBe(plotTop - 32);
    expect(top).toBeGreaterThan(0);
    expect(bottom).toBeCloseTo(plotBottom, 5);
  });

  it("leaves a gap over a block label the line would cross", () => {
    // Competition preparation starts in week 14 (day 91); the competition is
    // three days later, so the line would run through "CPB".
    const { container } = renderIn(
      <MacrocycleChart
        weeks={makeWeeks()}
        mesocycles={mesocycles}
        competition={{ date: "2027-03-04", type: "Club competition" }}
      />,
    );
    const segments = segmentsOf(container);
    expect(segments).toHaveLength(2);
    // The gap covers the block labels' row (baseline 8 px above the plot,
    // 8 px cap height) with 3 px to spare on both sides.
    expect(segments[0]).toEqual([plotTop - 32, plotTop - 19]);
    expect(segments[1]![0]).toBe(plotTop - 5);
    expect(segments[1]![1]).toBeCloseTo(plotBottom, 5);
    const cpb = [...container.querySelectorAll("svg text")].find(
      (t) => t.textContent === "CPB",
    )!;
    expect(Number(cpb.getAttribute("y"))).toBe(plotTop - 8);
  });
});

describe("curve mode", () => {
  // Width 800, y-axis margins 56/16, no competition: week 1 at x = 56, week
  // 21 at x = 784; plot from y = 28, 220 px at 960 → 183.3 px, 0–110 %.
  const xOfT = (t: number) => 56 + 728 * t;
  const height = 220 * (800 / 960);
  const yOf = (pct: number) => 28 + height * (1 - pct / 110);
  const renderCurve = (curve: Curve, onChange = vi.fn()) => {
    const view = renderIn(
      <MacrocycleChart
        weeks={makeWeeks()}
        mesocycles={mesocycles}
        onLevelChange={() => {}}
        onBordersChange={() => {}}
        curveEditor={{ curve, onChange }}
      />,
    );
    return { ...view, onChange };
  };
  const press = (
    el: Element,
    from: [number, number],
    to: [number, number] = from,
  ) => {
    fireEvent.pointerDown(el, {
      clientX: from[0],
      clientY: from[1],
      pointerId: 1,
    });
    if (to !== from)
      fireEvent.pointerMove(el, {
        clientX: to[0],
        clientY: to[1],
        pointerId: 1,
      });
    fireEvent.pointerUp(el, { clientX: to[0], clientY: to[1], pointerId: 1 });
  };
  const line = { entryPct: 60, anchors: [] };
  const withAnchor = { entryPct: 60, anchors: [{ t: 0.25, pct: 90 }] };

  it("shows the anchors instead of week handles and border sliders", () => {
    const { container } = renderCurve(withAnchor);
    expect(
      [...container.querySelectorAll("[data-anchor]")].map((a) =>
        a.getAttribute("aria-label"),
      ),
    ).toEqual(["Entry value 60%", "Anchor at week 6: 90%", "End value 100%"]);
    expect(container.querySelector("[data-border]")).toBeNull();
    expect(container.querySelector("[data-point]")).toBeNull();
    // The curve is the spline itself: it passes the anchor.
    expect(
      container.querySelector("[data-line]")!.getAttribute("d"),
    ).toBeTruthy();
  });

  it("adds an anchor where the chart is clicked", () => {
    const { container, onChange } = renderCurve(line);
    press(container.querySelector("[data-curve-area]")!, [xOfT(0.25), yOf(90)]);
    const [curve] = onChange.mock.calls[0]!;
    expect(curve.entryPct).toBe(60);
    expect(curve.anchors).toHaveLength(1);
    expect(curve.anchors[0].t).toBeCloseTo(0.25, 3);
    expect(curve.anchors[0].pct).toBeCloseTo(90, 0);
  });

  it("drags an inner anchor smoothly, without snapping to weeks", () => {
    const { container, onChange } = renderCurve(withAnchor);
    press(
      container.querySelector('[data-anchor="0"]')!,
      [xOfT(0.25), yOf(90)],
      [xOfT(0.37), yOf(85)],
    );
    const [curve] = onChange.mock.calls[0]!;
    expect(curve.anchors[0].t).toBeCloseTo(0.37, 3);
    // Week 8.4: between weeks 8 and 9, not snapped.
    expect(1 + curve.anchors[0].t * 20).toBeCloseTo(8.4, 1);
    expect(curve.anchors[0].pct).toBeCloseTo(85, 0);
  });

  it("removes an inner anchor by a click", () => {
    const click = renderCurve(withAnchor);
    press(click.container.querySelector('[data-anchor="0"]')!, [
      xOfT(0.25),
      yOf(90),
    ]);
    expect(click.onChange).toHaveBeenCalledWith(
      expect.objectContaining({ entryPct: 60, anchors: [] }),
    );
  });

  it("removes an inner anchor as soon as it comes within half a week of a neighbour, before release", () => {
    // 21 weeks: one week is 728 / 20 = 36.4 px, half a week 18.2 px.
    const week = 728 / 20;
    const { container, onChange } = renderCurve(withAnchor);
    const anchor = container.querySelector('[data-anchor="0"]')!;
    fireEvent.pointerDown(anchor, {
      clientX: xOfT(0.25),
      clientY: yOf(90),
      pointerId: 1,
    });
    // 0.6 weeks right of the entry anchor: still there.
    fireEvent.pointerMove(anchor, {
      clientX: xOfT(0) + 0.6 * week,
      clientY: yOf(80),
      pointerId: 1,
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(container.querySelector('[data-anchor="0"]')).toBeTruthy();
    // 0.4 weeks: removed and saved at once, the pointer still down.
    fireEvent.pointerMove(anchor, {
      clientX: xOfT(0) + 0.4 * week,
      clientY: yOf(80),
      pointerId: 1,
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ anchors: [] }),
    );
    // Releasing afterwards saves nothing more.
    fireEvent.pointerUp(anchor, {
      clientX: xOfT(0) + 0.4 * week,
      clientY: yOf(80),
      pointerId: 1,
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("moves an inner anchor dropped away from its neighbours", () => {
    const far = renderCurve(withAnchor);
    press(
      far.container.querySelector('[data-anchor="0"]')!,
      [xOfT(0.25), yOf(90)],
      [xOfT(0.4), yOf(80)],
    );
    const [moved] = far.onChange.mock.calls[0]!;
    expect(moved.anchors).toHaveLength(1);
    expect(moved.anchors[0].t).toBeCloseTo(0.4, 3);
  });

  it("moves the entry anchor in any direction, within 30–95 %, and never removes it", () => {
    const moved = renderCurve(line);
    press(
      moved.container.querySelector('[data-anchor="entry"]')!,
      [xOfT(0), yOf(60)],
      [xOfT(0.3), yOf(65)],
    );
    const [curve] = moved.onChange.mock.calls[0]!;
    expect(curve.entryPct).toBeCloseTo(65, 0);
    expect(curve.entryT).toBeCloseTo(0.3, 3);
    expect(curve.anchors).toEqual([]);
    cleanup();
    const low = renderCurve(line);
    press(
      low.container.querySelector('[data-anchor="entry"]')!,
      [xOfT(0), yOf(60)],
      [xOfT(0), yOf(10)],
    );
    expect(low.onChange.mock.calls[0]![0].entryPct).toBe(30);
    cleanup();
    // A click on the entry anchor changes nothing.
    const clicked = renderCurve(line);
    press(clicked.container.querySelector('[data-anchor="entry"]')!, [
      xOfT(0),
      yOf(60),
    ]);
    expect(clicked.onChange).not.toHaveBeenCalled();
  });

  it("draws horizontal guides at the entry and end values that move with their anchors", () => {
    const { container } = renderCurve({
      entryPct: 60,
      anchors: [],
      endPct: 95,
    });
    const guide = (kind: string) =>
      container.querySelector(`[data-guide="${kind}"]`)!;
    for (const [kind, pct] of [
      ["entry", 60],
      ["end", 95],
    ] as const) {
      expect(Number(guide(kind).getAttribute("y1"))).toBeCloseTo(yOf(pct), 5);
      expect(Number(guide(kind).getAttribute("x1"))).toBe(56);
      // The style of the block start lines.
      expect(guide(kind).getAttribute("stroke")).toBe("var(--chart-ink)");
      expect(guide(kind).getAttribute("stroke-opacity")).toBe("0.25");
    }
    // While the entry anchor is dragged, its guide follows.
    const entry = container.querySelector('[data-anchor="entry"]')!;
    fireEvent.pointerDown(entry, {
      clientX: xOfT(0),
      clientY: yOf(60),
      pointerId: 1,
    });
    fireEvent.pointerMove(entry, {
      clientX: xOfT(0),
      clientY: yOf(70),
      pointerId: 1,
    });
    expect(Number(guide("entry").getAttribute("y1"))).toBeCloseTo(yOf(70), 5);
  });

  it("snaps the entry and end anchors to whole weeks and the entry value to whole percents", () => {
    const entry = renderCurve(line);
    press(
      entry.container.querySelector('[data-anchor="entry"]')!,
      [xOfT(0), yOf(60)],
      [xOfT(0.33), yOf(64.4)],
    );
    const [moved] = entry.onChange.mock.calls[0]!;
    // t 0.33 of 20 weeks' steps is closest to week 8 (t = 7/20).
    expect(moved.entryT).toBeCloseTo(7 / 20, 12);
    expect(Number.isInteger(moved.entryPct)).toBe(true);
    expect(moved.entryPct).toBe(64);
    cleanup();
    const end = renderCurve(line);
    press(
      end.container.querySelector('[data-anchor="end"]')!,
      [xOfT(1), yOf(100)],
      [xOfT(0.77), yOf(95)],
    );
    expect(end.onChange.mock.calls[0]![0].endT).toBeCloseTo(15 / 20, 12);
  });

  it("keeps the end value above the entry value", () => {
    const end = renderCurve(line);
    press(
      end.container.querySelector('[data-anchor="end"]')!,
      [xOfT(1), yOf(100)],
      [xOfT(1), yOf(40)],
    );
    expect(end.onChange.mock.calls[0]![0].endPct).toBe(61);
    cleanup();
    const entry = renderCurve({ entryPct: 60, anchors: [], endPct: 70 });
    press(
      entry.container.querySelector('[data-anchor="entry"]')!,
      [xOfT(0), yOf(60)],
      [xOfT(0), yOf(90)],
    );
    expect(entry.onChange.mock.calls[0]![0].entryPct).toBe(69);
  });

  it("moves the end anchor in any direction and never removes it", () => {
    const { container, onChange } = renderCurve(line);
    press(
      container.querySelector('[data-anchor="end"]')!,
      [xOfT(1), yOf(100)],
      [xOfT(0.8), yOf(95)],
    );
    const [curve] = onChange.mock.calls[0]!;
    expect(curve.endT).toBeCloseTo(0.8, 3);
    expect(curve.endPct).toBeCloseTo(95, 0);
    cleanup();
    const clicked = renderCurve(line);
    press(clicked.container.querySelector('[data-anchor="end"]')!, [
      xOfT(1),
      yOf(100),
    ]);
    expect(clicked.onChange).not.toHaveBeenCalled();
  });

  it("shows the value next to an outer anchor while it is moved", () => {
    const { container } = renderCurve(line);
    const end = container.querySelector('[data-anchor="end"]')!;
    expect(container.querySelector("[data-anchor-value]")).toBeNull();
    fireEvent.pointerDown(end, {
      clientX: xOfT(1),
      clientY: yOf(100),
      pointerId: 1,
    });
    fireEvent.pointerMove(end, {
      clientX: xOfT(0.9),
      clientY: yOf(95),
      pointerId: 1,
    });
    expect(container.querySelector("[data-anchor-value]")!.textContent).toMatch(
      /^End value 9[45](\.\d)?%$/,
    );
    fireEvent.pointerUp(end, {
      clientX: xOfT(0.9),
      clientY: yOf(95),
      pointerId: 1,
    });
    expect(container.querySelector("[data-anchor-value]")).toBeNull();
    cleanup();
    const view = renderCurve(line);
    const entry = view.container.querySelector('[data-anchor="entry"]')!;
    fireEvent.pointerDown(entry, {
      clientX: xOfT(0),
      clientY: yOf(60),
      pointerId: 1,
    });
    fireEvent.pointerMove(entry, {
      clientX: xOfT(0.1),
      clientY: yOf(70),
      pointerId: 1,
    });
    expect(
      view.container.querySelector("[data-anchor-value]")!.textContent,
    ).toMatch(/^Entry value (69|70)(\.\d)?%$/);
  });

  it("continues to the competition at the end value, not at 100 %", () => {
    const view = renderIn(
      <MacrocycleChart
        weeks={makeWeeks()}
        mesocycles={mesocycles}
        competition={{ date: "2027-04-24", type: "German Championships" }}
        curveEditor={{
          curve: { entryPct: 60, anchors: [], endPct: 95, endT: 0.8 },
          onChange: vi.fn(),
        }}
      />,
    );
    const d = view.container.querySelector("[data-line]")!.getAttribute("d")!;
    const points = [...d.matchAll(/([\d.]+),([\d.]+)/g)].map((m) =>
      Number(m[2]),
    );
    // The last two points (week 21 and the competition) have the same height.
    expect(points.at(-1)).toBeCloseTo(points.at(-2)!, 0);
  });

  it("draws the curve level from moved outer anchors to the start and the end", () => {
    const { container } = renderCurve({
      entryPct: 60,
      entryT: 0.2,
      anchors: [],
      endPct: 95,
      endT: 0.8,
    });
    const d = container.querySelector("[data-line]")!.getAttribute("d")!;
    const ys = [...d.matchAll(/([\d.]+),([\d.]+)/g)].map((m) => [
      Number(m[1]),
      Number(m[2]),
    ]);
    const yAt = (x: number) =>
      ys.reduce((best, p) =>
        Math.abs(p[0]! - x) < Math.abs(best[0]! - x) ? p : best,
      )[1]!;
    expect(yAt(xOfT(0.05))).toBeCloseTo(yOf(60), 0);
    expect(yAt(xOfT(0.15))).toBeCloseTo(yOf(60), 0);
    expect(yAt(xOfT(0.9))).toBeCloseTo(yOf(95), 0);
    expect(yAt(xOfT(1))).toBeCloseTo(yOf(95), 0);
  });
});
