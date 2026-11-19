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
const dotsOf = (container: HTMLElement) =>
  [...container.querySelectorAll("[data-lift]")] as HTMLElement[];

describe("LiftMarks", () => {
  it("shows one dot in the category's colour", () => {
    const { container } = renderMarks(["snatch"]);
    const [dot] = dotsOf(container);
    expect(dotsOf(container)).toHaveLength(1);
    expect(dot!.style.background).toBe("var(--lift-snatch)");
    expect(dot!.title).toBe("Snatch");
  });

  it("blends two categories in one dot from left to right, purple left and magenta right", () => {
    const { container } = renderMarks(["clean", "jerk"]);
    const dots = dotsOf(container);
    expect(dots).toHaveLength(1);
    expect(dots[0]!.getAttribute("style")).toContain(
      "linear-gradient(to right, var(--lift-clean), var(--lift-jerk))",
    );
    expect(dots[0]!.title).toBe("Clean, Jerk");
    // Screen readers hear one prefix; the dot itself is hidden.
    expect(container.textContent).toBe("Clean, Jerk: ");
    expect(dots[0]!.getAttribute("aria-hidden")).toBe("true");
  });

  it("has no mark without a category", () => {
    const { container } = renderMarks([]);
    expect(container.querySelector("[data-lift-marks]")).toBeNull();
  });

  it("uses the German names", () => {
    const { container } = renderMarks(["clean", "jerk"], "de");
    expect(dotsOf(container)[0]!.title).toBe("Umsetzen, Ausstoßen");
  });
});
