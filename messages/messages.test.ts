import { describe, expect, it } from "vitest";
import de from "./de.json";
import en from "./en.json";

type Catalog = { [key: string]: string | Catalog };

/** Lists every message key as a dotted path. */
export function messageKeys(catalog: Catalog, prefix = ""): string[] {
  return Object.entries(catalog).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [path] : messageKeys(value, path);
  });
}

export function missingKeys(from: Catalog, to: Catalog): string[] {
  const target = new Set(messageKeys(to));
  return messageKeys(from).filter((key) => !target.has(key));
}

describe("message catalogs", () => {
  it("has every English message in German", () => {
    expect(missingKeys(en, de), "missing in messages/de.json").toEqual([]);
  });

  it("has every German message in English", () => {
    expect(missingKeys(de, en), "missing in messages/en.json").toEqual([]);
  });

  it("has no empty messages", () => {
    for (const [name, catalog] of Object.entries({ en, de })) {
      const empty = messageKeys(catalog).filter((key) => {
        const value = key
          .split(".")
          .reduce<unknown>(
            (node, part) => (node as Record<string, unknown>)[part],
            catalog,
          );
        return typeof value === "string" && value.trim() === "";
      });
      expect(empty, `empty in messages/${name}.json`).toEqual([]);
    }
  });

  it("detects a missing key", () => {
    expect(missingKeys({ A: { b: "x", c: "y" } }, { A: { b: "x" } })).toEqual([
      "A.c",
    ]);
  });
});
