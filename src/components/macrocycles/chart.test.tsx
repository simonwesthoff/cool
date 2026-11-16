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
  container.querySelector(`[data-week-point="${week}"]`)!;
const dotX = (container: HTMLElement, week: number) =>
  Number(
    pointOf(container, week).querySelectorAll("circle")[1]!.getAttribute("cx"),
  );

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
      <MacrocycleChart weeks={weeks} mesocycles={splitMesocycles(count)} />,
    );
    const svg = container.querySelector("svg")!;
    expect(Number(svg.getAttribute("width"))).toBe(widthPx);
    expect(dotX(container, count)).toBeLessThan(widthPx);
    expect(dotX(container, 1)).toBeGreaterThan(0);
    // Points never get smaller than a 2.5 px radius.
    const r = Number(
      pointOf(container, 1).querySelectorAll("circle")[1]!.getAttribute("r"),
    );
    expect(r).toBeGreaterThanOrEqual(2.5);
  });
});

describe("week positions and colours", () => {
  it("puts a week's point and number at the start of its area (on the block border)", () => {
    const { container } = renderIn(
      <MacrocycleChart weeks={makeWeeks()} mesocycles={mesocycles} />,
    );
    const bands = container.querySelectorAll(
      'svg[aria-label="Intensity per week"] > g > rect',
    );
    const specialStart = Number(bands[1]!.getAttribute("x"));
    expect(dotX(container, 4)).toBeCloseTo(specialStart, 5);
    const labels = [...container.querySelectorAll("text")].filter((t) =>
      /^\d+$/.test(t.textContent ?? ""),
    );
    const label4 = labels.find((t) => t.textContent === "4")!;
    expect(Number(label4.getAttribute("x"))).toBeCloseTo(specialStart, 5);
    const numbers = labels.map((t) => Number(t.textContent));
    expect(numbers).toEqual(expect.arrayContaining([1, 4, 14]));
  });

  it("colours the bands with the app palette", () => {
    const { container } = renderIn(
      <MacrocycleChart weeks={makeWeeks()} mesocycles={mesocycles} />,
    );
    const bands = container.querySelectorAll(
      'svg[aria-label="Intensity per week"] > g > rect',
    );
    expect([0, 1, 2].map((i) => bands[i]!.getAttribute("fill"))).toEqual([
      "var(--band-1)",
      "var(--band-2)",
      "var(--band-3)",
    ]);
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

  it("appears left of and below a point at the top right, and shows the volume", () => {
    const { container } = renderIn(
      <MacrocycleChart weeks={makeWeeks()} mesocycles={mesocycles} />,
    );
    fireEvent.pointerEnter(container.querySelector('rect[data-week="21"]')!);
    const tooltip = screen.getByTestId("week-tooltip");
    const tip = box(tooltip);
    const hit = container.querySelector('rect[data-week="21"]')!;
    expect(tip.right).toBeLessThanOrEqual(Number(hit.getAttribute("x")));
    expect(tip.top).toBeGreaterThan(64 + 10);
    expect(tooltip.textContent).toContain("Volume: –");
  });

  it("appears right of and above a point at the bottom left", () => {
    const { container } = renderIn(
      <MacrocycleChart
        weeks={makeWeeks(21, { 1: "low" })}
        mesocycles={mesocycles}
      />,
    );
    fireEvent.pointerEnter(container.querySelector('rect[data-week="1"]')!);
    const tip = box(screen.getByTestId("week-tooltip"));
    const hit = container.querySelector('rect[data-week="1"]')!;
    expect(tip.left).toBeGreaterThanOrEqual(
      Number(hit.getAttribute("x")) + Number(hit.getAttribute("width")),
    );
    expect(tip.bottom).toBeLessThan(230 - 10);
  });

  it("shows a week's volume", () => {
    const { container } = renderIn(
      <MacrocycleChart weeks={makeWeeks()} mesocycles={mesocycles} />,
    );
    fireEvent.pointerEnter(container.querySelector('rect[data-week="11"]')!);
    expect(screen.getByTestId("week-tooltip").textContent).toContain(
      "Volume: 66",
    );
  });
});

describe("IntensityPlanner", () => {
  const fetchMock = vi.fn();
  const macrocycle = {
    athleteId: "a1",
    competitionDate: "2027-04-24",
    competitionType: "German Championships",
    mesocycles: mesocycles.map((m) => ({ ...m, exerciseNumbers: [] })),
    weeks: makeWeeks().map((w) => ({ ...w, exercises: [] })),
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
      <IntensityPlanner macrocycle={macrocycle} />,
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
      <IntensityPlanner macrocycle={macrocycle} />,
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
      <IntensityPlanner macrocycle={macrocycle} />,
    );
    const column = container.querySelector('rect[data-week="11"]')!;
    fireEvent.pointerDown(column, { clientY: 240, pointerId: 1 });
    fireEvent.pointerUp(column, { clientY: 240, pointerId: 1 });
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(pointOf(container, 11).getAttribute("aria-label")).toBe(
      "Week 11, Medium week, 80%",
    );
  });
});

describe("main competition marker", () => {
  const competition = { date: "2027-04-24", type: "German Championships" };
  const markerOf = (container: HTMLElement) =>
    container.querySelector("[data-competition]")!;
  // Width 800, margins 56/16: 21 columns of 728/21 px; day 0 = Monday 2026-11-30.
  const xOfDay = (day: number) => 56 + (728 / 21) * (day / 7);
  const bandLabels = (container: HTMLElement) =>
    [...container.querySelectorAll("svg text")]
      .map((t) => t.textContent)
      .filter((t) => t!.endsWith("preparation"));

  it("draws a line at the competition day, labelled with type and date above the chart", () => {
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
    const line = marker.querySelectorAll("line")[1]!;
    expect(Number(line.getAttribute("x1"))).toBeCloseTo(xOfDay(145), 5);
    const text = marker.querySelector("text")!;
    expect(text.textContent).toBe("German Championships · Apr 24, 2027");
    // Same row and style as the mesocycle labels (y = plot top − 8).
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

  it("hides a mesocycle label it overlaps and keeps the others", () => {
    const { container } = renderIn(
      <MacrocycleChart
        weeks={makeWeeks()}
        mesocycles={mesocycles}
        competition={competition}
      />,
    );
    // The competition preparation label (from week 14) would overlap.
    expect(bandLabels(container)).toEqual(["Special preparation"]);
    cleanup();
    const view = renderIn(
      <MacrocycleChart weeks={makeWeeks()} mesocycles={mesocycles} />,
    );
    expect(bandLabels(view.container)).toEqual([
      "Special preparation",
      "Competition preparation",
    ]);
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
    expect(Number(text.getAttribute("x"))).toBeCloseTo(xOfDay(12) + 4, 5);
  });

  it("marks a competition after the cycle at the end, with type and date only", () => {
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
      "European Championships · May 8, 2027",
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
    expect(text).toMatch(/… · Apr 24, 2027$/);
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

  it("is not drawn without a competition, in German with the German date", () => {
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
    ).toBe("German Championships · 24.04.2027");
  });
});
