// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import de from "../../../messages/de.json";
import en from "../../../messages/en.json";
import { AthleteDetailsHeader } from "./athlete-details-header";

afterEach(cleanup);
const athlete = {
  id: "a1",
  name: "Anna Weber",
  dateOfBirth: null,
  gender: null,
  careerStartDate: null,
  heightCm: null,
  linkedAccount: null,
};

describe("AthleteDetailsHeader", () => {
  it("shows picture placeholder and name, leading to the basic data", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <AthleteDetailsHeader athlete={athlete} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByRole("heading", { name: "Anna Weber" })).toBeTruthy();
    expect(
      screen.getByRole("img", { name: "Profile picture of Anna Weber" })
        .textContent,
    ).toBe("AW");
    const header = screen.getByRole("link", { name: /Anna Weber/ });
    expect(header).toHaveProperty("pathname", "/athletes/a1/basic-data");
    expect(
      screen.getByRole("link", { name: /Back to athletes/ }),
    ).toHaveProperty("pathname", "/");
  });

  it("is translated to German", () => {
    render(
      <NextIntlClientProvider locale="de" messages={de}>
        <AthleteDetailsHeader athlete={athlete} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText("Stammdaten")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Zurück zu den Athleten/ }),
    ).toBeTruthy();
  });
});
