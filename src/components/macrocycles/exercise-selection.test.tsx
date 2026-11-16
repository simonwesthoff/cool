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
import type { ExerciseGroup } from "@/domain/exercises/catalog-types";
import type {
  Macrocycle,
  MesocycleExercise,
} from "@/domain/macrocycles/macrocycle-types";
import { ExerciseSelection } from "./exercise-selection";

const fetchMock = vi.fn();
beforeAll(() => {
  // jsdom may lack the modal dialog API; emulate the parts the component uses.
  const proto = HTMLDialogElement.prototype;
  if (!proto.showModal) {
    proto.showModal = function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
    proto.close = function (this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  }
});
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const exercise = (
  number: number,
  en: string,
  comment: string | null = null,
) => ({
  number,
  groupNumber: 3,
  name: { de: en, en },
  referenceLift: null,
  bestValuePct: null,
  maxWeeklyAverageWeightPct: null,
  repsPerSet: { min: null, max: null },
  repsPerWeek: { min: null, max: null },
  comment: comment ? { de: comment, en: comment } : null,
});
const catalog: ExerciseGroup[] = [
  {
    number: 3,
    code: "K3",
    name: { de: "SKF", en: "Speed strength" },
    exercises: [
      exercise(13, "Snatch pull", "Variations: from blocks"),
      exercise(14, "Clean pull"),
    ],
  },
];
const mesocycles = (
  special: MesocycleExercise[],
  general: MesocycleExercise[] = [],
) => [
  {
    type: "general_preparation",
    firstWeek: 1,
    lastWeek: 3,
    exerciseNumbers: general.map((e) => e.exerciseNumber),
    exercises: general,
  },
  {
    type: "special_preparation",
    firstWeek: 4,
    lastWeek: 13,
    exerciseNumbers: special.map((e) => e.exerciseNumber),
    exercises: special,
  },
  {
    type: "competition_preparation",
    firstWeek: 14,
    lastWeek: 21,
    exerciseNumbers: [],
    exercises: [],
  },
];
const macrocycle = {
  athleteId: "a1",
  mesocycles: mesocycles(
    [
      {
        exerciseNumber: 14,
        variation: "From the hang",
        reason: "Pull position",
      },
    ],
    [{ exerciseNumber: 13, variation: null, reason: "" }],
  ),
  weeks: [],
} as unknown as Macrocycle;

const renderIt = (locale: "en" | "de" = "en") =>
  render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "de" ? de : en}
    >
      <ExerciseSelection macrocycle={macrocycle} catalog={catalog} />
    </NextIntlClientProvider>,
  );
const dialog = () => screen.getByRole("dialog");

describe("ExerciseSelection", () => {
  it("is one table with a column per mesocycle", () => {
    renderIt("de");
    const table = screen.getByRole("table");
    const headers = within(table)
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers).toEqual([
      "Übung",
      "GLPWo. 1–3",
      "ABPWo. 4–13",
      "LAPWo. 14–21",
      "K3 · SKF",
    ]);
    expect(
      within(table).getByRole("rowheader", { name: /Snatch pull/ }),
    ).toBeTruthy();
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
  });

  it("shows chosen cells with their variation and marks a missing reason", () => {
    renderIt();
    expect(
      screen.getByRole("button", {
        name: "Clean pull, Special preparation block: chosen, From the hang",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: "Snatch pull, General preparation block: chosen, Standard, Reason missing",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: "Snatch pull, Special preparation block: choose",
      }),
    ).toBeTruthy();
  });

  it("chooses an exercise with variation and reason", async () => {
    const saved = {
      ...macrocycle,
      mesocycles: mesocycles([
        {
          exerciseNumber: 13,
          variation: "From blocks",
          reason: "Pull strength",
        },
        {
          exerciseNumber: 14,
          variation: "From the hang",
          reason: "Pull position",
        },
      ]),
    };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(saved), { status: 200 }),
    );
    renderIt();
    await userEvent.click(
      screen.getByRole("button", {
        name: "Snatch pull, Special preparation block: choose",
      }),
    );
    expect(within(dialog()).getByRole("heading").textContent).toBe(
      "13 Snatch pull",
    );
    expect(dialog().textContent).toContain("Catalog: Variations: from blocks");
    await userEvent.type(
      within(dialog()).getByLabelText(/Variation/),
      "From blocks",
    );
    await userEvent.type(
      within(dialog()).getByLabelText("Reason"),
      "Pull strength",
    );
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Choose exercise" }),
    );

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      "/api/athletes/a1/macrocycle/mesocycles/special_preparation/exercises/13",
    );
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body)).toEqual({
      variation: "From blocks",
      reason: "Pull strength",
    });
    expect(
      await screen.findByRole("button", {
        name: "Snatch pull, Special preparation block: chosen, From blocks",
      }),
    ).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("requires a reason before saving", async () => {
    renderIt();
    await userEvent.click(
      screen.getByRole("button", {
        name: "Clean pull, General preparation block: choose",
      }),
    );
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Choose exercise" }),
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(dialog().textContent).toContain(
      "Please enter why the exercise is chosen.",
    );
    expect(
      within(dialog()).getByLabelText("Reason").getAttribute("aria-invalid"),
    ).toBe("true");
  });

  it("edits an existing choice and removes it", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    renderIt();
    await userEvent.click(
      screen.getByRole("button", {
        name: /Clean pull, Special preparation block: chosen/,
      }),
    );
    expect(
      (within(dialog()).getByLabelText(/Variation/) as HTMLInputElement).value,
    ).toBe("From the hang");
    expect(
      (within(dialog()).getByLabelText("Reason") as HTMLTextAreaElement).value,
    ).toBe("Pull position");
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Remove" }),
    );
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      "/api/athletes/a1/macrocycle/mesocycles/special_preparation/exercises/14",
    );
    expect(init.method).toBe("DELETE");
    expect(
      await screen.findByRole("button", {
        name: "Clean pull, Special preparation block: choose",
      }),
    ).toBeTruthy();
  });

  it("keeps the dialog open with a message when saving fails", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }));
    renderIt();
    await userEvent.click(
      screen.getByRole("button", {
        name: "Clean pull, General preparation block: choose",
      }),
    );
    await userEvent.type(within(dialog()).getByLabelText("Reason"), "Strength");
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Choose exercise" }),
    );
    await waitFor(() =>
      expect(within(dialog()).getByRole("alert")).toBeTruthy(),
    );
    expect(
      screen.getByRole("button", {
        name: "Clean pull, General preparation block: choose",
      }),
    ).toBeTruthy();
  });

  it("finishes on the athlete details page", () => {
    renderIt();
    expect(
      screen.getByRole("link", { name: "Finish planning" }),
    ).toHaveProperty("pathname", "/athletes/a1");
  });
});
