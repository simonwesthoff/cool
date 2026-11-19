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
import {
  cycleProgress,
  intensity,
  splitMesocycles,
} from "@/domain/macrocycles/calculation";
import type { Macrocycle } from "@/domain/macrocycles/macrocycle-types";
import { MacrocyclePlanning } from "./macrocycle-planning";
import type { PlanningStep } from "./planning-steps";
import { UnsavedChangesProvider } from "./unsaved-changes";

const router = { push: vi.fn(), refresh: vi.fn(), bfcacheId: "v1" };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
const fetchMock = vi.fn();
const respond = (status: number, body: unknown) =>
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );

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
  // The chart measures its container.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private cb: ResizeObserverCallback) {}
      observe() {
        this.cb(
          [{ contentRect: { width: 800 } } as ResizeObserverEntry],
          this as unknown as ResizeObserver,
        );
      }
      disconnect() {}
    },
  );
});
beforeEach(() => {
  fetchMock.mockReset();
  router.push.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  window.history.replaceState(null, "", "/athletes/a1/macrocycle/planning");
});
afterEach(cleanup);

const swot = {
  strengths: "Fast under the bar",
  snatchDeficits: "Turnover",
  cleanDeficits: "Catch position",
  jerkDeficits: "Dip",
  otherDeficits: "None",
  experience: "6 years, 2 national championships",
  focusPoints: ["Turnover", "Squat strength"],
  injuriesAndIllnesses: "None",
};
/** A planned macrocycle of `count` weeks from Monday 2026-11-30. */
function macrocycleOf(count = 21): Macrocycle {
  const spans = splitMesocycles(count);
  return {
    athleteId: "a1",
    startDate: "2026-11-30",
    durationWeeks: count,
    entryValuePct: 60,
    snatchBestKg: 90,
    cleanAndJerkBestKg: 115,
    snatchGoalKg: 100,
    cleanAndJerkGoalKg: 130,
    bodyWeightKg: 81,
    targetBodyWeightKg: 80.5,
    bodyFatPct: null,
    muscleMassPct: null,
    competitionDate: "2027-04-24",
    competitionType: "German Championships",
    trainingFrequency: 1,
    sessions: [{ weekday: 1, slot: 1 }],
    ...swot,
    mesocycles: spans.map((m) => ({ ...m, exercises: [] })),
    curve: { entryPct: 60, anchors: [], entryT: 0, endPct: 100, endT: 1 },
    weeks: Array.from({ length: count }, (_, i) => ({
      number: i + 1,
      startDate: new Date(Date.UTC(2026, 10, 30 + 7 * i))
        .toISOString()
        .slice(0, 10),
      mesocycle: spans.find((m) => i + 1 >= m.firstWeek && i + 1 <= m.lastWeek)!
        .type,
      level: "medium",
      intensityPct:
        Math.round(
          intensity(0.6, cycleProgress(i + 1, count), "medium") * 1000,
        ) / 10,
      volume: null,
      exercises: [],
    })),
  } as unknown as Macrocycle;
}

function renderPlanning(
  {
    step = "swot",
    macrocycle = macrocycleOf(),
  }: { step?: PlanningStep; macrocycle?: Macrocycle | null } = {},
  locale: "en" | "de" = "en",
) {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "de" ? de : en}
      timeZone="UTC"
    >
      <UnsavedChangesProvider>
        <MacrocyclePlanning
          athleteId="a1"
          athleteName="Anna Weber"
          initialStep={step}
          initialMacrocycle={macrocycle}
          catalog={[]}
          defaultStartDate="2026-11-30"
        />
      </UnsavedChangesProvider>
    </NextIntlClientProvider>,
  );
}
const stepOf = (container: HTMLElement) =>
  container
    .querySelector("[data-planning-step]")!
    .getAttribute("data-planning-step");
const stepButton = (name: string) => screen.getByRole("button", { name });
const dialog = () => document.querySelector("dialog") as HTMLDialogElement;
async function fill(label: string, value: string) {
  const input = screen.getByLabelText(new RegExp(`^${label}`));
  await userEvent.clear(input);
  await userEvent.type(input, value);
}

describe("MacrocyclePlanning", () => {
  it("has the title, the back link and the stepper with completed, current and upcoming steps", () => {
    const { container } = renderPlanning({ step: "intensity" });
    expect(
      screen.getByRole("heading", { name: "Anna's macrocycle planning" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Back to the macrocycle" }),
    ).toHaveProperty("pathname", "/athletes/a1/macrocycle");
    const nav = screen.getByRole("navigation", { name: "Planning steps" });
    expect(
      within(nav).getByText("4 Weeks").closest("[aria-current=step]"),
    ).toBeTruthy();
    // The other steps are buttons on the same page, not links.
    expect(within(nav).queryAllByRole("link")).toHaveLength(0);
    for (const name of [
      "1 Base data, completed",
      "2 SWOT, completed",
      "3 Curve, completed",
      "5 Exercises",
    ])
      expect(within(nav).getByRole("button", { name })).toBeTruthy();
    expect(stepOf(container)).toBe("intensity");
  });

  it("switches steps on the page, keeps the step in the address and loads nothing", async () => {
    const { container } = renderPlanning({ step: "swot" });
    await userEvent.click(stepButton("3 Curve"));
    expect(stepOf(container)).toBe("curve");
    expect(window.location.search).toBe("?step=curve");
    expect(
      screen.getByRole("group", { name: "Intensity per week" }),
    ).toBeTruthy();
    await userEvent.click(stepButton("Continue to weeks"));
    expect(stepOf(container)).toBe("intensity");
    expect(window.location.search).toBe("?step=intensity");
    await userEvent.click(stepButton("Continue to exercises"));
    expect(stepOf(container)).toBe("exercises");
    expect(window.location.search).toBe("?step=exercises");
    await userEvent.click(stepButton("Back to weeks"));
    expect(stepOf(container)).toBe("intensity");
    await userEvent.click(stepButton("Back to curve"));
    expect(stepOf(container)).toBe("curve");
    await userEvent.click(stepButton("Back to SWOT"));
    expect(stepOf(container)).toBe("swot");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("slides the new step in from the right going forward and from the left going back", async () => {
    const { container } = renderPlanning({ step: "swot" });
    const slide = () => container.querySelector("[data-slide]")!;
    // No slide on the first render.
    expect(slide().getAttribute("data-slide")).toBe("none");
    expect(slide().className).toContain("motion-reduce:transition-none");
    await userEvent.click(stepButton("3 Curve"));
    expect(slide().getAttribute("data-slide")).toBe("forward");
    expect(slide().className).toContain("starting:translate-x-8");
    expect(slide().className).toContain("duration-300");
    await userEvent.click(stepButton("1 Base data, completed"));
    expect(slide().getAttribute("data-slide")).toBe("back");
    expect(slide().className).toContain("starting:-translate-x-8");
    expect(slide().parentElement!.className).toContain("overflow-x-clip");
  });

  it("disables steps 2 to 5 before the macrocycle exists and enables them after saving step 1", async () => {
    const created = macrocycleOf();
    respond(201, created);
    const { container } = renderPlanning({
      step: "base-data",
      macrocycle: null,
    });
    expect(
      screen.getByRole("link", { name: "Back to Anna Weber" }),
    ).toHaveProperty("pathname", "/athletes/a1");
    const nav = screen.getByRole("navigation", { name: "Planning steps" });
    expect(within(nav).queryAllByRole("button")).toHaveLength(0);
    expect(nav.querySelectorAll("[aria-disabled=true]")).toHaveLength(4);
    await fill("Duration \\(weeks\\)", "21");
    await fill("Date of the main competition", "2027-04-24");
    await fill("Type of the main competition", "German Championships");
    for (const [label, value] of [
      ["Personal best snatch", "90"],
      ["Personal best clean", "115"],
      ["Goal snatch", "100"],
      ["Goal clean", "130"],
      ["Body weight", "81"],
      ["Target body weight", "80.5"],
    ])
      await fill(label!, value!);
    await userEvent.click(
      screen.getByRole("button", { name: "Add a session on Monday" }),
    );
    await userEvent.click(stepButton("Save and continue"));
    await waitFor(() => expect(stepOf(container)).toBe("swot"));
    expect(window.location.search).toBe("?step=swot");
    expect(nav.querySelectorAll("[aria-disabled=true]")).toHaveLength(0);
    expect(
      screen.getByRole("link", { name: "Back to the macrocycle" }),
    ).toBeTruthy();
  });

  it("shows the weeks of a changed duration in step 3 without reloading", async () => {
    respond(200, macrocycleOf(24));
    const { container } = renderPlanning({ step: "base-data" });
    await fill("Duration \\(weeks\\)", "24");
    await userEvent.click(stepButton("Save and continue"));
    await waitFor(() => expect(stepOf(container)).toBe("swot"));
    await userEvent.click(stepButton("4 Weeks"));
    const labels = [...container.querySelectorAll("rect[data-week]")].map((t) =>
      Number(t.getAttribute("data-week")),
    );
    expect(Math.max(...labels)).toBe(24);
    expect(router.refresh).not.toHaveBeenCalled();
  });
});

describe("Unsaved changes when changing the step", () => {
  it("asks before leaving with changes and discards them on request", async () => {
    const { container } = renderPlanning();
    await fill("Strengths", "Explosive");
    await userEvent.click(stepButton("1 Base data, completed"));
    expect(dialog().open).toBe(true);
    expect(
      within(dialog()).getByRole("heading", { name: "Save changes?" }),
    ).toBeTruthy();
    expect(
      within(dialog())
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual(["Save", "Discard", "Cancel"]);
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Discard" }),
    );
    expect(dialog().open).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(stepOf(container)).toBe("base-data");
  });

  it("saves the changes and then opens the chosen step", async () => {
    respond(200, { ...macrocycleOf(), strengths: "Explosive" });
    const { container } = renderPlanning();
    await fill("Strengths", "Explosive");
    await userEvent.click(stepButton("1 Base data, completed"));
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Save" }),
    );
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/athletes/a1/macrocycle/swot");
    expect(JSON.parse(init.body)).toEqual({ ...swot, strengths: "Explosive" });
    await waitFor(() => expect(stepOf(container)).toBe("base-data"));
    // Back in step 2, the saved SWOT is shown.
    await userEvent.click(stepButton("2 SWOT"));
    expect(
      (screen.getByLabelText("Strengths") as HTMLTextAreaElement).value,
    ).toBe("Explosive");
  });

  it("stays on the step and shows the errors when saving fails", async () => {
    respond(400, {
      error: { code: "VALIDATION_FAILED", fields: { strengths: ["TOO_LONG"] } },
    });
    const { container } = renderPlanning();
    await fill("Strengths", "Explosive");
    await userEvent.click(stepButton("1 Base data, completed"));
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Save" }),
    );
    await waitFor(() => expect(dialog().open).toBe(false));
    expect(stepOf(container)).toBe("swot");
    expect(
      await screen.findByText("Please check the marked fields."),
    ).toBeTruthy();
  });

  it("keeps the step and the changes when cancelled", async () => {
    const { container } = renderPlanning();
    await fill("Strengths", "Explosive");
    await userEvent.click(stepButton("1 Base data, completed"));
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Cancel" }),
    );
    expect(dialog().open).toBe(false);
    expect(stepOf(container)).toBe("swot");
    expect(
      (screen.getByLabelText("Strengths") as HTMLTextAreaElement).value,
    ).toBe("Explosive");
  });

  it("does not ask without changes", async () => {
    const { container } = renderPlanning();
    await userEvent.click(stepButton("1 Base data, completed"));
    expect(dialog().open).toBe(false);
    expect(stepOf(container)).toBe("base-data");
  });

  it("uses German texts", async () => {
    renderPlanning({}, "de");
    expect(
      screen.getByRole("heading", { name: "Makrozyklusplanung für Anna" }),
    ).toBeTruthy();
    await fill("Stärken", "Explosiv");
    await userEvent.click(stepButton("1 Stammdaten, abgeschlossen"));
    expect(
      within(dialog()).getByRole("heading", { name: "Änderungen speichern?" }),
    ).toBeTruthy();
    for (const name of ["Speichern", "Verwerfen", "Abbrechen"])
      expect(within(dialog()).getByRole("button", { name })).toBeTruthy();
    expect(screen.getByRole("button", { name: "3 Kurve" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "4 Wochen" })).toBeTruthy();
  });
});
