// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
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
afterEach(cleanup);

const mesocycles = splitMesocycles(21);
function makeWeeks(levels: Record<number, WeekLevel> = {}): ChartWeek[] {
  return Array.from({ length: 21 }, (_, i) => {
    const level = levels[i + 1] ?? "medium";
    return {
      number: i + 1,
      startDate: new Date(Date.UTC(2026, 10, 30 + 7 * i))
        .toISOString()
        .slice(0, 10),
      mesocycle: mesocycles.find(
        (m) => i + 1 >= m.firstWeek && i + 1 <= m.lastWeek,
      )!.type,
      level,
      intensityPct:
        Math.round(intensity(0.6, cycleProgress(i + 1, 21), level) * 1000) / 10,
      volume: null,
    };
  });
}

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
    expect(fitsLabel("GLP", 28)).toBe(true);
  });

  it("chooses an axis covering low weeks and clean ticks", () => {
    expect(intensityDomain([60, 80, 100])).toEqual({
      min: 50,
      max: 110,
      ticks: [50, 60, 70, 80, 90, 100, 110],
    });
    expect(intensityDomain([30, 100]).min).toBe(20);
    expect(labelEvery(40)).toBe(1);
    expect(labelEvery(28)).toBe(2);
  });
});

describe("MacrocycleChart", () => {
  it("has a handle per week with its level and intensity as text", () => {
    renderIn(
      <MacrocycleChart
        weeks={makeWeeks({ 11: "high" })}
        mesocycles={mesocycles}
        onLevelChange={() => {}}
      />,
    );
    const sliders = screen.getAllByRole("slider");
    expect(sliders).toHaveLength(21);
    expect(sliders[10]!.getAttribute("aria-valuetext")).toBe(
      "Week 11, High week, 85%",
    );
    expect(sliders[0]!.getAttribute("aria-valuetext")).toBe(
      "Week 1, Medium week, 60%",
    );
  });

  it("names the mesocycles in the legend and the bands", () => {
    renderIn(
      <MacrocycleChart weeks={makeWeeks()} mesocycles={mesocycles} />,
      "de",
    );
    const legend = screen.getByRole("list", { name: "Legende" });
    expect(legend.textContent).toContain("Grundlagenphase (GLP)");
    expect(legend.textContent).toContain("Aufbauphase (ABP)");
    expect(legend.textContent).toContain("Leistungsausprägungsphase (LAP)");
    expect(screen.queryAllByRole("slider")).toHaveLength(0);
  });

  it("changes the level with the arrow keys, one step at a time", async () => {
    const onLevelChange = vi.fn();
    renderIn(
      <MacrocycleChart
        weeks={makeWeeks({ 12: "high" })}
        mesocycles={mesocycles}
        onLevelChange={onLevelChange}
      />,
    );
    const sliders = screen.getAllByRole("slider");
    sliders[10]!.focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(onLevelChange).toHaveBeenLastCalledWith(11, "high");
    await userEvent.keyboard("{ArrowDown}");
    expect(onLevelChange).toHaveBeenLastCalledWith(11, "low");
    onLevelChange.mockReset();
    sliders[11]!.focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(onLevelChange).not.toHaveBeenCalled();
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
    expect(
      screen.getAllByRole("slider")[10]!.getAttribute("aria-valuetext"),
    ).toBe("Week 11, High week, 85%");
    fireEvent.pointerUp(column, { clientY: 64, pointerId: 1 });
    expect(onLevelChange).toHaveBeenCalledWith(11, "high");
  });

  it("moves one step on a tap above or below the point", () => {
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

  it("offers the values as a table", () => {
    renderIn(
      <MacrocycleChart
        weeks={makeWeeks({ 11: "low" })}
        mesocycles={mesocycles}
      />,
    );
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(22);
    expect(rows[11]!.textContent).toContain("Low week");
    expect(rows[11]!.textContent).toContain("75%");
  });
});

describe("week positions", () => {
  it("puts a week's point and number at the start of its area (on the block border)", () => {
    const { container } = renderIn(
      <MacrocycleChart weeks={makeWeeks()} mesocycles={mesocycles} />,
    );
    const bands = container.querySelectorAll(
      'svg[aria-label="Intensity per week"] > g > rect',
    );
    const specialStart = Number(bands[1]!.getAttribute("x"));
    const point4 = screen
      .getAllByRole("img")
      .find((el) => el.getAttribute("aria-label")?.startsWith("Week 4,"))!;
    const dot = point4.querySelectorAll("circle")[1]!;
    expect(Number(dot.getAttribute("cx"))).toBeCloseTo(specialStart, 5);
    const label4 = [...container.querySelectorAll("text")].find(
      (t) => t.textContent === "4",
    )!;
    expect(Number(label4.getAttribute("x"))).toBeCloseTo(specialStart, 5);
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
  const borderSliders = () =>
    screen
      .getAllByRole("slider")
      .filter((el) => el.getAttribute("aria-orientation") === "horizontal");

  it("has two border handles with their position as text", () => {
    renderIn(
      <MacrocycleChart
        weeks={makeWeeks()}
        mesocycles={mesocycles}
        onLevelChange={() => {}}
        onBordersChange={() => {}}
      />,
    );
    expect(
      borderSliders().map((el) => el.getAttribute("aria-valuetext")),
    ).toEqual([
      "Special preparation block from week 4",
      "Competition preparation block from week 14",
    ]);
    expect(
      borderSliders().map((el) => [
        el.getAttribute("aria-valuemin"),
        el.getAttribute("aria-valuemax"),
      ]),
    ).toEqual([
      ["2", "13"],
      ["5", "21"],
    ]);
  });

  it("moves a border one week with the arrow keys and stops at one week per block", async () => {
    const onBordersChange = vi.fn();
    const tight = splitMesocycles(21).map((m, i) =>
      i === 0
        ? { ...m, lastWeek: 3 }
        : i === 1
          ? { ...m, firstWeek: 4, lastWeek: 4 }
          : { ...m, firstWeek: 5 },
    );
    renderIn(
      <MacrocycleChart
        weeks={makeWeeks()}
        mesocycles={tight}
        onBordersChange={onBordersChange}
      />,
    );
    const [first, second] = borderSliders();
    first!.focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onBordersChange).toHaveBeenLastCalledWith(3, 5);
    onBordersChange.mockReset();
    await userEvent.keyboard("{ArrowRight}");
    expect(onBordersChange).not.toHaveBeenCalled();
    second!.focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onBordersChange).not.toHaveBeenCalled();
    await userEvent.keyboard("{ArrowRight}");
    expect(onBordersChange).toHaveBeenLastCalledWith(4, 6);
  });

  it("drags a border to a week boundary and reports it on release", () => {
    const onBordersChange = vi.fn();
    renderIn(
      <MacrocycleChart
        weeks={makeWeeks()}
        mesocycles={mesocycles}
        onBordersChange={onBordersChange}
      />,
    );
    const [first] = borderSliders();
    // Column width (800 − 56) / 21 ≈ 35.4 px from x = 44: week 6 starts at ≈ 221 px.
    fireEvent.pointerDown(first!, { clientX: 150, pointerId: 1 });
    fireEvent.pointerMove(first!, { clientX: 224, pointerId: 1 });
    expect(first!.getAttribute("aria-valuetext")).toBe(
      "Special preparation block from week 6",
    );
    fireEvent.pointerUp(first!, { clientX: 224, pointerId: 1 });
    expect(onBordersChange).toHaveBeenCalledWith(6, 14);
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
  const column = (800 - 56) / 21;
  const centerX = (week: number) => 44 + column * (week - 1);

  it("appears left of and below a point at the top right", () => {
    const { container } = renderIn(
      <MacrocycleChart weeks={makeWeeks()} mesocycles={mesocycles} />,
    );
    fireEvent.pointerEnter(container.querySelector('rect[data-week="21"]')!);
    const tip = box(screen.getByTestId("week-tooltip"));
    // The tooltip stays clear of week 21's whole column (where the pointer is).
    expect(tip.right).toBeLessThanOrEqual(centerX(21) - column / 2);
    // 100 % is near the top of the plot (y ≈ 64), the tooltip is below it.
    expect(tip.top).toBeGreaterThan(64 + 10);
  });

  it("appears right of and above a point at the bottom left", () => {
    const { container } = renderIn(
      <MacrocycleChart
        weeks={makeWeeks({ 1: "low" })}
        mesocycles={mesocycles}
      />,
    );
    fireEvent.pointerEnter(container.querySelector('rect[data-week="1"]')!);
    const tip = box(screen.getByTestId("week-tooltip"));
    expect(tip.left).toBeGreaterThanOrEqual(centerX(1) + column / 2);
    // 55 % is near the bottom of the plot (y ≈ 230), the tooltip is above it.
    expect(tip.bottom).toBeLessThan(230 - 10);
  });
});

describe("IntensityPlanner", () => {
  const fetchMock = vi.fn();
  const macrocycle = {
    athleteId: "a1",
    mesocycles: mesocycles.map((m) => ({ ...m, exerciseNumbers: [] })),
    weeks: makeWeeks().map((w) => ({ ...w, exercises: [] })),
  } as unknown as Macrocycle;
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("saves a changed week level", async () => {
    const saved = { ...macrocycle, weeks: makeWeeks({ 11: "high" }) };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(saved), { status: 200 }),
    );
    renderIn(<IntensityPlanner macrocycle={macrocycle} />);
    screen.getAllByRole("slider")[10]!.focus();
    await userEvent.keyboard("{ArrowUp}");
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/athletes/a1/macrocycle/weeks/11");
    expect(JSON.parse(init.body)).toEqual({ level: "high" });
    await waitFor(() =>
      expect(
        screen.getAllByRole("slider")[10]!.getAttribute("aria-valuetext"),
      ).toBe("Week 11, High week, 85%"),
    );
  });

  it("saves moved borders and shows the new blocks", async () => {
    const moved = {
      ...macrocycle,
      mesocycles: [
        {
          type: "general_preparation",
          firstWeek: 1,
          lastWeek: 4,
          exerciseNumbers: [],
        },
        {
          type: "special_preparation",
          firstWeek: 5,
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
    renderIn(<IntensityPlanner macrocycle={macrocycle} />);
    const border = screen
      .getAllByRole("slider")
      .find((el) => el.getAttribute("aria-orientation") === "horizontal")!;
    border.focus();
    await userEvent.keyboard("{ArrowRight}");
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/athletes/a1/macrocycle/mesocycles/borders");
    expect(JSON.parse(init.body)).toEqual({
      specialPreparationStart: 5,
      competitionPreparationStart: 14,
    });
    await waitFor(() =>
      expect(border.getAttribute("aria-valuetext")).toBe(
        "Special preparation block from week 5",
      ),
    );
  });

  it("reverts and shows a message when saving fails", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }));
    renderIn(<IntensityPlanner macrocycle={macrocycle} />);
    screen.getAllByRole("slider")[10]!.focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(
      screen.getAllByRole("slider")[10]!.getAttribute("aria-valuetext"),
    ).toBe("Week 11, Medium week, 80%");
  });
});
