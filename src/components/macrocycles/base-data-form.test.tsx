// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import { BaseDataForm } from "./base-data-form";
import { StepIndicator } from "./step-indicator";

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
const renderWith = (node: React.ReactNode) =>
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      {node}
    </NextIntlClientProvider>,
  );

const existing = {
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
  deficits: "Turnover",
  injuriesAndIllnesses: "None",
  competitionDate: "2027-04-24",
  competitionType: "German Championships",
};

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
    renderWith(<BaseDataForm athleteId="a1" defaultStartDate="2026-11-23" />);
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

  it("creates the macrocycle and continues to step 2", async () => {
    respond(201, {});
    renderWith(<BaseDataForm athleteId="a1" defaultStartDate="2026-11-30" />);
    await fill("Duration (weeks)", "21");
    await fill("Date of the main competition", "2027-04-24");
    await fill("Type of the main competition", "German Championships");
    await fill("Personal best snatch (kg)", "90");
    await fill("Personal best clean & jerk (kg)", "115");
    await fill("Goal snatch (kg)", "100");
    await fill("Goal clean & jerk (kg)", "130");
    await fill("Body weight (kg)", "81");
    await fill("Target body weight (kg)", "80.5");
    await fill("Current deficits", "Turnover");
    await fill("Current and chronic injuries and illnesses", "None");
    await userEvent.click(
      screen.getByRole("button", { name: "Save and continue" }),
    );

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/athletes/a1/macrocycle");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      ...existing,
      bodyFatPct: null,
      muscleMassPct: null,
    });
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith(
        "/athletes/a1/macrocycle/intensity",
      ),
    );
  });

  it("changes an existing macrocycle with PATCH", async () => {
    respond(200, {});
    renderWith(
      <BaseDataForm
        athleteId="a1"
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
    });
  });

  it("shows field errors from the API", async () => {
    respond(400, {
      error: {
        code: "VALIDATION_FAILED",
        fields: { startDate: ["NOT_MONDAY"], snatchGoalKg: ["REQUIRED"] },
      },
    });
    renderWith(<BaseDataForm athleteId="a1" defaultStartDate="2026-11-30" />);
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

describe("StepIndicator", () => {
  it("marks the current step and links the others once a macrocycle exists", () => {
    const view = renderWith(
      <StepIndicator athleteId="a1" current="intensity" available />,
    );
    expect(screen.getByText("2 Intensity").getAttribute("aria-current")).toBe(
      "step",
    );
    expect(screen.getByRole("link", { name: "1 Base data" })).toHaveProperty(
      "pathname",
      "/athletes/a1/macrocycle/base-data",
    );
    expect(screen.getByRole("link", { name: "3 Exercises" })).toBeTruthy();
    view.unmount();
    renderWith(
      <StepIndicator athleteId="a1" current="base-data" available={false} />,
    );
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
