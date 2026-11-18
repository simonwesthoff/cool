// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import de from "../../../messages/de.json";
import en from "../../../messages/en.json";
import { splitMesocycles } from "@/domain/macrocycles/calculation";
import { AthleteHome, type AthleteHomeMacrocycle } from "./athlete-home";

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(
        private cb: (entries: { contentRect: { width: number } }[]) => void,
      ) {}
      observe() {
        this.cb([{ contentRect: { width: 800 } }]);
      }
      disconnect() {}
    },
  );
});
afterEach(cleanup);

const N = 21;
const mesocycles = splitMesocycles(N);
const macrocycle: AthleteHomeMacrocycle = {
  macrocycle: {
    competitionDate: "2027-04-24",
    competitionType: "German Championships",
    mesocycles: mesocycles.map((m) => ({
      ...m,
      exerciseNumbers: [],
      exercises: [],
    })),
    weeks: Array.from({ length: N }, (_, i) => ({
      number: i + 1,
      startDate: new Date(Date.UTC(2026, 10, 30 + 7 * i))
        .toISOString()
        .slice(0, 10),
      mesocycle: mesocycles.find(
        (m) => i + 1 >= m.firstWeek && i + 1 <= m.lastWeek,
      )!.type,
      level: "medium",
      intensityPct: 80,
      volume: null,
      exercises: [],
    })),
  } as unknown as AthleteHomeMacrocycle["macrocycle"],
  values: {
    exerciseNumber: 1,
    weeks: Array.from({ length: N }, (_, i) => ({
      number: i + 1,
      bestKg: 70 + i,
      averageKg: 60,
      setSize: 3,
      weeklyReps: 20,
    })),
  },
  today: "2027-01-06",
};

function renderHome(
  props: Partial<React.ComponentProps<typeof AthleteHome>> = {},
  locale: "en" | "de" = "en",
) {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "de" ? de : en}
      timeZone="UTC"
    >
      <AthleteHome
        viewer="athlete"
        athleteId="a1"
        name="Anna Weber"
        image={null}
        coachName="Max Berg"
        canEdit={false}
        macrocycle={macrocycle}
        {...props}
      />
    </NextIntlClientProvider>,
  );
}
const links = () =>
  screen.getAllByRole("link").map((l) => (l as HTMLAnchorElement).pathname);

describe("AthleteHome", () => {
  it("shows picture, name and coach on top, for both viewers", () => {
    for (const viewer of ["athlete", "coach"] as const) {
      renderHome({ viewer });
      expect(
        screen.getByRole("img", { name: "Profile picture of Anna Weber" })
          .textContent,
      ).toBe("AW");
      expect(screen.getByRole("heading", { name: "Anna Weber" })).toBeTruthy();
      expect(screen.getByText("Coach: Max Berg")).toBeTruthy();
      cleanup();
    }
  });

  it("shows the macrocycle as the best value chart with a button below it", () => {
    const { container } = renderHome();
    const section = screen.getByRole("region", { name: "Macrocycle" });
    const chart = section.querySelector("figure")!;
    expect(
      section.querySelector("[data-curve]")!.getAttribute("data-curve"),
    ).toBe("bestKg");
    expect(
      section.querySelector('[data-point="11"]')!.getAttribute("data-value"),
    ).toBe("80");
    expect(container.querySelector("[data-current-week]")).toBeTruthy();
    const button = screen.getByRole("link", { name: "Open macrocycle" });
    expect(button).toHaveProperty("pathname", "/training/macrocycle");
    expect(
      chart.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(button.className).toContain("self-end");
    expect(links()).toEqual(["/training/macrocycle"]);
    expect(
      screen.getByText("Your training plan will appear here."),
    ).toBeTruthy();
  });

  it("shows nothing for the athlete without a macrocycle", () => {
    const { container } = renderHome({ macrocycle: null });
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(container.querySelector("figure")).toBeNull();
  });

  it("gives the coach the same chart plus the way back, the basic data pencil and planning", () => {
    renderHome({ viewer: "coach", canEdit: true });
    expect(links()).toEqual([
      "/",
      "/athletes/a1/basic-data",
      "/athletes/a1/macrocycle",
    ]);
    const pencil = screen.getByRole("link", { name: "Edit basic data" });
    expect(pencil.previousElementSibling?.textContent).toBe("Anna Weber");
    cleanup();
    renderHome({ viewer: "coach", canEdit: true, macrocycle: null });
    expect(links()).toEqual([
      "/",
      "/athletes/a1/basic-data",
      "/athletes/a1/macrocycle/base-data",
    ]);
    expect(
      screen.getByRole("link", { name: /Plan macrocycle/ }).textContent,
    ).toContain("No macrocycle planned yet.");
  });

  it("gives a coach who trains themselves the pencil and planning on My training", () => {
    renderHome({ canEdit: true });
    expect(links()).toEqual([
      "/athletes/a1/basic-data",
      "/training/macrocycle",
    ]);
    expect(screen.getByRole("link", { name: "Edit basic data" })).toBeTruthy();
    cleanup();
    renderHome({ canEdit: true, macrocycle: null });
    expect(links()).toEqual([
      "/athletes/a1/basic-data",
      "/athletes/a1/macrocycle/base-data",
    ]);
    // No way back on a top-level page.
    expect(screen.queryByRole("link", { name: /Back/ })).toBeNull();
  });

  it("is translated to German", () => {
    renderHome({ viewer: "coach", canEdit: true }, "de");
    expect(screen.getByText("Trainer: Max Berg")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Stammdaten bearbeiten" }),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Zum Makrozyklus" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Zurück zu den Athleten/ }),
    ).toBeTruthy();
  });
});
