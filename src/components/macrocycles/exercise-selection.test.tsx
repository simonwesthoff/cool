// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import type { ExerciseGroup } from "@/domain/exercises/catalog-types";
import type { Macrocycle } from "@/domain/macrocycles/macrocycle-types";
import { ExerciseSelection } from "./exercise-selection";

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const exercise = (number: number, en: string) => ({
  number,
  groupNumber: 3,
  name: { de: en, en },
  referenceLift: null,
  bestValuePct: null,
  maxWeeklyAverageWeightPct: null,
  repsPerSet: { min: null, max: null },
  repsPerWeek: { min: null, max: null },
  comment: null,
});
const catalog: ExerciseGroup[] = [
  {
    number: 3,
    code: "K3",
    name: { de: "SKF", en: "Speed strength" },
    exercises: [exercise(13, "Snatch pull"), exercise(14, "Clean pull")],
  },
];
const macrocycle = {
  athleteId: "a1",
  mesocycles: [
    {
      type: "general_preparation",
      firstWeek: 1,
      lastWeek: 3,
      exerciseNumbers: [],
    },
    {
      type: "special_preparation",
      firstWeek: 4,
      lastWeek: 13,
      exerciseNumbers: [14],
    },
    {
      type: "competition_preparation",
      firstWeek: 14,
      lastWeek: 21,
      exerciseNumbers: [],
    },
  ],
  weeks: [],
} as unknown as Macrocycle;

const renderIt = () =>
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ExerciseSelection macrocycle={macrocycle} catalog={catalog} />
    </NextIntlClientProvider>,
  );

describe("ExerciseSelection", () => {
  it("shows one tab per mesocycle with the number of chosen exercises", () => {
    renderIt();
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual([
      "General preparation (0)",
      "Special preparation (1)",
      "Competition preparation (0)",
    ]);
    expect(
      screen.getByText("General preparation block: weeks 1–3"),
    ).toBeTruthy();
    expect(
      screen.getByRole("group", { name: "K3 · Speed strength" }),
    ).toBeTruthy();
  });

  it("saves the exercises of the active mesocycle on every change", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    renderIt();
    await userEvent.click(
      screen.getByRole("tab", { name: "Special preparation (1)" }),
    );
    expect(screen.getByRole("checkbox", { name: /Clean pull/ })).toHaveProperty(
      "checked",
      true,
    );
    await userEvent.click(
      screen.getByRole("checkbox", { name: /Snatch pull/ }),
    );
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      "/api/athletes/a1/macrocycle/mesocycles/special_preparation/exercises",
    );
    expect(JSON.parse(init.body)).toEqual({ exerciseNumbers: [13, 14] });
    expect(
      screen.getByRole("tab", { name: "Special preparation (2)" }),
    ).toBeTruthy();

    await userEvent.click(screen.getByRole("checkbox", { name: /Clean pull/ }));
    expect(JSON.parse(fetchMock.mock.calls[1]![1].body)).toEqual({
      exerciseNumbers: [13],
    });
  });

  it("reverts and shows a message when saving fails", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }));
    renderIt();
    await userEvent.click(
      screen.getByRole("checkbox", { name: /Snatch pull/ }),
    );
    expect(await screen.findByRole("alert")).toBeTruthy();
    await waitFor(() =>
      expect(
        screen.getByRole("checkbox", { name: /Snatch pull/ }),
      ).toHaveProperty("checked", false),
    );
  });

  it("finishes on the athlete details page", () => {
    renderIt();
    expect(
      screen.getByRole("link", { name: "Finish planning" }),
    ).toHaveProperty("pathname", "/athletes/a1");
  });
});
