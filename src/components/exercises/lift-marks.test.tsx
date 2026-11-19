// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import de from "../../../messages/de.json";
import en from "../../../messages/en.json";
import type { LiftCategory } from "@/domain/exercises/catalog-types";
import { LiftMarks } from "./lift-marks";

afterEach(cleanup);
const renderMarks = (categories: LiftCategory[], locale: "en" | "de" = "en") =>
  render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "de" ? de : en}
    >
      <LiftMarks categories={categories} />
    </NextIntlClientProvider>,
  );

describe("LiftMarks", () => {
  it("shows one coloured dot per category, named on hover and once for screen readers", () => {
    const { container } = renderMarks(["clean", "jerk"]);
    const dots = [
      ...container.querySelectorAll("[data-lift]"),
    ] as HTMLElement[];
    expect(dots.map((d) => d.dataset.lift)).toEqual(["clean", "jerk"]);
    expect(dots.map((d) => d.style.background)).toEqual([
      "var(--lift-clean)",
      "var(--lift-jerk)",
    ]);
    expect(dots.map((d) => d.title)).toEqual(["Clean", "Jerk"]);
    // Screen readers hear one prefix; the dots themselves are hidden.
    expect(container.textContent).toBe("Clean, Jerk: ");
    expect(dots.every((d) => d.getAttribute("aria-hidden") === "true")).toBe(
      true,
    );
  });

  it("has no mark without a category", () => {
    const { container } = renderMarks([]);
    expect(container.querySelector("[data-lift-marks]")).toBeNull();
  });

  it("uses the German names", () => {
    const { container } = renderMarks(["snatch", "clean", "jerk"], "de");
    expect(
      [...container.querySelectorAll("[data-lift]")].map(
        (d) => (d as HTMLElement).title,
      ),
    ).toEqual(["Reißen", "Umsetzen", "Ausstoßen"]);
  });
});
