// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import de from "../../../messages/de.json";
import en from "../../../messages/en.json";
import { BaseDataForm } from "./base-data-form";

const router = { push: vi.fn(), refresh: vi.fn(), bfcacheId: "v1" };
const onSaved = vi.fn();
const onContinue = vi.fn();
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
  onSaved.mockReset();
  onContinue.mockReset();
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
      <BaseDataForm
        onSaved={onSaved}
        onContinue={onContinue}
        athleteId="a1"
        part="base"
        defaultStartDate="2026-11-23"
      />,
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
      <BaseDataForm
        onSaved={onSaved}
        onContinue={onContinue}
        athleteId="a1"
        part="base"
        defaultStartDate="2026-11-23"
      />,
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
    respond(201, { ...baseData, id: "m1" });
    renderWith(
      <BaseDataForm
        onSaved={onSaved}
        onContinue={onContinue}
        athleteId="a1"
        part="base"
        defaultStartDate="2026-11-30"
      />,
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
      screen.getByRole("button", { name: "Continue to SWOT" }),
    );

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/athletes/a1/macrocycle");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      ...baseData,
      bodyFatPct: null,
      muscleMassPct: null,
    });
    // The planning gets the stored macrocycle and opens the SWOT step.
    await waitFor(() => expect(onContinue).toHaveBeenCalledTimes(1));
    expect(onSaved).toHaveBeenCalledWith({ ...baseData, id: "m1" });
    expect(router.push).not.toHaveBeenCalled();
  });

  it("changes an existing macrocycle with PATCH", async () => {
    respond(200, {});
    renderWith(
      <BaseDataForm
        onSaved={onSaved}
        onContinue={onContinue}
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
      screen.getByRole("button", { name: "Continue to SWOT" }),
    );
    // The pending change alone, then the whole step to check it.
    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({ snatchGoalKg: 105 });
    const [, all] = fetchMock.mock.calls[1]!;
    expect(all.method).toBe("PATCH");
    expect(JSON.parse(all.body)).toMatchObject({
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
        onSaved={onSaved}
        onContinue={onContinue}
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
      screen.getByRole("button", { name: "Continue to SWOT" }),
    );
    const [, init] = fetchMock.mock.calls[0]!;
    expect(JSON.parse(init.body).sessions).toEqual([
      { weekday: 1, slot: 1 },
      { weekday: 1, slot: 2 },
      { weekday: 1, slot: 3 },
      { weekday: 5, slot: 1 },
    ]);
  });

  it("explains that planned weeks block a shorter duration", async () => {
    respond(400, {
      error: {
        code: "VALIDATION_FAILED",
        fields: { durationWeeks: ["WEEKS_PLANNED"] },
      },
    });
    renderWith(
      <BaseDataForm
        onSaved={onSaved}
        onContinue={onContinue}
        athleteId="a1"
        part="base"
        macrocycle={existing}
        defaultStartDate="2026-11-23"
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Continue to SWOT" }),
    );
    expect(
      await screen.findByText("Weeks with a week plan would be removed."),
    ).toBeTruthy();
  });

  it("explains a missing schedule", async () => {
    respond(400, {
      error: { code: "VALIDATION_FAILED", fields: { sessions: ["REQUIRED"] } },
    });
    renderWith(
      <BaseDataForm
        onSaved={onSaved}
        onContinue={onContinue}
        athleteId="a1"
        part="base"
        defaultStartDate="2026-11-30"
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Continue to SWOT" }),
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
      <BaseDataForm
        onSaved={onSaved}
        onContinue={onContinue}
        athleteId="a1"
        part="base"
        defaultStartDate="2026-11-30"
      />,
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
      <BaseDataForm
        onSaved={onSaved}
        onContinue={onContinue}
        athleteId="a1"
        part="base"
        defaultStartDate="2026-11-30"
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Continue to SWOT" }),
    );
    expect(await screen.findByText("Please choose a Monday.")).toBeTruthy();
    expect(screen.getByText("Required.")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toBe(
      "Please check the marked fields.",
    );
    expect(onContinue).not.toHaveBeenCalled();
  });
});

describe("SWOT", () => {
  it("shows strengths, deficits, experience, focus points and injuries in this order", () => {
    renderWith(
      <BaseDataForm
        onSaved={onSaved}
        onContinue={onContinue}
        athleteId="a1"
        part="swot"
        defaultStartDate="2026-11-23"
      />,
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
        onSaved={onSaved}
        onContinue={onContinue}
        athleteId="a1"
        part="swot"
        macrocycle={existing}
        defaultStartDate="2026-11-23"
      />,
    );
    await fill("Strengths", "Explosive");
    await userEvent.click(
      screen.getByRole("button", { name: "Continue to curve" }),
    );
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/athletes/a1/macrocycle/swot");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body)).toEqual({ strengths: "Explosive" });
    const [, all] = fetchMock.mock.calls[1]!;
    expect(JSON.parse(all.body)).toEqual({ ...swot, strengths: "Explosive" });
    await waitFor(() => expect(onContinue).toHaveBeenCalledTimes(1));
    expect(onSaved).toHaveBeenCalledWith({});
    expect(router.push).not.toHaveBeenCalled();
  });
});

describe("focus points", () => {
  it("adds up to three, reorders and removes them", async () => {
    respond(200, {});
    renderWith(
      <BaseDataForm
        onSaved={onSaved}
        onContinue={onContinue}
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
      screen.getByRole("button", { name: "Continue to curve" }),
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
      <BaseDataForm
        onSaved={onSaved}
        onContinue={onContinue}
        athleteId="a1"
        part="swot"
        defaultStartDate="2026-11-23"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Remove focus point 1" }),
    ).toHaveProperty("disabled", true);
    await userEvent.click(
      screen.getByRole("button", { name: "Continue to curve" }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body).focusPoints).toEqual(
      [],
    );
    expect(await screen.findByText("Required.")).toBeTruthy();
  });
});

describe("automatic saving", () => {
  const form = (part: "base" | "swot", macrocycle?: typeof existing) =>
    renderWith(
      <BaseDataForm
        onSaved={onSaved}
        onContinue={onContinue}
        athleteId="a1"
        part={part}
        macrocycle={macrocycle}
        defaultStartDate="2026-11-30"
      />,
    );
  const bodies = () =>
    fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body));
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });

  it("saves a changed field shortly after typing, without a button", async () => {
    respond(200, { ...existing, snatchGoalKg: 105 });
    form("base", existing);
    await fill("Goal snatch (kg)", "105");
    expect(fetchMock).not.toHaveBeenCalled();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/athletes/a1/macrocycle");
    expect(init.method).toBe("PATCH");
    expect(init.keepalive).toBe(true);
    expect(bodies()).toEqual([{ snatchGoalKg: 105 }]);
    expect(await screen.findByText("Saved")).toBeTruthy();
    expect(onSaved).toHaveBeenCalledWith({ ...existing, snatchGoalKg: 105 });
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("marks an invalid field, leaves it out and saves the others", async () => {
    fetchMock
      .mockResolvedValueOnce(
        json(400, {
          error: {
            code: "VALIDATION_FAILED",
            fields: { bodyWeightKg: ["OUT_OF_RANGE"] },
          },
        }),
      )
      .mockResolvedValue(json(200, existing));
    form("base", existing);
    await fill("Body weight (kg)", "500");
    await fill("Goal snatch (kg)", "105");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(bodies()).toEqual([
      { bodyWeightKg: 500, snatchGoalKg: 105 },
      { snatchGoalKg: 105 },
    ]);
    expect(
      screen.getByLabelText(/^Body weight \(kg\)/).getAttribute("aria-invalid"),
    ).toBe("true");
    expect(await screen.findByText("Check the marked fields.")).toBeTruthy();
  });

  it("creates a new macrocycle only once all required base data are filled", async () => {
    respond(201, { ...baseData, id: "m1" });
    form("base");
    await fill("Duration (weeks)", "21");
    await fill("Date of the main competition", "2027-04-24");
    await new Promise((r) => setTimeout(r, 800));
    expect(fetchMock).not.toHaveBeenCalled();
    await fill("Type of the main competition", "German Championships");
    await fill("Personal best snatch (kg)", "90");
    await fill("Personal best clean & jerk (kg)", "115");
    await fill("Goal snatch (kg)", "100");
    await fill("Goal clean & jerk (kg)", "130");
    await fill("Body weight (kg)", "81");
    await fill("Target body weight (kg)", "80.5");
    await new Promise((r) => setTimeout(r, 800));
    expect(fetchMock).not.toHaveBeenCalled();
    // The schedule is the last required field.
    await userEvent.click(
      screen.getByRole("button", { name: "Add a session on Monday" }),
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0]![1].method).toBe("POST");
    expect(onSaved).toHaveBeenCalledWith({ ...baseData, id: "m1" });
    // Later changes are saved with PATCH.
    await fill("Goal snatch (kg)", "102");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1]![1].method).toBe("PATCH");
    expect(bodies()[1]).toEqual({ snatchGoalKg: 102 });
  });

  it("stays on step 1 and marks the missing fields when continuing too early", async () => {
    respond(400, {
      error: {
        code: "VALIDATION_FAILED",
        fields: { competitionType: ["REQUIRED"] },
      },
    });
    form("base");
    await fill("Duration (weeks)", "21");
    await userEvent.click(
      screen.getByRole("button", { name: "Continue to SWOT" }),
    );
    // Only the check on continuing: nothing was saved while typing.
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0]![1].method).toBe("POST");
    expect(
      await screen.findByText("Please check the marked fields."),
    ).toBeTruthy();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("does not save an emptied SWOT field while typing, and asks for it on continuing", async () => {
    form("swot", existing);
    await userEvent.clear(screen.getByLabelText(/^Strengths/));
    await new Promise((r) => setTimeout(r, 800));
    expect(fetchMock).not.toHaveBeenCalled();
    respond(400, {
      error: {
        code: "VALIDATION_FAILED",
        fields: { strengths: ["REQUIRED"] },
      },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Continue to curve" }),
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(bodies()[0]).toEqual({ ...swot, strengths: "" });
    expect(await screen.findByText("Required.")).toBeTruthy();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("places back at the left and continue at the right", () => {
    renderWith(
      <BaseDataForm
        onSaved={onSaved}
        onContinue={onContinue}
        onBack={() => {}}
        athleteId="a1"
        part="swot"
        macrocycle={existing}
        defaultStartDate="2026-11-30"
      />,
    );
    const back = screen.getByRole("button", { name: "Back to base data" });
    const next = screen.getByRole("button", { name: "Continue to curve" });
    expect(back.closest("[data-stepper-back]")).toBeTruthy();
    expect(next.closest("[data-stepper-next]")).toBeTruthy();
    expect(back.className).not.toContain("border");
    expect(next.className).toContain("bg-zinc-900");
  });
});
