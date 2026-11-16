// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import de from "../../../messages/de.json";
import en from "../../../messages/en.json";
import { MacrocycleSection } from "./macrocycle-section";

afterEach(cleanup);
const renderIn = (node: React.ReactNode, locale: "en" | "de" = "en") =>
  render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "de" ? de : en}
      timeZone="UTC"
    >
      {node}
    </NextIntlClientProvider>,
  );

describe("MacrocycleSection", () => {
  it("offers to plan a macrocycle", () => {
    renderIn(<MacrocycleSection athleteId="a1" macrocycle={null} />);
    expect(screen.getByText("No macrocycle planned yet.")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Plan macrocycle" }),
    ).toHaveProperty("pathname", "/athletes/a1/macrocycle/base-data");
  });

  it("shows period and main competition of a planned macrocycle", () => {
    renderIn(
      <MacrocycleSection
        athleteId="a1"
        macrocycle={{
          startDate: "2026-11-30",
          durationWeeks: 21,
          competitionDate: "2027-04-24",
          competitionType: "German Championships",
        }}
      />,
    );
    expect(
      screen.getByText("Nov 30, 2026 – Apr 25, 2027 (21 weeks)"),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Main competition: German Championships on Apr 24, 2027",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Change planning" })).toBeTruthy();
  });

  it("is translated to German", () => {
    renderIn(<MacrocycleSection athleteId="a1" macrocycle={null} />, "de");
    expect(
      screen.getByRole("link", { name: "Makrozyklus planen" }),
    ).toBeTruthy();
  });
});
