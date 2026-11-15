import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildCatalog,
  catalogMigrationSql,
  parseCsv,
  type Translations,
} from "./catalog-source";

const header =
  "Komplex,Nr.,Bezeichnung,Bestwert (% vom Reiß-/Stoß Max.),Max. Wochen Mittleres Hantelgewicht (MHG),Minimale Wdh,Maximale Wdh,Referenzübung,min Wochen Wdh,max Wochen Wdh,Kommentar";
const translations: Translations = {
  groups: { "1": "Competition exercises", "8": "General strength training 1" },
  exercises: { "1": "Snatch", "31": "Bench press" },
  comments: { "1": "Competition exercise" },
};
const csv = [
  header,
  'K1 Wettkampfübungen (WKÜ),1,Reißen,100,86,1,5,Reißen,10,30,"Wettkampfübung, mit Komma"',
  "K8 Allgemeines Muskelkrafttraining 1 (AMKT),31,Bankdrücken,,,,,,,,",
].join("\n");

describe("parseCsv", () => {
  it("handles quoted fields with commas, escaped quotes and CRLF", () => {
    expect(parseCsv('a,"b, c","d ""e"""\r\n1,2,3\r\n')).toEqual([
      ["a", "b, c", 'd "e"'],
      ["1", "2", "3"],
    ]);
  });

  it("rejects an unterminated quote", () => {
    expect(() => parseCsv('a,"b')).toThrow("unterminated");
  });
});

describe("buildCatalog", () => {
  it("builds groups and exercises with both languages", () => {
    const catalog = buildCatalog(csv, translations);
    expect(catalog.groups).toEqual([
      {
        number: 1,
        code: "K1",
        nameDe: "Wettkampfübungen (WKÜ)",
        nameEn: "Competition exercises",
      },
      {
        number: 8,
        code: "K8",
        nameDe: "Allgemeines Muskelkrafttraining 1 (AMKT)",
        nameEn: "General strength training 1",
      },
    ]);
    expect(catalog.exercises[0]).toEqual({
      number: 1,
      groupNumber: 1,
      nameDe: "Reißen",
      nameEn: "Snatch",
      referenceLift: "snatch",
      bestValuePct: 100,
      maxWeeklyAverageWeightPct: 86,
      minRepsPerSet: 1,
      maxRepsPerSet: 5,
      minRepsPerWeek: 10,
      maxRepsPerWeek: 30,
      commentDe: "Wettkampfübung, mit Komma",
      commentEn: "Competition exercise",
    });
    expect(catalog.exercises[1]).toMatchObject({
      number: 31,
      referenceLift: null,
      bestValuePct: null,
      minRepsPerSet: null,
      commentDe: null,
      commentEn: null,
    });
  });

  it.each([
    [
      "a missing English name",
      { ...translations, exercises: { "1": "Snatch" } },
      csv,
      "No English name for exercise 31",
    ],
    [
      "a missing English comment",
      { ...translations, comments: {} },
      csv,
      "No English comment for exercise 1",
    ],
    [
      "a duplicate number",
      translations,
      `${csv}\n${csv.split("\n")[2]}`,
      "Duplicate catalog numbers",
    ],
    [
      "a wrong column",
      translations,
      csv.replace("Referenzübung", "Lift"),
      'column 8 should start with "Referenzübung"',
    ],
    [
      "an unknown reference lift",
      translations,
      csv.replace("1,5,Reißen", "1,5,Drücken"),
      'unknown reference lift "Drücken"',
    ],
    [
      "min greater than max",
      translations,
      csv.replace("1,5,Reißen", "6,5,Reißen"),
      "min reps per set is greater than max",
    ],
    [
      "a non-numeric value",
      translations,
      csv.replace(",100,86,", ",hundert,86,"),
      "is not a number",
    ],
  ])("rejects %s", (_label, t, source, message) => {
    expect(() => buildCatalog(source, t)).toThrow(message);
  });

  it("escapes quotes in the generated SQL", () => {
    const catalog = buildCatalog(
      csv.replace("Reißen,100", "Reißen's,100"),
      translations,
    );
    expect(catalogMigrationSql(catalog)).toContain("'Reißen''s'");
  });

  it("accepts the real catalog: 9 groups, 45 exercises", () => {
    const catalog = buildCatalog(
      readFileSync("data/exercise-catalog/Trainingsmittelkatalog.csv", "utf8"),
      JSON.parse(
        readFileSync("data/exercise-catalog/translations.en.json", "utf8"),
      ),
    );
    expect(catalog.groups.map((g) => g.code)).toEqual([
      "K1",
      "K2",
      "K3",
      "K4",
      "K5",
      "K6",
      "K7",
      "K8",
      "K9",
    ]);
    expect(catalog.exercises.map((e) => e.number)).toEqual(
      Array.from({ length: 45 }, (_, i) => i + 1),
    );
  });
});
