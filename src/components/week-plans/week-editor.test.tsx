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
import { GuardedBackLink } from "../macrocycles/leave-guard";
import { UnsavedChangesProvider } from "../macrocycles/unsaved-changes";
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
    exercises: [{ number: 1, name: { de: "Reißen", en: "Snatch" } }],
  },
  {
    code: "K3",
    name: { de: "Schnellkraft", en: "Speed strength" },
    exercises: [{ number: 13, name: { de: "Zug breit", en: "Snatch pull" } }],
  },
  {
    code: "K5",
    name: { de: "Maximalkraft Abbremsen", en: "Maximum strength" },
    exercises: [{ number: 20, name: { de: "Kniebeuge", en: "Back squat" } }],
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
      <UnsavedChangesProvider>
        <GuardedBackLink href="/athletes/a1" label="Back to Anna Weber" />
        <WeekEditor
          athleteId="a1"
          plan={{ ...plan, variations }}
          initialSessions={initialSessions}
          catalog={catalog}
          projections={projections}
        />
      </UnsavedChangesProvider>
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
        { name: /^13 Snatch pull/ },
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
      within(dialog).getByRole("button", { name: /^20 Back squat/ }),
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
    expect(name.textContent).toBe("1 Snatch");
    expect(name.getAttribute("rowspan")).toBe("2");
    // No buttons to add or remove sets.
    expect(
      within(sessionNamed("Monday")).queryAllByRole("button"),
    ).toHaveLength(0);
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
      exercises: [{ number: 33, name: { de: "Klimmzug", en: "Pull-up" } }],
    },
  ];
  const renderWithPullUp = () =>
    render(
      <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
        <UnsavedChangesProvider>
          <WeekEditor
            athleteId="a1"
            plan={plan}
            initialSessions={withPullUp}
            catalog={catalogWithPullUp}
            projections={projections}
          />
        </UnsavedChangesProvider>
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
  it("asks before leaving with a change that is not saved yet", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    renderEditor();
    await userEvent.click(screen.getByRole("button", { name: "Add session" }));
    // Leaving before the automatic save asks.
    await userEvent.click(
      screen.getByRole("link", { name: /Back to Anna Weber/ }),
    );
    const dialog = document.querySelector("dialog[open]") as HTMLElement;
    expect(
      within(dialog).getByRole("heading", { name: "Save changes?" }),
    ).toBeTruthy();
    await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/athletes/a1"),
    );
    expect(fetchMock).toHaveBeenCalled();
  });

  it("does not ask without changes", () => {
    renderEditor(week11);
    const link = screen.getByRole("link", { name: /Back to Anna Weber/ });
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    expect(document.querySelector("dialog[open]")).toBeNull();
    expect(click.defaultPrevented).toBe(false);
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
