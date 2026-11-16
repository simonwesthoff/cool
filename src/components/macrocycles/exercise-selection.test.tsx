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
import type {
  Exercise,
  ExerciseGroup,
  ReferenceLift,
} from "@/domain/exercises/catalog-types";
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

const tag = (de: string, en: string) => ({ key: de, name: { de, en } });
const exercise = (
  number: number,
  en: string,
  referenceLift: ReferenceLift | null,
  addresses: Exercise["addresses"] = [],
  comment: string | null = null,
): Exercise => ({
  number,
  groupNumber: 2,
  name: { de: en, en },
  referenceLift,
  bestValuePct: null,
  maxWeeklyAverageWeightPct: null,
  repsPerSet: { min: null, max: null },
  repsPerWeek: { min: null, max: null },
  comment: comment ? { de: comment, en: comment } : null,
  addresses,
});
const catalog: ExerciseGroup[] = [
  {
    number: 2,
    code: "K2",
    name: { de: "TWKÜ", en: "Partial competition exercises" },
    exercises: [
      exercise(
        7,
        "Power snatch",
        "snatch",
        [
          tag("Beschleunigung im 2. Zug", "Acceleration in the second pull"),
          tag("Hoher Zug", "High pull"),
        ],
        "Variations: from blocks",
      ),
      exercise(12, "Power jerk", "clean_and_jerk", [
        tag("Rhythmus im Auftakt", "Rhythm in the dip"),
      ]),
      exercise(33, "Pull-up", null),
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
  snatchDeficits: "Slow turnover",
  cleanDeficits: "Catch too soft",
  jerkDeficits: "",
  otherDeficits: "Ankle mobility",
  mesocycles: mesocycles(
    [
      {
        exerciseNumber: 12,
        variation: "From the rack",
        tags: ["Rhythmus im Auftakt"],
        note: null,
      },
    ],
    [{ exerciseNumber: 7, variation: null, tags: [], note: null }],
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
const open = (name: string) =>
  userEvent.click(screen.getByRole("button", { name }));
const deficitKeys = () =>
  [...dialog().querySelectorAll("[data-deficit]")].map((el) =>
    el.getAttribute("data-deficit"),
  );

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
      "K2 · TWKÜ",
    ]);
    expect(
      within(table).getByRole("rowheader", { name: /Power snatch/ }),
    ).toBeTruthy();
  });

  it("shows chosen cells with their variation and marks a missing reason", () => {
    renderIt();
    expect(
      screen.getByRole("button", {
        name: "Power jerk, Special preparation block: chosen, From the rack",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: "Power snatch, General preparation block: chosen, Standard, Reason missing",
      }),
    ).toBeTruthy();
  });

  it("shows the variation below the check mark, and no text without one", () => {
    renderIt();
    const withVariation = screen.getByRole("button", {
      name: "Power jerk, Special preparation block: chosen, From the rack",
    });
    expect(withVariation.textContent).toBe("From the rack");
    // Chosen without a variation and with a reason: check mark only.
    cleanup();
    const plain = {
      ...macrocycle,
      mesocycles: mesocycles([
        { exerciseNumber: 7, variation: null, tags: ["Hoher Zug"], note: null },
      ]),
    } as unknown as Macrocycle;
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <ExerciseSelection macrocycle={plain} catalog={catalog} />
      </NextIntlClientProvider>,
    );
    const cell = screen.getByRole("button", {
      name: "Power snatch, Special preparation block: chosen, Standard",
    });
    expect(cell.textContent).toBe("");
    expect(cell.querySelector("svg")).toBeTruthy();
  });

  it("shows the snatch and other deficits for a snatch exercise", async () => {
    renderIt();
    await open("Power snatch, Special preparation block: choose");
    expect(dialog().querySelector("h2")!.textContent).toBe("7 Power snatch");
    expect(dialog().textContent).toContain(
      "Special preparation block · Snatch exercise",
    );
    expect(deficitKeys()).toEqual(["snatchDeficits", "otherDeficits"]);
    const deficits = within(dialog()).getByRole("region", {
      name: "Athlete's deficits",
    });
    expect(deficits.textContent).toContain(
      "Deficits in the snatchSlow turnover",
    );
    expect(deficits.textContent).toContain("Other deficitsAnkle mobility");
  });

  it("shows clean, jerk and other deficits for a clean & jerk exercise, and only other ones without a reference lift", async () => {
    renderIt();
    await open("Power jerk, General preparation block: choose");
    expect(deficitKeys()).toEqual([
      "cleanDeficits",
      "jerkDeficits",
      "otherDeficits",
    ]);
    expect(dialog().textContent).toContain(
      "Deficits in the jerkNot entered yet",
    );
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Cancel" }),
    );
    await open("Pull-up, General preparation block: choose");
    expect(deficitKeys()).toEqual(["otherDeficits"]);
    expect(dialog().textContent).toContain("please write a note");
  });

  it("chooses an exercise by tapping tags", async () => {
    const saved = {
      ...macrocycle,
      mesocycles: mesocycles([
        {
          exerciseNumber: 7,
          variation: "From blocks",
          tags: ["Beschleunigung im 2. Zug", "Hoher Zug"],
          note: null,
        },
      ]),
    };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(saved), { status: 200 }),
    );
    renderIt();
    await open("Power snatch, Special preparation block: choose");
    const high = within(dialog()).getByRole("button", { name: "High pull" });
    const acceleration = within(dialog()).getByRole("button", {
      name: "Acceleration in the second pull",
    });
    expect(high.getAttribute("aria-pressed")).toBe("false");
    // Tapped in reverse order; saved in the catalog order.
    await userEvent.click(high);
    await userEvent.click(acceleration);
    expect(high.getAttribute("aria-pressed")).toBe("true");
    await userEvent.type(
      within(dialog()).getByLabelText(/Variation/),
      "From blocks",
    );
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Choose exercise" }),
    );

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      "/api/athletes/a1/macrocycle/mesocycles/special_preparation/exercises/7",
    );
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body)).toEqual({
      tags: ["Beschleunigung im 2. Zug", "Hoher Zug"],
      note: null,
      variation: "From blocks",
    });
    expect(
      await screen.findByRole("button", {
        name: "Power snatch, Special preparation block: chosen, From blocks",
      }),
    ).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("chooses an exercise without tags with a note", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(macrocycle), { status: 200 }),
    );
    renderIt();
    await open("Pull-up, General preparation block: choose");
    await userEvent.type(
      within(dialog()).getByLabelText(/Note/),
      "Back strength",
    );
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Choose exercise" }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual({
      tags: [],
      note: "Back strength",
      variation: null,
    });
  });

  it("requires a tag or a note", async () => {
    renderIt();
    await open("Power snatch, Special preparation block: choose");
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Choose exercise" }),
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(dialog().textContent).toContain(
      "Choose at least one point or write a note.",
    );
    expect(
      within(dialog()).getByLabelText(/Note/).getAttribute("aria-invalid"),
    ).toBe("true");
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "High pull" }),
    );
    expect(dialog().textContent).not.toContain(
      "Choose at least one point or write a note.",
    );
  });

  it("edits an existing choice and removes it", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    renderIt();
    await open("Power jerk, Special preparation block: chosen, From the rack");
    expect(
      within(dialog())
        .getByRole("button", { name: "Rhythm in the dip" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      (within(dialog()).getByLabelText(/Variation/) as HTMLInputElement).value,
    ).toBe("From the rack");
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Remove" }),
    );
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      "/api/athletes/a1/macrocycle/mesocycles/special_preparation/exercises/12",
    );
    expect(init.method).toBe("DELETE");
    expect(
      await screen.findByRole("button", {
        name: "Power jerk, Special preparation block: choose",
      }),
    ).toBeTruthy();
  });

  it("keeps the dialog open with a message when saving fails", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }));
    renderIt();
    await open("Power snatch, Special preparation block: choose");
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "High pull" }),
    );
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Choose exercise" }),
    );
    await waitFor(() =>
      expect(within(dialog()).getByRole("alert")).toBeTruthy(),
    );
    expect(
      screen.getByRole("button", {
        name: "Power snatch, Special preparation block: choose",
      }),
    ).toBeTruthy();
  });

  it("shows German tags and deficit labels", async () => {
    renderIt("de");
    await open("Power snatch, Aufbauphase (ABP): wählen");
    expect(
      within(dialog()).getByRole("button", { name: "Hoher Zug" }),
    ).toBeTruthy();
    expect(dialog().textContent).toContain("Defizite im ReißenSlow turnover");
  });

  it("finishes on the athlete details page", () => {
    renderIt();
    expect(
      screen.getByRole("link", { name: "Finish planning" }),
    ).toHaveProperty("pathname", "/athletes/a1");
  });
});

describe("ExerciseChoiceDialog closing", () => {
  it("stays open for a cell opened before the previous close event arrived", async () => {
    renderIt();
    await open("Power jerk, General preparation block: choose");
    const element = dialog() as HTMLDialogElement;
    // Close without the event, open another cell, then deliver the late event.
    element.removeAttribute("open");
    await open("Pull-up, General preparation block: choose");
    element.dispatchEvent(new Event("close"));
    await waitFor(() =>
      expect(dialog().querySelector("h2")!.textContent).toBe("33 Pull-up"),
    );
  });
});
