// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import de from "../../../messages/de.json";
import en from "../../../messages/en.json";
import { AthleteHome } from "./athlete-home";

afterEach(cleanup);
const macrocycle = {
  startDate: "2026-11-30",
  durationWeeks: 21,
  competitionDate: "2027-04-24",
  competitionType: "German Championships",
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

  it("gives the athlete only the macrocycle card", () => {
    renderHome();
    expect(links()).toEqual(["/training/macrocycle"]);
    const card = screen.getByRole("link", { name: "Open macrocycle" });
    expect(card.textContent).toContain("Nov 30, 2026 – Apr 25, 2027");
    expect(card.textContent).toContain("German Championships, Apr 24, 2027");
    expect(
      screen.getByText("Your training plan will appear here."),
    ).toBeTruthy();
    cleanup();
    renderHome({ macrocycle: null });
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("gives the coach the same cards plus the way back, the basic data pencil and planning", () => {
    renderHome({ viewer: "coach" });
    expect(links()).toEqual([
      "/",
      "/athletes/a1/basic-data",
      "/athletes/a1/macrocycle",
    ]);
    const pencil = screen.getByRole("link", { name: "Edit basic data" });
    expect(pencil.previousElementSibling?.textContent).toBe("Anna Weber");
    expect(screen.queryByText("Basic data")).toBeNull();
    expect(screen.getByRole("link", { name: /Back to athletes/ })).toBeTruthy();
    cleanup();
    renderHome({ viewer: "coach", macrocycle: null });
    expect(links()).toEqual([
      "/",
      "/athletes/a1/basic-data",
      "/athletes/a1/macrocycle/base-data",
    ]);
    expect(
      screen.getByRole("link", { name: /Plan macrocycle/ }).textContent,
    ).toContain("No macrocycle planned yet.");
  });

  it("is translated to German", () => {
    renderHome({ viewer: "coach" }, "de");
    expect(screen.getByText("Trainer: Max Berg")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Stammdaten bearbeiten" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Makrozyklus öffnen" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Zurück zu den Athleten/ }),
    ).toBeTruthy();
  });
});
