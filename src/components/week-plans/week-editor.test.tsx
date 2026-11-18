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
          plan={plan}
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
      "1 Sessions & exercises",
    );
    expect(
      [...column(container).querySelectorAll("section h3")].map(
        (h) => h.textContent,
      ),
    ).toEqual(["Monday 1", "Monday 2", "Wednesday"]);
    // No deviation indicators in step 1.
    expect(container.querySelector("[data-total]")).toBeNull();
  });

  it("lists the whole catalog with the mesocycle's exercises highlighted", () => {
    const { container } = renderEditor();
    const aside = screen.getByRole("complementary", { name: "Exercises" });
    expect(
      [...aside.querySelectorAll("[data-exercise]")].map((e) => [
        e.getAttribute("data-exercise"),
        e.hasAttribute("data-highlighted"),
      ]),
    ).toEqual([
      ["1", true],
      ["13", true],
      ["20", false],
    ]);
    expect(
      aside.querySelector('[data-exercise="1"]')!.getAttribute("draggable"),
    ).toBe("true");
    void container;
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

  it("adds an exercise by clicking into a session, with the highlighting", async () => {
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
    expect(
      dialog
        .querySelector('[data-exercise="13"]')!
        .hasAttribute("data-highlighted"),
    ).toBe(true);
    await userEvent.click(
      within(dialog).getByRole("button", { name: "20 Back squat" }),
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

  it("checks the week against the mesocycle's exercises", async () => {
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
    const check = screen.getByRole("region", {
      name: "Exercises of the block",
    });
    expect(check.querySelector("[data-check=missing]")!.textContent).toBe(
      "Missing from the Special preparation block: 13 Snatch pull",
    );
    expect(check.querySelector("[data-check=not-planned]")!.textContent).toBe(
      "Not planned for the Special preparation block: 20 Back squat",
    );
  });
});

describe("WeekEditor step 2", () => {
  it("switches steps on the page, slides only the sessions column and keeps the values", async () => {
    const { container } = renderEditor(week11);
    expect(column(container).className).toContain("lg:translate-x-1/2");
    expect(column(container).className).toContain(
      "motion-reduce:transition-none",
    );
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      container.querySelector("[data-step]")!.getAttribute("data-step"),
    ).toBe("2");
    expect(column(container).className).toContain("lg:translate-x-0");
    // The catalog is hidden, the values are there.
    expect(container.querySelector("aside")!.getAttribute("aria-hidden")).toBe(
      "true",
    );
    const weight = screen.getAllByRole("textbox", {
      name: "Weight in kg of set group 3 of 1 Snatch",
    })[0]!;
    await userEvent.clear(weight);
    await userEvent.type(weight, "82.5");
    await userEvent.click(
      screen.getByRole("button", { name: "1 Sessions & exercises, completed" }),
    );
    expect(column(container).className).toContain("lg:translate-x-1/2");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      (
        screen.getAllByRole("textbox", {
          name: "Weight in kg of set group 3 of 1 Snatch",
        })[0] as HTMLInputElement
      ).value,
    ).toBe("82.5");
    expect(router.push).not.toHaveBeenCalled();
  });

  it("shows the week's totals against the projection with red and blue", async () => {
    const { container } = renderEditor(week11);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    const totals = (key: string) =>
      container.querySelector(`[data-values="1"] [data-total=${key}]`)!;
    expect(totals("heaviest").textContent).toBe("Heaviest80 kgplan 80 kg");
    expect(totals("average").textContent).toBe("mHG69.5 kgplan 69 kg");
    expect(totals("setSize").getAttribute("data-deviation")).toBe("below");
    expect(totals("setSize").textContent).toBe("Set size2↓plan 3");
    expect(totals("setSize").querySelector("dd")!.className).toContain(
      "text-blue-700",
    );
    expect(totals("reps").getAttribute("data-deviation")).toBe("within");
    // 85 kg is more than 5 % above 80 kg.
    const weight = screen.getAllByRole("textbox", {
      name: "Weight in kg of set group 3 of 1 Snatch",
    })[0]!;
    await userEvent.clear(weight);
    await userEvent.type(weight, "85");
    expect(totals("heaviest").getAttribute("data-deviation")).toBe("above");
    expect(totals("heaviest").querySelector("dd")!.className).toContain(
      "text-red-700",
    );
    expect(
      totals("heaviest").querySelector(
        '[aria-label="more than 5 % above the plan"]',
      ),
    ).toBeTruthy();
  });

  it("does not compare values without data or projection", async () => {
    const { container } = renderEditor([
      {
        weekday: 1,
        slot: 1,
        exercises: [{ exerciseNumber: 20, note: null, setGroups: [] }],
      },
    ]);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      [...container.querySelectorAll("[data-total]")].map((d) =>
        d.getAttribute("data-deviation"),
      ),
    ).toEqual(["none", "none", "none", "none"]);
  });

  it("adds set groups as a copy of the last one and saves the whole week", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    renderEditor(week11);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await userEvent.click(
      screen.getAllByRole("button", {
        name: "Add a set group to 1 Snatch",
      })[1]!,
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(fetchMock.mock.lastCall![0]).toBe(
      "/api/athletes/a1/macrocycle/weeks/11/plan",
    );
    expect(fetchMock.mock.lastCall![1].method).toBe("PUT");
    expect(lastBody()).toEqual({
      sessions: [
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
              setGroups: [
                { sets: 3, reps: 2, weightKg: 75 },
                { sets: 3, reps: 2, weightKg: 75 },
              ],
            },
          ],
        },
      ],
    });
    expect(await screen.findByRole("status")).toBeTruthy();
    expect(router.refresh).toHaveBeenCalled();
  });

  it("marks fields the API refuses and opens step 2 for them", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_FAILED",
            fields: {
              "sessions.0.exercises.0.setGroups.1.weightKg": ["NOT_HALF_KG"],
            },
          },
        }),
        { status: 400 },
      ),
    );
    const { container } = renderEditor(week11);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(
        container.querySelector("[data-step]")!.getAttribute("data-step"),
      ).toBe("2"),
    );
    expect(
      screen
        .getAllByRole("textbox", {
          name: "Weight in kg of set group 2 of 1 Snatch",
        })[0]!
        .getAttribute("aria-invalid"),
    ).toBe("true");
    expect(screen.getByText("Please use steps of 0.5 kg.")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toBe(
      "Please check the marked fields.",
    );
  });

  it("saves a week without sessions to make it unplanned", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    renderEditor([{ weekday: 1, slot: 1, exercises: [] }]);
    await userEvent.click(
      screen.getByRole("button", { name: "Remove Monday" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(lastBody()).toEqual({ sessions: [] });
  });
});

describe("WeekEditor unsaved changes", () => {
  it("asks before leaving with changes, but not when switching steps", async () => {
    renderEditor();
    await userEvent.click(screen.getByRole("button", { name: "Add session" }));
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await userEvent.click(
      screen.getByRole("button", { name: "1 Sessions & exercises, completed" }),
    );
    expect(document.querySelector("dialog[open]")).toBeNull();
    await userEvent.click(
      screen.getByRole("link", { name: /Back to Anna Weber/ }),
    );
    const dialog = document.querySelector("dialog[open]") as HTMLElement;
    expect(
      within(dialog).getByRole("heading", { name: "Save changes?" }),
    ).toBeTruthy();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Discard" }),
    );
    expect(router.push).toHaveBeenCalledWith("/athletes/a1");
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
    const { container } = renderEditor(week11, "de");
    expect(
      screen.getByRole("heading", { name: "Woche 11 von 21" }),
    ).toBeTruthy();
    expect(screen.getByText("Aufbauphase (ABP) · Mittlere Woche")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Weiter" }));
    expect(
      container.querySelector('[data-values="1"] [data-total=setSize]')!
        .textContent,
    ).toBe("Satzgröße2↓Plan 3");
    expect(
      screen.getAllByRole("textbox", {
        name: "Gewicht in kg der Satzgruppe 1 von 1 Reißen",
      }),
    ).toHaveLength(2);
  });
});
