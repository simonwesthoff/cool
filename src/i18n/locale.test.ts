import { describe, expect, it } from "vitest";
import { resolveLocale } from "./locale";

describe("resolveLocale", () => {
  it("uses the stored choice over the browser preference", () => {
    expect(resolveLocale("de", "en-US,en;q=0.9")).toBe("de");
    expect(resolveLocale("en", "de-DE,de;q=0.9")).toBe("en");
  });

  it("ignores an invalid stored choice", () => {
    expect(resolveLocale("fr", "de-DE")).toBe("de");
  });

  it("chooses German when the browser prefers German", () => {
    expect(resolveLocale(undefined, "de-DE,de;q=0.9,en;q=0.8")).toBe("de");
    expect(resolveLocale(undefined, "de-AT")).toBe("de");
  });

  it("chooses English when the browser prefers English over German", () => {
    expect(resolveLocale(undefined, "en-GB,en;q=0.9,de;q=0.8")).toBe("en");
    expect(resolveLocale(undefined, "de;q=0.5,en;q=0.7")).toBe("en");
  });

  it("skips unsupported languages to find German or English", () => {
    expect(resolveLocale(undefined, "fr-FR,fr;q=0.9,de;q=0.8,en;q=0.7")).toBe(
      "de",
    );
  });

  it("falls back to English for unsupported or missing preferences", () => {
    expect(resolveLocale(undefined, "fr-FR,es;q=0.8")).toBe("en");
    expect(resolveLocale(undefined, undefined)).toBe("en");
    expect(resolveLocale(undefined, "")).toBe("en");
    expect(resolveLocale(undefined, "*")).toBe("en");
  });

  it("ignores languages with q=0", () => {
    expect(resolveLocale(undefined, "de;q=0,en;q=0.5")).toBe("en");
  });
});
