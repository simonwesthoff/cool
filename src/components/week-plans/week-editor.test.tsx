// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
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
import type { PlannedSession } from "@/domain/week-plans/week-plan-types";
import {
  PendingSaveProvider,
  SavingBackLink,
} from "../macrocycles/pending-save";
import { WeekEditor } from "./week-editor";

const router = { push: vi.fn(), refresh: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
const fetchMock = vi.fn();

beforeAll(() => {
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
  router.push.mockReset();
  router.refresh.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(cleanup);

const catalog = [
  {
    code: "K1",
    name: { de: "Wettkampfübungen", en: "Competition exercises" },
    exercises: [
      {
        number: 1,
        name: { de: "Reißen", en: "Snatch" },
        liftCategories: ["snatch" as const],
      },
    ],
  },
  {
    code: "K3",
    name: { de: "Schnellkraft", en: "Speed strength" },
    exercises: [
      {
        number: 13,
        name: { de: "Zug breit", en: "Snatch pull" },
        liftCategories: ["snatch" as const],
      },
    ],
  },
  {
    code: "K5",
    name: { de: "Maximalkraft Abbremsen", en: "Maximum strength" },
    exercises: [
      {
        number: 20,
        name: { de: "Kniebeuge", en: "Back squat" },
        liftCategories: ["clean" as const],
      },
    ],
  },
];
/** Week 11 projection of the snatch from the spec. */
const projections = {
  1: { bestKg: 80, averageKg: 69, setSize: 3, weeklyReps: 20 },
  13: { bestKg: 86, averageKg: 75, setSize: 6, weeklyReps: 33 },
  20: { bestKg: null, averageKg: null, setSize: null, weeklyReps: null },
};
const plan = {
  weekNumber: 11,
  durationWeeks: 21,
  startDate: "2027-02-08",
  mesocycle: "special_preparation" as const,
  level: "medium" as const,
  chosen: [1, 13],
  variations: {} as Record<number, string>,
};
const schedule: PlannedSession[] = [
  { weekday: 1, slot: 1, exercises: [] },
  { weekday: 1, slot: 2, exercises: [] },
  { weekday: 3, slot: 1, exercises: [] },
];
/** The spec's week 11 snatch: Monday ramping up, Thursday 3 × 2 @ 75 kg. */
const week11: PlannedSession[] = [
  {
    weekday: 1,
    slot: 1,
    exercises: [
      {
        exerciseNumber: 1,
        note: "Fast turnover",
        setGroups: [
          { sets: 2, reps: 3, weightKg: 60 },
          { sets: 3, reps: 2, weightKg: 70 },
          { sets: 2, reps: 1, weightKg: 80 },
        ],
      },
    ],
  },
  {
    weekday: 4,
    slot: 1,
    exercises: [
      {
        exerciseNumber: 1,
        note: null,
        setGroups: [{ sets: 3, reps: 2, weightKg: 75 }],
      },
    ],
  },
];

function renderEditor(
  initialSessions: PlannedSession[] = schedule,
  locale: "en" | "de" = "en",
  variations: Record<number, string> = {},
) {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "de" ? de : en}
      timeZone="UTC"
    >
      <PendingSaveProvider>
        <SavingBackLink href="/athletes/a1" label="Back to Anna Weber" />
        <WeekEditor
          athleteId="a1"
          plan={{ ...plan, variations }}
          initialSessions={initialSessions}
          catalog={catalog}
          projections={projections}
        />
      </PendingSaveProvider>
    </NextIntlClientProvider>,
  );
}
const sessionNamed = (name: string) =>
  screen.getByRole("region", { name }) as HTMLElement;
const column = (container: HTMLElement) =>
  container.querySelector("[data-sessions-column]")!;
const lastBody = () => JSON.parse(fetchMock.mock.lastCall![1].body);

describe("WeekEditor step 1", () => {
  it("shows the week, the stepper and the sessions of the schedule", () => {
    const { container } = renderEditor();
    expect(screen.getByRole("heading", { name: "Week 11 of 21" })).toBeTruthy();
    expect(screen.getByText("Feb 8 – Feb 14, 2027")).toBeTruthy();
    expect(
      screen.getByText("Special preparation block · Medium week"),
    ).toBeTruthy();
    const stepper = screen.getByRole("navigation", {
      name: "Week planning steps",
    });
    expect(stepper.querySelector("[aria-current=step]")!.textContent).toContain(
      "1 Exercises & sessions",
    );
    expect(
      [...column(container).querySelectorAll("section[aria-label]")].map((h) =>
        h.getAttribute("aria-label"),
      ),
    ).toEqual(["Monday 1", "Monday 2", "Wednesday"]);
    // The title of a session is its day selection, with the slot when a
    // day has several sessions.
    const monday2 = sessionNamed("Monday 2");
    expect(
      (monday2.querySelector("h3 select") as HTMLSelectElement).value,
    ).toBe("1");
    expect(monday2.querySelector("h3")!.textContent).toMatch(/2$/);
    expect(document.body.textContent).not.toContain("or drag exercises here");
    // No deviation indicators in step 1.
    expect(container.querySelector("[data-total]")).toBeNull();
  });

  it("lists the mesocycle's exercises with their status, and the whole catalog on request", async () => {
    renderEditor([
      {
        weekday: 1,
        slot: 1,
        exercises: [{ exerciseNumber: 1, note: null, setGroups: [] }],
      },
    ]);
    const aside = screen.getByRole("complementary", { name: "Exercises" });
    const rows = () =>
      [...aside.querySelectorAll("[data-exercise]")].map((e) => [
        e.getAttribute("data-exercise"),
        e.hasAttribute("data-in-block"),
      ]);
    expect(rows()).toEqual([
      ["1", true],
      ["13", true],
    ]);
    // 1 is in the week, 13 not yet.
    expect(
      aside.querySelector('[data-exercise="1"] [data-in-week]'),
    ).toBeTruthy();
    expect(aside.querySelector('[data-exercise="1"]')!.textContent).toContain(
      "in the week",
    );
    expect(
      aside.querySelector('[data-exercise="13"] [data-in-week]'),
    ).toBeNull();
    expect(aside.querySelector('[data-exercise="13"]')!.textContent).toContain(
      "not in the week yet",
    );
    expect(aside.querySelector('input[type="search"]')).toBeNull();
    await userEvent.click(
      within(aside).getByRole("button", { name: "Show all exercises" }),
    );
    expect(rows()).toEqual([
      ["1", true],
      ["13", true],
      ["20", false],
    ]);
    // Not planned for the block: greyed out, but still a drag source.
    const squat = aside.querySelector('[data-exercise="20"]')!;
    expect(squat.className).toContain("text-zinc-400");
    expect(squat.getAttribute("draggable")).toBe("true");
    await userEvent.click(
      within(aside).getByRole("button", {
        name: "Show only the exercises of the Special preparation block",
      }),
    );
    expect(rows()).toHaveLength(2);
  });

  it("moves exercises with the handle within a session and into another", async () => {
    renderEditor([
      {
        weekday: 1,
        slot: 1,
        exercises: [
          { exerciseNumber: 1, note: null, setGroups: [] },
          { exerciseNumber: 13, note: null, setGroups: [] },
        ],
      },
      { weekday: 3, slot: 1, exercises: [] },
    ]);
    const numbers = (name: string) =>
      [...sessionNamed(name).querySelectorAll("li[data-exercise]")].map((li) =>
        li.getAttribute("data-exercise"),
      );
    const data: Record<string, string> = {};
    const dataTransfer = {
      setData: (type: string, value: string) => (data[type] = value),
      getData: (type: string) => data[type] ?? "",
      setDragImage: () => {},
      types: [] as string[],
      dropEffect: "",
      effectAllowed: "",
    };
    const handle = (name: string) =>
      screen.getByRole("button", {
        name: `Move ${name}: drag, or use the arrow keys`,
      });
    // Drag 13 onto the row of 1: it moves before it.
    fireEvent.dragStart(handle("13 Snatch pull"), { dataTransfer });
    fireEvent.drop(
      sessionNamed("Monday").querySelector('li[data-exercise="1"]')!,
      { dataTransfer },
    );
    expect(numbers("Monday")).toEqual(["13", "1"]);
    // Drag 1 into Wednesday.
    fireEvent.dragStart(handle("1 Snatch"), { dataTransfer });
    fireEvent.drop(sessionNamed("Wednesday"), { dataTransfer });
    expect(numbers("Monday")).toEqual(["13"]);
    expect(numbers("Wednesday")).toEqual(["1"]);
    // The arrow keys move an exercise without dragging.
    await userEvent.click(
      screen.getByRole("button", { name: "Add an exercise to Wednesday" }),
    );
    await userEvent.click(
      within(document.querySelector("dialog[open]") as HTMLElement).getByRole(
        "button",
        { name: /^Snatch: ?13 Snatch pull/ },
      ),
    );
    expect(numbers("Wednesday")).toEqual(["1", "13"]);
    const wednesday13 = within(sessionNamed("Wednesday")).getByRole("button", {
      name: "Move 13 Snatch pull: drag, or use the arrow keys",
    });
    wednesday13.focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(numbers("Wednesday")).toEqual(["13", "1"]);
  });

  it("adds an exercise dropped onto a session", () => {
    renderEditor();
    const wednesday = sessionNamed("Wednesday");
    fireEvent.drop(wednesday, {
      dataTransfer: { getData: () => "13", dropEffect: "" },
    });
    expect(
      [...wednesday.querySelectorAll("li[data-exercise]")].map((li) =>
        li.getAttribute("data-exercise"),
      ),
    ).toEqual(["13"]);
  });

  it("adds an exercise by clicking into a session; other exercises only on request, greyed out", async () => {
    renderEditor();
    await userEvent.click(
      screen.getByRole("button", { name: "Add an exercise to Wednesday" }),
    );
    const dialog = document.querySelector("dialog[open]") as HTMLElement;
    expect(
      within(dialog).getByRole("heading", {
        name: "Add an exercise to Wednesday",
      }),
    ).toBeTruthy();
    expect(dialog.querySelector('[data-exercise="20"]')).toBeNull();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Show all exercises" }),
    );
    expect(dialog.querySelector('[data-exercise="20"]')!.className).toContain(
      "text-zinc-400",
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: /^Clean: ?20 Back squat/ }),
    );
    const wednesday = sessionNamed("Wednesday");
    expect(wednesday.textContent).toContain("20 Back squat");
    expect(wednesday.textContent).toContain(
      "Not planned for the Special preparation block",
    );
    // The same exercise cannot be added twice to a session.
    await userEvent.click(
      screen.getByRole("button", { name: "Add an exercise to Wednesday" }),
    );
    await userEvent.click(
      within(document.querySelector("dialog[open]") as HTMLElement).getByRole(
        "button",
        { name: "Show all exercises" },
      ),
    );
    expect(
      (
        document.querySelector(
          'dialog[open] button[data-exercise="20"]',
        ) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("changes a session's day and adds sessions", async () => {
    renderEditor();
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Day of Wednesday" }),
      "5",
    );
    expect(sessionNamed("Friday")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Add session" }));
    // The first day without a session.
    expect(sessionNamed("Tuesday")).toBeTruthy();
  });

  it("marks exercises not planned for the mesocycle with an icon instead of a text block", () => {
    renderEditor([
      {
        weekday: 1,
        slot: 1,
        exercises: [
          { exerciseNumber: 1, note: null, setGroups: [] },
          { exerciseNumber: 20, note: null, setGroups: [] },
        ],
      },
    ]);
    const monday = sessionNamed("Monday");
    const marker = (n: number) =>
      monday.querySelector(`li[data-exercise="${n}"] [data-not-planned]`);
    expect(marker(1)).toBeNull();
    expect(marker(20)!.getAttribute("title")).toBe(
      "Not planned for the Special preparation block",
    );
    // No block check below the stepper and no drag hint.
    expect(
      screen.queryByRole("region", { name: "Exercises of the block" }),
    ).toBeNull();
    expect(document.body.textContent).not.toContain("Missing from the");
    expect(document.body.textContent).not.toContain(
      "Drag an exercise onto a session.",
    );
  });
});

/** The set inputs of an exercise in a session, as [weight, reps] per set. */
const setsOf = (session: string, name: string) => {
  const table = sessionNamed(session);
  const weights = within(table).queryAllByRole("textbox", {
    name: new RegExp(`^Weight in kg of set \\d+ of ${name}$`),
  }) as HTMLInputElement[];
  const reps = within(table).queryAllByRole("textbox", {
    name: new RegExp(`^Reps of set \\d+ of ${name}$`),
  }) as HTMLInputElement[];
  return weights
    .map((w, i) => [w.value, reps[i]!.value])
    .filter(([w, r]) => w !== "" || r !== "");
};
const cellsOf = (session: string, name: string) =>
  within(sessionNamed(session)).queryAllByRole("textbox", {
    name: new RegExp(`^Weight in kg of set \\d+ of ${name}$`),
  }).length;
/** Waits for the next automatic save and returns its payload. */
const nextSave = async () => {
  await waitFor(() => expect(fetchMock).toHaveBeenCalled(), { timeout: 2000 });
  return lastBody();
};

describe("WeekEditor names and column titles", () => {
  it("writes the mesocycle's variation in brackets after the exercise name", async () => {
    renderEditor(week11, "en", { 1: "From blocks" });
    const aside = screen.getByRole("complementary", { name: "Exercises" });
    expect(aside.querySelector('[data-exercise="1"]')!.textContent).toContain(
      "1 Snatch (From blocks)",
    );
    expect(sessionNamed("Monday").textContent).toContain(
      "1 Snatch (From blocks)",
    );
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(sessionNamed("Monday").textContent).toContain(
      "1 Snatch (From blocks)",
    );
  });

  it("titles the columns Exercises and Sessions, and Weights in step 2", async () => {
    renderEditor(week11);
    const titles = () =>
      screen
        .getAllByRole("heading", { level: 2 })
        .filter((h) => !h.closest("[aria-hidden=true]"))
        .map((h) => h.textContent);
    expect(titles()).toEqual(["Exercises", "Sessions"]);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(titles()).toEqual(["Weights"]);
  });
});

describe("WeekEditor step 2", () => {
  it("shows each session as a table: ten set columns, weight on top and reps below", async () => {
    const { container } = renderEditor(week11);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(column(container).className).toContain("lg:translate-x-0");
    expect(container.querySelector("aside")!.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(cellsOf("Monday", "1 Snatch")).toBe(10);
    // 2 × 3 @ 60, 3 × 2 @ 70, 2 × 1 @ 80 are seven sets.
    expect(setsOf("Monday", "1 Snatch")).toEqual([
      ["60", "3"],
      ["60", "3"],
      ["70", "2"],
      ["70", "2"],
      ["70", "2"],
      ["80", "1"],
      ["80", "1"],
    ]);
    const table = sessionNamed("Monday").querySelector("table")!;
    const name = table.querySelector("tbody th[scope=rowgroup]")!;
    // Bold lines between exercises.
    expect(table.querySelector("tbody")!.className).toContain("border-t-2");
    // The marks and the number are shown, the name is for screen readers.
    expect(
      name.querySelector("[data-exercise-label] > [aria-hidden=true]")!
        .textContent,
    ).toBe("1");
    expect(name.textContent).toBe("Snatch: 11 Snatch");
    expect(name.getAttribute("rowspan")).toBe("2");
    // No buttons to add or remove sets.
    expect(
      within(sessionNamed("Monday")).queryAllByRole("button"),
    ).toHaveLength(0);
    // Hovering the cell shows the name.
    fireEvent.pointerEnter(name);
    expect((await screen.findByRole("tooltip")).textContent).toBe("1 Snatch");
    fireEvent.pointerLeave(name);
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("heads the indicators best value, mHG, set size and reps, with Actual and Plan as rows", async () => {
    renderEditor(week11);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    const table = sessionNamed("Monday").querySelector("table")!;
    expect(
      [...table.querySelectorAll("thead [data-heading]")].map(
        (h) => h.textContent,
      ),
    ).toEqual(["Best value", "mHG", "Set size", "Reps"]);
    const cell = (kind: string, key: string) =>
      table.querySelector(`[data-kind=${kind}][data-total=${key}]`)!;
    expect(cell("actual", "heaviest").closest("tr")!.textContent).toContain(
      "Actual",
    );
    expect(cell("plan", "heaviest").closest("tr")!.textContent).toContain(
      "Plan",
    );
    expect(cell("actual", "heaviest").textContent).toBe("80 kg");
    expect(cell("plan", "heaviest").textContent).toBe("80 kg");
    expect(cell("actual", "average").textContent).toBe("69.5 kg");
    expect(cell("plan", "average").textContent).toBe("69 kg");
    expect(cell("actual", "setSize").getAttribute("data-deviation")).toBe(
      "below",
    );
    expect(cell("actual", "setSize").className).toContain("text-blue-700");
    expect(cell("actual", "reps").getAttribute("data-deviation")).toBe(
      "within",
    );
    // The coach note takes both rows of the exercise.
    const note = within(table).getByRole("textbox", {
      name: "Coach note for 1 Snatch",
    });
    expect(note.closest("td")!.getAttribute("rowspan")).toBe("2");
    // 85 kg is more than 5 % above 80 kg.
    const weight = within(table).getByRole("textbox", {
      name: "Weight in kg of set 7 of 1 Snatch",
    });
    await userEvent.clear(weight);
    await userEvent.type(weight, "85");
    expect(cell("actual", "heaviest").getAttribute("data-deviation")).toBe(
      "above",
    );
    expect(cell("actual", "heaviest").className).toContain("text-red-700");
    // Only the colour marks the deviation; no arrows.
    expect(cell("actual", "heaviest").textContent).toBe(
      "85 kgmore than 5 % above the plan",
    );
    expect(sessionNamed("Monday").textContent).not.toMatch(/[↑↓]/);
  });

  it("gives every column a fixed width, the same for the four indicator columns", async () => {
    renderEditor(week11);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    const table = sessionNamed("Monday").querySelector("table")!;
    expect(table.className).toContain("table-fixed");
    const cols = [...table.querySelectorAll("col")];
    expect(cols).toHaveLength(18);
    expect(cols.every((c) => /^\d+(\.\d+)?rem$/.test(c.style.width))).toBe(
      true,
    );
    expect(
      new Set(
        [...table.querySelectorAll("col[data-col]")].map(
          (c) => (c as HTMLElement).style.width,
        ),
      ).size,
    ).toBe(1);
  });

  it("does not compare values without data or projection", async () => {
    renderEditor([
      {
        weekday: 1,
        slot: 1,
        exercises: [{ exerciseNumber: 20, note: null, setGroups: [] }],
      },
    ]);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      [...sessionNamed("Monday").querySelectorAll("[data-kind=actual]")].map(
        (d) => d.getAttribute("data-deviation"),
      ),
    ).toEqual(["none", "none", "none", "none"]);
  });

  it("adds a set by typing into an empty cell, and marks a weight without reps", async () => {
    renderEditor([
      {
        weekday: 1,
        slot: 1,
        exercises: [{ exerciseNumber: 1, note: null, setGroups: [] }],
      },
    ]);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    const table = sessionNamed("Monday");
    await userEvent.type(
      within(table).getByRole("textbox", {
        name: "Weight in kg of set 3 of 1 Snatch",
      }),
      "70",
    );
    expect(
      within(table)
        .getByRole("textbox", { name: "Reps of set 3 of 1 Snatch" })
        .getAttribute("aria-invalid"),
    ).toBe("true");
    await userEvent.type(
      within(table).getByRole("textbox", { name: "Reps of set 3 of 1 Snatch" }),
      "2",
    );
    expect(setsOf("Monday", "1 Snatch")).toEqual([["70", "2"]]);
  });
});

describe("WeekEditor step 2 layout", () => {
  const withPullUp: PlannedSession[] = [
    {
      ...week11[0]!,
      exercises: [
        ...week11[0]!.exercises,
        {
          exerciseNumber: 33,
          note: null,
          freeText: "3 × 10, slow",
          setGroups: [],
        },
      ],
    },
  ];
  const catalogWithPullUp = [
    ...catalog,
    {
      code: "K8",
      name: { de: "Allgemeines Muskelkrafttraining", en: "General strength" },
      exercises: [
        {
          number: 33,
          name: { de: "Klimmzug", en: "Pull-up" },
          liftCategories: [],
        },
      ],
    },
  ];
  const renderWithPullUp = () =>
    render(
      <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
        <PendingSaveProvider>
          <WeekEditor
            athleteId="a1"
            plan={plan}
            initialSessions={withPullUp}
            catalog={catalogWithPullUp}
            projections={projections}
          />
        </PendingSaveProvider>
      </NextIntlClientProvider>,
    );

  it("gives exercises from 30 on a free text instead of sets, without indicators", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    renderWithPullUp();
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    const pullUp = sessionNamed("Monday").querySelector(
      'tbody[data-exercise="33"]',
    ) as HTMLElement;
    expect(
      within(pullUp).queryAllByRole("textbox", { name: /of set/ }),
    ).toHaveLength(0);
    expect(pullUp.querySelector("[data-total]")).toBeNull();
    const text = within(pullUp).getByRole("textbox", {
      name: "Sets and reps of 33 Pull-up",
    }) as HTMLTextAreaElement;
    expect(text.value).toBe("3 × 10, slow");
    await userEvent.type(text, ", 2 min rest");
    const body = await nextSave();
    expect(body.sessions[0].exercises[1]).toEqual({
      exerciseNumber: 33,
      note: null,
      freeText: "3 × 10, slow, 2 min rest",
      setGroups: [],
    });
  });
});

describe("WeekEditor lift categories", () => {
  const marks = (root: Element | null) =>
    [...(root?.querySelectorAll("[data-lift]") ?? [])].map((d) =>
      d.getAttribute("data-lift"),
    );
  const monday: PlannedSession[] = [
    {
      weekday: 1,
      slot: 1,
      exercises: [
        { exerciseNumber: 1, note: null, setGroups: [] },
        { exerciseNumber: 20, note: null, setGroups: [] },
      ],
    },
  ];

  it("marks the categories in the exercise list and on the session cards", async () => {
    renderEditor(monday);
    const aside = screen.getByRole("complementary", { name: "Exercises" });
    expect(marks(aside.querySelector('[data-exercise="1"]'))).toEqual([
      "snatch",
    ]);
    await userEvent.click(
      within(aside).getByRole("button", { name: "Show all exercises" }),
    );
    expect(marks(aside.querySelector('[data-exercise="20"]'))).toEqual([
      "clean",
    ]);
    // Monday's card: a snatch and a clean movement are planned.
    expect(marks(sessionNamed("Monday"))).toEqual(["snatch", "clean"]);
    expect(
      within(sessionNamed("Monday")).getByTitle("Clean").closest("li"),
    ).toBeTruthy();
  });

  it("marks the categories in the step 2 tables", async () => {
    renderEditor(monday);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    const table = sessionNamed("Monday");
    expect(
      marks(table.querySelector('tbody[data-exercise="1"] th[scope=rowgroup]')),
    ).toEqual(["snatch"]);
    expect(
      marks(
        table.querySelector('tbody[data-exercise="20"] th[scope=rowgroup]'),
      ),
    ).toEqual(["clean"]);
  });
});

describe("WeekEditor feedback", () => {
  it("shows the athlete's feedback read-only below the coach note, and never saves it", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    const withFeedback: PlannedSession[] = [
      {
        ...week11[0]!,
        exercises: [
          { ...week11[0]!.exercises[0]!, feedback: "Last set felt heavy" },
        ],
      },
      week11[1]!,
    ];
    renderEditor(withFeedback);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    const monday = sessionNamed("Monday");
    expect(monday.querySelector("[data-feedback]")!.textContent).toBe(
      "Feedback: Last set felt heavy",
    );
    expect(
      within(monday).queryByRole("textbox", { name: /Feedback/ }),
    ).toBeNull();
    await userEvent.type(
      within(sessionNamed("Thursday")).getByRole("textbox", {
        name: "Reps of set 4 of 1 Snatch",
      }),
      "2",
    );
    const body = await nextSave();
    expect(JSON.stringify(body)).not.toContain("feedback");
  });
});

describe("WeekEditor saving", () => {
  it("saves every change on its own, as set groups of equal sets", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    renderEditor(week11);
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    const thursday = sessionNamed("Thursday");
    await userEvent.type(
      within(thursday).getByRole("textbox", {
        name: "Weight in kg of set 4 of 1 Snatch",
      }),
      "75",
    );
    await userEvent.type(
      within(thursday).getByRole("textbox", {
        name: "Reps of set 4 of 1 Snatch",
      }),
      "2",
    );
    const body = await nextSave();
    expect(fetchMock.mock.lastCall![0]).toBe(
      "/api/athletes/a1/macrocycle/weeks/11/plan",
    );
    expect(fetchMock.mock.lastCall![1].method).toBe("PUT");
    expect(body.sessions[0].exercises[0].setGroups).toEqual([
      { sets: 2, reps: 3, weightKg: 60 },
      { sets: 3, reps: 2, weightKg: 70 },
      { sets: 2, reps: 1, weightKg: 80 },
    ]);
    // Four equal sets on Thursday form one group.
    expect(body.sessions[1].exercises[0].setGroups).toEqual([
      { sets: 4, reps: 2, weightKg: 75 },
    ]);
    expect(
      await screen.findByText("All changes saved.", {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(router.refresh).toHaveBeenCalled();
  });

  it("saves changes of step 1 too, so both steps always agree", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    renderEditor([{ weekday: 1, slot: 1, exercises: [] }]);
    await userEvent.click(
      screen.getByRole("button", { name: "Remove Monday" }),
    );
    expect(await nextSave()).toEqual({ sessions: [] });
  });

  it("does not save while a cell is invalid, and marks it", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    renderEditor(week11);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    const weight = within(sessionNamed("Monday")).getByRole("textbox", {
      name: "Weight in kg of set 1 of 1 Snatch",
    });
    await userEvent.clear(weight);
    await userEvent.type(weight, "82.3");
    expect(weight.getAttribute("aria-invalid")).toBe("true");
    expect(
      await screen.findByText("Not saved: please check the marked fields."),
    ).toBeTruthy();
    await new Promise((r) => setTimeout(r, 700));
    expect(fetchMock).not.toHaveBeenCalled();
    await userEvent.clear(weight);
    await userEvent.type(weight, "82.5");
    expect((await nextSave()).sessions[0].exercises[0].setGroups[0]).toEqual({
      sets: 1,
      reps: 3,
      weightKg: 82.5,
    });
  });

  it("offers to try again when saving fails", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }));
    renderEditor(week11);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    const thursday = sessionNamed("Thursday");
    await userEvent.type(
      within(thursday).getByRole("textbox", {
        name: "Reps of set 4 of 1 Snatch",
      }),
      "2",
    );
    expect(
      await screen.findByText("Could not save.", {}, { timeout: 5000 }),
    ).toBeTruthy();
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByText("All changes saved.", {}, { timeout: 5000 }),
    ).toBeTruthy();
  });
});

describe("WeekEditor beyond the plan and finishing", () => {
  it("saves values beyond the plan and warns about them", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    renderEditor(week11);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    // Week 11 already has set size 2 against a plan of 3: one value off.
    // With 95 kg the best value is off too; the mHG (70.25 kg) stays within.
    expect(
      screen.getByText(
        "1 value is more than 5 % off the plan (red: above, blue: below). It is saved anyway.",
      ),
    ).toBeTruthy();
    const weight = within(sessionNamed("Monday")).getByRole("textbox", {
      name: "Weight in kg of set 7 of 1 Snatch",
    });
    await userEvent.clear(weight);
    await userEvent.type(weight, "95");
    const body = await nextSave();
    expect(body.sessions[0].exercises[0].setGroups.at(-1)).toEqual({
      sets: 1,
      reps: 1,
      weightKg: 95,
    });
    expect(
      await screen.findByText("All changes saved.", {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-off-plan]")!.getAttribute("data-off-plan"),
    ).toBe("2");
  });

  it("finishes the week: saves what is left and goes back to the athlete", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    renderEditor(week11);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      screen.queryByRole("button", { name: "Finish week planning" }),
    ).toBeTruthy();
    await userEvent.type(
      within(sessionNamed("Thursday")).getByRole("textbox", {
        name: "Reps of set 4 of 1 Snatch",
      }),
      "2",
    );
    // Right away, before the automatic save.
    await userEvent.click(
      screen.getByRole("button", { name: "Finish week planning" }),
    );
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/athletes/a1"),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(lastBody().sessions[1].exercises[0].setGroups).toEqual([
      { sets: 3, reps: 2, weightKg: 75 },
      { sets: 1, reps: 2, weightKg: null },
    ]);
  });

  it("stays on the week when a cell is invalid", async () => {
    renderEditor(week11);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    const weight = within(sessionNamed("Monday")).getByRole("textbox", {
      name: "Weight in kg of set 1 of 1 Snatch",
    });
    await userEvent.clear(weight);
    await userEvent.type(weight, "82.3");
    await userEvent.click(
      screen.getByRole("button", { name: "Finish week planning" }),
    );
    expect(
      await screen.findByText("Not saved: please check the marked fields."),
    ).toBeTruthy();
    expect(router.push).not.toHaveBeenCalled();
  });
});

describe("WeekEditor leaving", () => {
  it("saves a change that is not saved yet before leaving, without a dialog", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    renderEditor();
    await userEvent.click(screen.getByRole("button", { name: "Add session" }));
    // Leaving before the automatic save sends it first.
    await userEvent.click(
      screen.getByRole("link", { name: /Back to Anna Weber/ }),
    );
    expect(document.querySelector("dialog[open]")).toBeNull();
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/athletes/a1"),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]![1].keepalive).toBe(true);
  });

  it("leaves without saving when nothing changed", async () => {
    renderEditor(week11);
    await userEvent.click(
      screen.getByRole("link", { name: /Back to Anna Weber/ }),
    );
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/athletes/a1"),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("places back at the left and continue or finish at the right", async () => {
    renderEditor(week11);
    const actions = () => document.querySelector("[data-stepper-actions]")!;
    expect(
      actions().querySelector("[data-stepper-back]")!.children,
    ).toHaveLength(0);
    const next = within(
      actions().querySelector("[data-stepper-next]") as HTMLElement,
    ).getByRole("button", { name: "Continue" });
    await userEvent.click(next);
    const back = within(
      actions().querySelector("[data-stepper-back]") as HTMLElement,
    ).getByRole("button", { name: "Back" });
    expect(back.className).not.toContain("border");
    expect(
      within(
        actions().querySelector("[data-stepper-next]") as HTMLElement,
      ).getByRole("button", { name: "Finish week planning" }),
    ).toBeTruthy();
  });
});

describe("WeekEditor in German", () => {
  it("uses German texts", async () => {
    renderEditor(week11, "de");
    expect(
      screen.getByRole("heading", { name: "Woche 11 von 21" }),
    ).toBeTruthy();
    expect(screen.getByText("Aufbauphase (ABP) · Mittlere Woche")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Weiter" }));
    const table = sessionNamed("Montag").querySelector("table")!;
    expect(
      [...table.querySelectorAll("thead [data-heading]")].map(
        (h) => h.textContent,
      ),
    ).toEqual(["Bestwert", "mHG", "Satzgröße", "Wdh."]);
    expect(table.textContent).toContain("Ist");
    expect(table.textContent).toContain("Plan");
    expect(
      within(sessionNamed("Montag")).getAllByRole("textbox", {
        name: /^Gewicht in kg von Satz \d+ von 1 Reißen$/,
      }),
    ).toHaveLength(10);
  });
});

describe("WeekEditor autofill", () => {
  const empty = (n: number) => ({
    exerciseNumber: n,
    note: null,
    setGroups: [],
  });
  /** Snatch on Monday and Thursday without sets, the pull with sets on Monday only, the squat without projection. */
  const week: PlannedSession[] = [
    {
      weekday: 1,
      slot: 1,
      exercises: [
        empty(1),
        {
          exerciseNumber: 13,
          note: null,
          setGroups: [{ sets: 3, reps: 5, weightKg: 70 }],
        },
        empty(20),
      ],
    },
    { weekday: 4, slot: 1, exercises: [empty(1), empty(13)] },
  ];
  const groupsOf = (
    body: {
      sessions: {
        exercises: { exerciseNumber: number; setGroups: unknown[] }[];
      }[];
    },
    day: number,
    n: number,
  ) =>
    body.sessions[day]!.exercises.find((e) => e.exerciseNumber === n)!
      .setGroups;

  it("shows the button with a magic wand next to the Weights title, and fills nothing before", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    const { container } = renderEditor(week);
    expect(screen.queryByRole("button", { name: "Autofill" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    const button = screen.getByRole("button", { name: "Autofill" });
    expect(button.querySelector("svg[aria-hidden=true]")).toBeTruthy();
    // A toolbar below the Weights title: undo, redo, autofill, clear all.
    const toolbar = screen.getByRole("toolbar", { name: "Weights and reps" });
    expect(toolbar.previousElementSibling!.textContent).toBe("Weights");
    expect(
      within(toolbar)
        .getAllByRole("button")
        .map((b) => b.getAttribute("aria-label") ?? b.textContent),
    ).toEqual(["Undo", "Redo", "Autofill", "Clear all weights"]);
    expect(column(container).contains(button)).toBe(true);
    expect(
      (
        within(sessionNamed("Monday")).getByRole("textbox", {
          name: "Weight in kg of set 1 of 1 Snatch",
        }) as HTMLInputElement
      ).value,
    ).toBe("");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fills empty exercises, split over their sessions, and saves them", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    renderEditor(week);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await userEvent.click(screen.getByRole("button", { name: "Autofill" }));
    const body = await nextSave();
    // The snatch: 10 of the 20 reps per session, each ending at 80 kg.
    for (const day of [0, 1]) {
      const groups = groupsOf(body, day, 1) as {
        sets: number;
        reps: number;
        weightKg: number;
      }[];
      expect(groups.reduce((s, g) => s + g.sets * g.reps, 0)).toBe(10);
      expect(groups.at(-1)!.weightKg).toBe(80);
    }
    // The pull has sets on Monday: neither session is touched.
    expect(groupsOf(body, 0, 13)).toEqual([{ sets: 3, reps: 5, weightKg: 70 }]);
    expect(groupsOf(body, 1, 13)).toEqual([]);
    // The squat has no projection.
    expect(groupsOf(body, 0, 20)).toEqual([]);
  });

  it("fills the week 11 snatch without red or blue indicators", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    renderEditor([{ weekday: 1, slot: 1, exercises: [empty(1)] }]);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await userEvent.click(screen.getByRole("button", { name: "Autofill" }));
    const monday = sessionNamed("Monday");
    const weights = [1, 2, 3, 4, 5, 6, 7].map(
      (i) =>
        (
          within(monday).getByRole("textbox", {
            name: `Weight in kg of set ${i} of 1 Snatch`,
          }) as HTMLInputElement
        ).value,
    );
    expect(weights).toEqual(["65", "65", "70", "70", "75", "75", "80"]);
    const marks = [...monday.querySelectorAll("[data-deviation]")].map((c) =>
      c.getAttribute("data-deviation"),
    );
    expect(marks.length).toBeGreaterThan(0);
    expect(marks.every((m) => m === "within")).toBe(true);
  });

  it("fills only an exercise added later on a second click", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    renderEditor([{ weekday: 1, slot: 1, exercises: [empty(1)] }]);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await userEvent.click(screen.getByRole("button", { name: "Autofill" }));
    // The coach changes the first snatch weight by hand.
    const first = within(sessionNamed("Monday")).getByRole("textbox", {
      name: "Weight in kg of set 1 of 1 Snatch",
    });
    await userEvent.clear(first);
    await userEvent.type(first, "50");
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    // Add the pull to Monday by dropping it from the list.
    await userEvent.click(
      within(sessionNamed("Monday")).getByRole("button", {
        name: /Add an exercise/,
      }),
    );
    await userEvent.click(
      within(document.querySelector("dialog[open]") as HTMLElement).getByRole(
        "button",
        { name: /13 Snatch pull/ },
      ),
    );
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await userEvent.click(screen.getByRole("button", { name: "Autofill" }));
    const monday = sessionNamed("Monday");
    expect(
      (
        within(monday).getByRole("textbox", {
          name: "Weight in kg of set 1 of 1 Snatch",
        }) as HTMLInputElement
      ).value,
    ).toBe("50");
    expect(
      (
        within(monday).getByRole("textbox", {
          name: "Weight in kg of set 1 of 13 Snatch pull",
        }) as HTMLInputElement
      ).value,
    ).not.toBe("");
  });

  it("undoes and redoes autofill, typing and clearing, greying unavailable actions", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    renderEditor([{ weekday: 1, slot: 1, exercises: [empty(1)] }]);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    const button = (name: string) =>
      screen.getByRole("button", { name }) as HTMLButtonElement;
    const weight = (n: number) =>
      (
        within(sessionNamed("Monday")).getByRole("textbox", {
          name: `Weight in kg of set ${n} of 1 Snatch`,
        }) as HTMLInputElement
      ).value;
    expect(button("Undo").disabled).toBe(true);
    expect(button("Redo").disabled).toBe(true);
    expect(button("Clear all weights").disabled).toBe(true);
    await userEvent.click(button("Autofill"));
    expect(weight(1)).toBe("65");
    expect(button("Undo").disabled).toBe(false);
    // Typing "65" into one cell is one undo step.
    const first = within(sessionNamed("Monday")).getByRole("textbox", {
      name: "Weight in kg of set 1 of 1 Snatch",
    });
    await userEvent.clear(first);
    await userEvent.type(first, "60");
    expect(weight(1)).toBe("60");
    await userEvent.click(button("Undo"));
    expect(weight(1)).toBe("65");
    expect(button("Redo").disabled).toBe(false);
    await userEvent.click(button("Redo"));
    expect(weight(1)).toBe("60");
    expect(button("Redo").disabled).toBe(true);
    // The redone state is saved like any change.
    await waitFor(
      () =>
        expect(lastBody().sessions[0].exercises[0].setGroups[0].weightKg).toBe(
          60,
        ),
      { timeout: 2000 },
    );
    // Clear all, undo all the way back to the empty week.
    await userEvent.click(button("Clear all weights"));
    expect(weight(1)).toBe("");
    expect(button("Clear all weights").disabled).toBe(true);
    await userEvent.click(button("Undo"));
    expect(weight(1)).toBe("60");
    await userEvent.click(button("Undo"));
    await userEvent.click(button("Undo"));
    expect(weight(1)).toBe("");
    expect(button("Undo").disabled).toBe(true);
    await waitFor(
      () => expect(lastBody().sessions[0].exercises[0].setGroups).toEqual([]),
      { timeout: 2000 },
    );
  });

  it("moves with Enter from weight to reps, to the next set, the note and the next exercise", async () => {
    renderEditor([{ weekday: 1, slot: 1, exercises: [empty(1), empty(13)] }]);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    const monday = within(sessionNamed("Monday"));
    const box = (name: string) => monday.getByRole("textbox", { name });
    box("Weight in kg of set 1 of 1 Snatch").focus();
    await userEvent.keyboard("60{Enter}");
    expect(document.activeElement).toBe(box("Reps of set 1 of 1 Snatch"));
    await userEvent.keyboard("3{Enter}");
    expect(document.activeElement).toBe(
      box("Weight in kg of set 2 of 1 Snatch"),
    );
    box("Reps of set 10 of 1 Snatch").focus();
    await userEvent.keyboard("{Enter}");
    expect(document.activeElement).toBe(box("Coach note for 1 Snatch"));
    await userEvent.keyboard("Fast{Enter}");
    expect((box("Coach note for 1 Snatch") as HTMLTextAreaElement).value).toBe(
      "Fast",
    );
    expect(document.activeElement).toBe(
      box("Weight in kg of set 1 of 13 Snatch pull"),
    );
  });

  it("moves between the cells with the arrow keys", async () => {
    renderEditor([{ weekday: 1, slot: 1, exercises: [empty(1), empty(13)] }]);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    const monday = within(sessionNamed("Monday"));
    const box = (name: string) => monday.getByRole("textbox", { name });
    box("Weight in kg of set 2 of 1 Snatch").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(
      box("Weight in kg of set 3 of 1 Snatch"),
    );
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(document.activeElement).toBe(
      box("Weight in kg of set 1 of 1 Snatch"),
    );
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(box("Reps of set 1 of 1 Snatch"));
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(
      box("Weight in kg of set 1 of 13 Snatch pull"),
    );
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    expect(document.activeElement).toBe(
      box("Weight in kg of set 1 of 1 Snatch"),
    );
    // Inside a value, left moves the caret first.
    await userEvent.keyboard("75{ArrowLeft}");
    expect(document.activeElement).toBe(
      box("Weight in kg of set 1 of 1 Snatch"),
    );
  });

  it("uses the German label", async () => {
    renderEditor(week, "de");
    await userEvent.click(screen.getByRole("button", { name: "Weiter" }));
    for (const name of [
      "Rückgängig",
      "Wiederherstellen",
      "Automatisch ausfüllen",
      "Alle Gewichte löschen",
    ])
      expect(screen.getByRole("button", { name })).toBeTruthy();
  });
});
