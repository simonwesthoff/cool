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
import { BaseDataForm } from "./base-data-form";
import { StepIndicator } from "./step-indicator";
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
const renderWith = (node: React.ReactNode, locale: "en" | "de" = "en") =>
  render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "de" ? de : en}
    >
      {node}
    </NextIntlClientProvider>,
  );

const baseData = {
  startDate: "2026-11-30",
  durationWeeks: 21,
  entryValuePct: 60,
  snatchBestKg: 90,
  cleanAndJerkBestKg: 115,
  snatchGoalKg: 100,
  cleanAndJerkGoalKg: 130,
  bodyWeightKg: 81,
  targetBodyWeightKg: 80.5,
  bodyFatPct: 12,
  muscleMassPct: null,
  competitionDate: "2027-04-24",
  competitionType: "German Championships",
  sessions: [
    { weekday: 1, slot: 1 },
    { weekday: 1, slot: 2 },
    { weekday: 3, slot: 1 },
    { weekday: 5, slot: 1 },
  ],
};
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
const existing = { ...baseData, ...swot, trainingFrequency: 4 };

beforeEach(() => {
  fetchMock.mockReset();
  router.push.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function fill(label: string, value: string) {
  const input = screen.getByLabelText(
    new RegExp(`^${label.replace(/[()]/g, "\\$&")}`),
  );
  await userEvent.clear(input);
  await userEvent.type(input, value);
}

describe("BaseDataForm", () => {
  it("starts with entry value 60 % and the next Monday", () => {
    renderWith(
      <BaseDataForm athleteId="a1" part="base" defaultStartDate="2026-11-23" />,
    );
    expect(screen.getByLabelText("Entry value (%)")).toHaveProperty(
      "value",
      "60",
    );
    expect(screen.getByLabelText("Start")).toHaveProperty(
      "value",
      "2026-11-23",
    );
    expect(
      screen.getByLabelText(/^Body fat/).closest("div")!.textContent,
    ).toContain("(optional)");
  });

  it("has the sections Historical data and New macrocycle plan, without SWOT fields", () => {
    renderWith(
      <BaseDataForm athleteId="a1" part="base" defaultStartDate="2026-11-23" />,
    );
    const legends = [...document.querySelectorAll("legend")].map(
      (l) => l.textContent,
    );
    expect(legends).toEqual(["Historical data", "New macrocycle plan"]);
    const labelsIn = (legend: string) =>
      [
        ...[...document.querySelectorAll("fieldset")]
          .find((f) => f.querySelector("legend")!.textContent === legend)!
          .querySelectorAll("label"),
      ].map((l) => l.textContent);
    expect(labelsIn("Historical data")).toEqual([
      "Personal best snatch (kg)",
      "Personal best clean & jerk (kg)",
      "Body weight (kg)",
      "Body fat (%) (optional)",
      "Muscle mass (%) (optional)",
    ]);
    expect(
      screen.getByRole("group", { name: "Training sessions per week" }),
    ).toBeTruthy();
    expect(screen.queryByLabelText("Strengths")).toBeNull();
    expect(screen.queryByLabelText("Focus point 1")).toBeNull();
  });

  it("creates the macrocycle and continues to the SWOT", async () => {
    respond(201, {});
    renderWith(
      <BaseDataForm athleteId="a1" part="base" defaultStartDate="2026-11-30" />,
    );
    await fill("Duration (weeks)", "21");
    await fill("Date of the main competition", "2027-04-24");
    await fill("Type of the main competition", "German Championships");
    await fill("Personal best snatch (kg)", "90");
    await fill("Personal best clean & jerk (kg)", "115");
    await fill("Goal snatch (kg)", "100");
    await fill("Goal clean & jerk (kg)", "130");
    await fill("Body weight (kg)", "81");
    await fill("Target body weight (kg)", "80.5");
    for (const day of ["Monday", "Monday", "Wednesday", "Friday"])
      await userEvent.click(
        screen.getByRole("button", { name: `Add a session on ${day}` }),
      );
    await userEvent.click(
      screen.getByRole("button", { name: "Save and continue" }),
    );

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/athletes/a1/macrocycle");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      ...baseData,
      bodyFatPct: null,
      muscleMassPct: null,
    });
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/athletes/a1/macrocycle/swot"),
    );
  });

  it("changes an existing macrocycle with PATCH", async () => {
    respond(200, {});
    renderWith(
      <BaseDataForm
        athleteId="a1"
        part="base"
        macrocycle={existing}
        defaultStartDate="2026-11-23"
      />,
    );
    expect(screen.getByLabelText("Start")).toHaveProperty(
      "value",
      "2026-11-30",
    );
    await fill("Goal snatch (kg)", "105");
    await userEvent.click(
      screen.getByRole("button", { name: "Save and continue" }),
    );
    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toMatchObject({
      snatchGoalKg: 105,
      bodyFatPct: 12,
      muscleMassPct: null,
      // The stored schedule is sent again unchanged.
      sessions: baseData.sessions,
    });
  });

  it("picks the weekly schedule with up to 3 sessions per day", async () => {
    respond(200, {});
    renderWith(
      <BaseDataForm
        athleteId="a1"
        part="base"
        macrocycle={existing}
        defaultStartDate="2026-11-23"
      />,
    );
    const group = screen.getByRole("group", {
      name: "Training sessions per week",
    });
    expect(group.textContent).toContain("4 sessions per week");
    // A third session on Monday; then no further one is offered there.
    await userEvent.click(
      screen.getByRole("button", { name: "Add a session on Monday" }),
    );
    expect(
      screen.queryByRole("button", { name: "Add a session on Monday" }),
    ).toBeNull();
    // Removing Wednesday's session.
    await userEvent.click(
      screen.getByRole("button", { name: "Remove session 1 on Wednesday" }),
    );
    expect(group.textContent).toContain("4 sessions per week");
    await userEvent.click(
      screen.getByRole("button", { name: "Save and continue" }),
    );
    const [, init] = fetchMock.mock.calls[0]!;
    expect(JSON.parse(init.body).sessions).toEqual([
      { weekday: 1, slot: 1 },
      { weekday: 1, slot: 2 },
      { weekday: 1, slot: 3 },
      { weekday: 5, slot: 1 },
    ]);
  });

  it("explains a missing schedule", async () => {
    respond(400, {
      error: { code: "VALIDATION_FAILED", fields: { sessions: ["REQUIRED"] } },
    });
    renderWith(
      <BaseDataForm athleteId="a1" part="base" defaultStartDate="2026-11-30" />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Save and continue" }),
    );
    expect(
      await screen.findByText("Choose at least one training session."),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("group", { name: "Training sessions per week" })
        .hasAttribute("data-invalid"),
    ).toBe(true);
  });

  it("labels the schedule in German", () => {
    renderWith(
      <BaseDataForm athleteId="a1" part="base" defaultStartDate="2026-11-30" />,
      "de",
    );
    expect(
      screen.getByRole("group", { name: "Trainingseinheiten pro Woche" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Einheit am Montag hinzufügen" }),
    ).toBeTruthy();
    expect(screen.getByText(/Keine Einheiten pro Woche/)).toBeTruthy();
  });

  it("shows field errors from the API", async () => {
    respond(400, {
      error: {
        code: "VALIDATION_FAILED",
        fields: { startDate: ["NOT_MONDAY"], snatchGoalKg: ["REQUIRED"] },
      },
    });
    renderWith(
      <BaseDataForm athleteId="a1" part="base" defaultStartDate="2026-11-30" />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Save and continue" }),
    );
    expect(await screen.findByText("Please choose a Monday.")).toBeTruthy();
    expect(screen.getByText("Required.")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toBe(
      "Please check the marked fields.",
    );
    expect(router.push).not.toHaveBeenCalled();
  });
});

describe("SWOT", () => {
  it("shows strengths, deficits, experience, focus points and injuries in this order", () => {
    renderWith(
      <BaseDataForm athleteId="a1" part="swot" defaultStartDate="2026-11-23" />,
    );
    const labels = [...document.querySelectorAll("label")].map(
      (l) => l.textContent,
    );
    expect(labels).toEqual([
      "Strengths",
      "Deficits in the snatch",
      "Deficits in the clean",
      "Deficits in the jerk",
      "Other deficits",
      "Weightlifting experience",
      "1.",
      "Current and chronic injuries and illnesses",
    ]);
    expect(screen.queryByLabelText("Start")).toBeNull();
  });

  it("saves the SWOT with PUT and continues to the intensity step", async () => {
    respond(200, {});
    renderWith(
      <BaseDataForm
        athleteId="a1"
        part="swot"
        macrocycle={existing}
        defaultStartDate="2026-11-23"
      />,
    );
    await fill("Strengths", "Explosive");
    await userEvent.click(
      screen.getByRole("button", { name: "Save and continue" }),
    );
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/athletes/a1/macrocycle/swot");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body)).toEqual({ ...swot, strengths: "Explosive" });
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith(
        "/athletes/a1/macrocycle/intensity",
      ),
    );
  });
});

describe("focus points", () => {
  it("adds up to three, reorders and removes them", async () => {
    respond(200, {});
    renderWith(
      <BaseDataForm
        athleteId="a1"
        part="swot"
        macrocycle={existing}
        defaultStartDate="2026-11-23"
      />,
    );
    expect(screen.getByLabelText("Focus point 1")).toHaveProperty(
      "value",
      "Turnover",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Add focus point" }),
    );
    await userEvent.type(
      screen.getByLabelText("Focus point 3"),
      "Jerk stability",
    );
    expect(
      screen.queryByRole("button", { name: "Add focus point" }),
    ).toBeNull();

    await userEvent.click(
      screen.getByRole("button", { name: "Move focus point 3 up" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Remove focus point 1" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Save and continue" }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body).focusPoints).toEqual([
      "Jerk stability",
      "Squat strength",
    ]);
  });

  it("keeps at least one entry and shows list errors", async () => {
    respond(400, {
      error: {
        code: "VALIDATION_FAILED",
        fields: { focusPoints: ["REQUIRED"] },
      },
    });
    renderWith(
      <BaseDataForm athleteId="a1" part="swot" defaultStartDate="2026-11-23" />,
    );
    expect(
      screen.getByRole("button", { name: "Remove focus point 1" }),
    ).toHaveProperty("disabled", true);
    await userEvent.click(
      screen.getByRole("button", { name: "Save and continue" }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body).focusPoints).toEqual(
      [],
    );
    expect(await screen.findByText("Required.")).toBeTruthy();
  });
});

describe("StepIndicator", () => {
  const stepOf = (container: HTMLElement, label: string) =>
    [...container.querySelectorAll("li")].find((li) =>
      li.textContent!.includes(label),
    )!;

  it("shows earlier steps as completed, the current one and later ones as links", () => {
    const { container } = renderWith(
      <StepIndicator athleteId="a1" current="intensity" available />,
    );
    expect(
      screen.getByRole("navigation", { name: "Planning steps" }),
    ).toBeTruthy();
    expect(container.querySelectorAll("li")).toHaveLength(4);
    const current = stepOf(container, "Intensity").querySelector(
      "[aria-current=step]",
    )!;
    expect(current.textContent).toContain("3 Intensity");
    expect(
      screen.getByRole("link", { name: "1 Base data, completed" }),
    ).toHaveProperty("pathname", "/athletes/a1/macrocycle/base-data");
    expect(
      screen.getByRole("link", { name: "2 SWOT, completed" }),
    ).toHaveProperty("pathname", "/athletes/a1/macrocycle/swot");
    expect(screen.getByRole("link", { name: "4 Exercises" })).toHaveProperty(
      "pathname",
      "/athletes/a1/macrocycle/exercises",
    );
    // Check marks for the completed steps, numbers for the others.
    expect(stepOf(container, "Base data").querySelector("svg")).toBeTruthy();
    expect(stepOf(container, "Exercises").querySelector("svg")).toBeNull();
  });

  it("disables steps 2 to 4 before the macrocycle exists", () => {
    const { container } = renderWith(
      <StepIndicator athleteId="a1" current="base-data" available={false} />,
    );
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(
      stepOf(container, "SWOT").querySelector("[aria-disabled=true]")!
        .textContent,
    ).toContain("2 SWOT");
    expect(container.querySelectorAll("svg")).toHaveLength(0);
  });

  it("uses German labels", () => {
    renderWith(<StepIndicator athleteId="a1" current="swot" available />, "de");
    expect(
      screen.getByRole("link", { name: "1 Stammdaten, abgeschlossen" }),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "3 Intensität" })).toBeTruthy();
  });
});

describe("Unsaved changes when changing the step", () => {
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

  const renderStep = (locale: "en" | "de" = "en") =>
    renderWith(
      <UnsavedChangesProvider>
        <StepIndicator athleteId="a1" current="swot" available />
        <BaseDataForm
          athleteId="a1"
          part="swot"
          macrocycle={existing}
          defaultStartDate="2026-11-23"
        />
      </UnsavedChangesProvider>,
      locale,
    );
  const dialog = () => document.querySelector("dialog") as HTMLDialogElement;
  const toBaseData = () =>
    userEvent.click(
      screen.getByRole("link", { name: "1 Base data, completed" }),
    );

  it("asks before leaving with changes and discards them on request", async () => {
    renderStep();
    await fill("Strengths", "Explosive");
    await toBaseData();
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
    expect(router.push).toHaveBeenCalledWith(
      "/athletes/a1/macrocycle/base-data",
    );
  });

  it("saves the changes and then opens the chosen step", async () => {
    respond(200, {});
    renderStep();
    await fill("Strengths", "Explosive");
    await toBaseData();
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Save" }),
    );
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/athletes/a1/macrocycle/swot");
    expect(JSON.parse(init.body)).toEqual({ ...swot, strengths: "Explosive" });
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith(
        "/athletes/a1/macrocycle/base-data",
      ),
    );
  });

  it("stays on the step and shows the errors when saving fails", async () => {
    respond(400, {
      error: { code: "VALIDATION_FAILED", fields: { strengths: ["TOO_LONG"] } },
    });
    renderStep();
    await fill("Strengths", "Explosive");
    await toBaseData();
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Save" }),
    );
    await waitFor(() => expect(dialog().open).toBe(false));
    expect(router.push).not.toHaveBeenCalled();
    expect(
      await screen.findByText("Please check the marked fields."),
    ).toBeTruthy();
  });

  it("keeps the step and the changes when cancelled", async () => {
    renderStep();
    await fill("Strengths", "Explosive");
    await toBaseData();
    await userEvent.click(
      within(dialog()).getByRole("button", { name: "Cancel" }),
    );
    expect(dialog().open).toBe(false);
    expect(router.push).not.toHaveBeenCalled();
    expect(
      (screen.getByLabelText("Strengths") as HTMLTextAreaElement).value,
    ).toBe("Explosive");
  });

  it("does not ask without changes", async () => {
    renderStep();
    const link = screen.getByRole("link", { name: "1 Base data, completed" });
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    expect(dialog().open).toBe(false);
    // The link navigates as usual.
    expect(click.defaultPrevented).toBe(false);
  });

  it("uses German texts", async () => {
    renderStep("de");
    await fill("Stärken", "Explosiv");
    await userEvent.click(
      screen.getByRole("link", { name: "1 Stammdaten, abgeschlossen" }),
    );
    expect(
      within(dialog()).getByRole("heading", { name: "Änderungen speichern?" }),
    ).toBeTruthy();
    for (const name of ["Speichern", "Verwerfen", "Abbrechen"])
      expect(within(dialog()).getByRole("button", { name })).toBeTruthy();
  });
});
