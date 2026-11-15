// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import de from "../../../messages/de.json";
import en from "../../../messages/en.json";
import { AppNavigation, navigationTabs } from "./app-navigation";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
afterEach(cleanup);

const keys = (roles: { coach: boolean; athlete: boolean }) =>
  navigationTabs(roles, "/").map((tab) => tab.key);

describe("navigationTabs", () => {
  it("depends on the roles", () => {
    expect(keys({ coach: true, athlete: false })).toEqual([
      "athletes",
      "exercises",
    ]);
    expect(keys({ coach: false, athlete: true })).toEqual([
      "training",
      "exercises",
    ]);
    expect(keys({ coach: true, athlete: true })).toEqual([
      "athletes",
      "training",
      "exercises",
    ]);
    expect(keys({ coach: false, athlete: false })).toEqual(["exercises"]);
  });

  it.each([
    ["/", "athletes"],
    ["/athletes/a1/basic-data", "athletes"],
    ["/training", "training"],
    ["/exercises/13", "exercises"],
  ])("marks the tab of %s", (path, key) => {
    const active = navigationTabs({ coach: true, athlete: true }, path).filter(
      (t) => t.active,
    );
    expect(active.map((t) => t.key)).toEqual([key]);
  });
});

describe("AppNavigation", () => {
  function renderNav(
    placement: "header" | "bottom",
    locale: "en" | "de" = "en",
  ) {
    render(
      <NextIntlClientProvider
        locale={locale}
        messages={locale === "de" ? de : en}
      >
        <AppNavigation
          roles={{ coach: true, athlete: true }}
          placement={placement}
        />
      </NextIntlClientProvider>,
    );
    return screen.getByRole("navigation", {
      name: locale === "de" ? "Hauptnavigation" : "Main navigation",
    });
  }

  it("renders the tabs with links and marks the current one", () => {
    pathname = "/exercises";
    const nav = renderNav("header");
    const links = within(nav).getAllByRole("link");
    expect(links.map((l) => [l.textContent, l.getAttribute("href")])).toEqual([
      ["Athletes", "/"],
      ["My training", "/training"],
      ["Exercises", "/exercises"],
    ]);
    expect(
      within(nav)
        .getByRole("link", { name: "Exercises" })
        .getAttribute("aria-current"),
    ).toBe("page");
  });

  it("is a fixed bottom bar on phones only", () => {
    const nav = renderNav("bottom", "de");
    expect(nav.className).toContain("fixed");
    expect(nav.className).toContain("bottom-0");
    expect(nav.className).toContain("sm:hidden");
    expect(
      within(nav)
        .getAllByRole("link")
        .map((l) => l.textContent),
    ).toEqual(["Athleten", "Mein Training", "Übungen"]);
  });
});
