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
        ownReasons: [],
      },
    ],
    [{ exerciseNumber: 7, variation: null, tags: [], ownReasons: [] }],
  ),
  weeks: [],
} as unknown as Macrocycle;

const onSaved = vi.fn();
const onBack = vi.fn();
const renderIt = (locale: "en" | "de" = "en") =>
  render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "de" ? de : en}
    >
      <ExerciseSelection
        onSaved={onSaved}
        onBack={onBack}
        macrocycle={macrocycle}
        catalog={catalog}
      />
    </NextIntlClientProvider>,
  );
const dialog = () => screen.getByRole("dialog");
const open = (name: string) =>
  userEvent.click(screen.getByRole("button", { name }));
const ownReasonTags = () =>
  [...dialog().querySelectorAll("[data-own-reason]")].map((el) =>
    el.getAttribute("data-own-reason"),
  );
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

  it("shows all deficits above the table instead of an explanation", () => {
    renderIt();
    const deficits = document.querySelector<HTMLElement>(
      'dl[aria-label="Athlete\'s deficits"]',
    )!;
    expect(
      [...deficits.querySelectorAll("dt")].map((d) => d.textContent),
    ).toEqual([
      "Deficits in the snatch",
      "Deficits in the clean",
      "Deficits in the jerk",
      "Other deficits",
    ]);
    expect(
      [...deficits.querySelectorAll("dd")].map((d) => d.textContent),
    ).toEqual([
      "Slow turnover",
      "Catch too soft",
      "Not entered yet",
      "Ankle mobility",
    ]);
    expect(screen.queryByText(/tap a cell/)).toBeNull();
  });

  it("shows the number of chosen exercises per block in a total row", async () => {
    const saved = {
      ...macrocycle,
      mesocycles: mesocycles(
        [
          {
            exerciseNumber: 7,
            variation: null,
            tags: ["Hoher Zug"],
            ownReasons: [],
          },
          {
            exerciseNumber: 12,
            variation: "From the rack",
            tags: ["Rhythmus im Auftakt"],
            ownReasons: [],
          },
        ],
        [{ exerciseNumber: 7, variation: null, tags: [], ownReasons: [] }],
      ),
    };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(saved), { status: 200 }),
    );
    renderIt();
    const totals = () =>
      [...document.querySelectorAll("tfoot [data-total]")].map(
        (c) => c.textContent,
      );
    expect(screen.getByRole("rowheader", { name: "Total" })).toBeTruthy();
    expect(totals()).toEqual(["1", "1", "0"]);
    await open("Power snatch, Special preparation block: choose");
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "High pull" }),
    );
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Choose exercise" }),
    );
    await waitFor(() => expect(totals()).toEqual(["1", "2", "0"]));
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
        {
          exerciseNumber: 7,
          variation: null,
          tags: ["Hoher Zug"],
          ownReasons: [],
        },
      ]),
    } as unknown as Macrocycle;
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <ExerciseSelection
          onSaved={onSaved}
          onBack={onBack}
          macrocycle={plain}
          catalog={catalog}
        />
      </NextIntlClientProvider>,
    );
    const cell = screen.getByRole("button", {
      name: "Power snatch, Special preparation block: chosen, Standard",
    });
    expect(cell.textContent).toBe("");
    expect(cell.querySelector("svg")).toBeTruthy();
  });

  it("shows only the snatch deficits for a snatch exercise, titled like a heading", async () => {
    renderIt();
    await open("Power snatch, Special preparation block: choose");
    expect(dialog().querySelector("h2")!.textContent).toBe("7 Power snatch");
    expect(dialog().textContent).toContain(
      "Special preparation block · Snatch exercise",
    );
    expect(deficitKeys()).toEqual(["snatchDeficits"]);
    const title = dialog().querySelector('[data-deficit="snatchDeficits"] dt')!;
    expect(title.textContent).toBe("Deficits in the snatch");
    expect(title.className).toContain("font-semibold");
    expect(dialog().textContent).toContain("Slow turnover");
    expect(dialog().textContent).not.toContain("Athlete's deficits");
    expect(dialog().textContent).not.toContain("Ankle mobility");
  });

  it("shows clean and jerk deficits for a clean & jerk exercise, and none without a reference lift", async () => {
    renderIt();
    await open("Power jerk, General preparation block: choose");
    expect(deficitKeys()).toEqual(["cleanDeficits", "jerkDeficits"]);
    expect(dialog().textContent).toContain(
      "Deficits in the jerkNot entered yet",
    );
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Cancel" }),
    );
    await open("Pull-up, General preparation block: choose");
    expect(deficitKeys()).toEqual([]);
    expect(dialog().querySelector("dl")).toBeNull();
  });

  it("chooses an exercise by tapping tags", async () => {
    const saved = {
      ...macrocycle,
      mesocycles: mesocycles([
        {
          exerciseNumber: 7,
          variation: "From blocks",
          tags: ["Beschleunigung im 2. Zug", "Hoher Zug"],
          ownReasons: [],
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
      ownReasons: [],
      variation: "From blocks",
    });
    expect(
      await screen.findByRole("button", {
        name: "Power snatch, Special preparation block: chosen, From blocks",
      }),
    ).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    // The planning gets the stored macrocycle.
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("adds own reasons with Enter and with a comma, each followed by a new +", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(macrocycle), { status: 200 }),
    );
    renderIt();
    await open("Pull-up, General preparation block: choose");
    expect(
      within(dialog()).queryByRole("textbox", { name: "Own reason" }),
    ).toBeNull();
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Add own reason" }),
    );
    const field = within(dialog()).getByRole("textbox", { name: "Own reason" });
    expect(document.activeElement).toBe(field);
    // A comma adds the reason and keeps the field open for the next one.
    await userEvent.type(field, "Back strength, Grip");
    expect(ownReasonTags()).toEqual(["Back strength"]);
    expect((field as HTMLInputElement).value).toBe(" Grip");
    // Enter adds it and closes the field; a new + follows.
    await userEvent.type(field, "{Enter}");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(ownReasonTags()).toEqual(["Back strength", "Grip"]);
    expect(
      within(dialog()).queryByRole("textbox", { name: "Own reason" }),
    ).toBeNull();
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Add own reason" }),
    );
    // Text still in the field counts when saving.
    await userEvent.type(
      within(dialog()).getByRole("textbox", { name: "Own reason" }),
      "Core",
    );
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Choose exercise" }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual({
      tags: [],
      ownReasons: ["Back strength", "Grip", "Core"],
      variation: null,
    });
  });

  it("cancels an own reason with X and removes added ones", async () => {
    renderIt();
    await open("Power snatch, Special preparation block: choose");
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Add own reason" }),
    );
    await userEvent.type(
      within(dialog()).getByRole("textbox", { name: "Own reason" }),
      "Typo",
    );
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Cancel own reason" }),
    );
    expect(
      within(dialog()).queryByRole("textbox", { name: "Own reason" }),
    ).toBeNull();
    expect(ownReasonTags()).toEqual([]);
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Add own reason" }),
    );
    await userEvent.type(
      within(dialog()).getByRole("textbox", { name: "Own reason" }),
      "A, B,",
    );
    expect(ownReasonTags()).toEqual(["A", "B"]);
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Remove own reason: A" }),
    );
    expect(ownReasonTags()).toEqual(["B"]);
  });

  it("prefills a new choice from the same exercise in another block", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(macrocycle), { status: 200 }),
    );
    const chosen = {
      ...macrocycle,
      mesocycles: mesocycles(
        [],
        [
          {
            exerciseNumber: 7,
            variation: "From blocks",
            tags: ["Hoher Zug"],
            ownReasons: ["Technique"],
          },
        ],
      ),
    } as unknown as Macrocycle;
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <ExerciseSelection
          onSaved={onSaved}
          onBack={onBack}
          macrocycle={chosen}
          catalog={catalog}
        />
      </NextIntlClientProvider>,
    );
    await open("Power snatch, Special preparation block: choose");
    expect(
      within(dialog())
        .getByRole("button", { name: "High pull" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(ownReasonTags()).toEqual(["Technique"]);
    expect(
      (within(dialog()).getByLabelText(/Variation/) as HTMLInputElement).value,
    ).toBe("From blocks");
    // Still a new choice: nothing saved yet, "Choose exercise" and no "Remove".
    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      within(dialog()).queryByRole("button", { name: "Remove" }),
    ).toBeNull();
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Choose exercise" }),
    );
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toContain("/mesocycles/special_preparation/exercises/7");
    expect(JSON.parse(init.body)).toEqual({
      tags: ["Hoher Zug"],
      ownReasons: ["Technique"],
      variation: "From blocks",
    });
  });

  it("has no hint text under the reason", async () => {
    renderIt();
    await open("Power snatch, Special preparation block: choose");
    const fieldset = within(dialog()).getByRole("group", { name: "Reason" });
    expect(fieldset.querySelector("p")).toBeNull();
  });

  it("requires a tag or an own reason", async () => {
    renderIt();
    await open("Power snatch, Special preparation block: choose");
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Choose exercise" }),
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(dialog().textContent).toContain(
      "Choose at least one point or add your own reason.",
    );
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "High pull" }),
    );
    expect(dialog().textContent).not.toContain(
      "Choose at least one point or add your own reason.",
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

  it("goes back to the intensity step on the same page", async () => {
    onBack.mockReset();
    renderIt();
    expect(
      screen.queryByRole("link", { name: "Back to intensity" }),
    ).toBeNull();
    await userEvent.click(
      screen.getByRole("button", { name: "Back to intensity" }),
    );
    expect(onBack).toHaveBeenCalledTimes(1);
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
