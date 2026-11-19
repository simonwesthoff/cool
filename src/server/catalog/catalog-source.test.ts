import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildCatalog,
  catalogMigrationSql,
  parseCsv,
  type Translations,
} from "./catalog-source";

const header =
  "Komplex,Nr.,Bezeichnung,Bestwert (% vom Reiß-/Stoß Max.),Max. Wochen Mittleres Hantelgewicht (MHG),Minimale Wdh,Maximale Wdh,Referenzübung,min Wochen Wdh,max Wochen Wdh,Kommentar,Addresses,Kategorie";
const translations: Translations = {
  groups: { "1": "Competition exercises", "8": "General strength training 1" },
  exercises: { "1": "Snatch", "31": "Bench press" },
  comments: { "1": "Competition exercise" },
  tags: { "Hoher Zug": "High pull", WKÜ: "Competition exercise" },
};
const csv = [
  header,
  'K1 Wettkampfübungen (WKÜ),1,Reißen,100,86,1,5,Reißen,10,30,"Wettkampfübung, mit Komma","WKÜ, Hoher Zug",Reißen',
  "K8 Allgemeines Muskelkrafttraining 1 (AMKT),31,Bankdrücken,,,,,,,,,-,",
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
      addresses: ["WKÜ", "Hoher Zug"],
      liftCategories: ["snatch"],
    });
    expect(catalog.exercises[1]).toMatchObject({
      number: 31,
      referenceLift: null,
      bestValuePct: null,
      minRepsPerSet: null,
      commentDe: null,
      commentEn: null,
      addresses: [],
      liftCategories: [],
    });
    expect(catalog.tags).toEqual([
      { nameDe: "WKÜ", nameEn: "Competition exercise" },
      { nameDe: "Hoher Zug", nameEn: "High pull" },
    ]);
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
      "a missing English tag",
      { ...translations, tags: { WKÜ: "Competition exercise" } },
      csv,
      'No English name for tag "Hoher Zug"',
    ],
    [
      "a translation of an unknown tag",
      { ...translations, tags: { ...translations.tags, Abbremsen: "x" } },
      csv,
      'Translation for unknown tag "Abbremsen"',
    ],
    [
      "a duplicate tag of one exercise",
      translations,
      csv.replace('"WKÜ, Hoher Zug"', '"WKÜ, WKÜ"'),
      "duplicate entry",
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

  const withCategoryCell = (cell: string) =>
    csv.replace('"WKÜ, Hoher Zug",Reißen', `"WKÜ, Hoher Zug",${cell}`);

  it("reads lift categories in the order snatch, clean, jerk", () => {
    const catalog = buildCatalog(
      withCategoryCell('"Ausstoßen, Umsetzen"'),
      translations,
    );
    expect(catalog.exercises[0]!.liftCategories).toEqual(["clean", "jerk"]);
  });

  it("rejects an unknown or duplicate lift category", () => {
    expect(() =>
      buildCatalog(withCategoryCell("Drücken"), translations),
    ).toThrow('unknown lift category "Drücken"');
    expect(() =>
      buildCatalog(withCategoryCell('"Reißen, Reißen"'), translations),
    ).toThrow("duplicate entry");
  });

  it("writes the lift categories as text arrays", () => {
    const sql = catalogMigrationSql(buildCatalog(csv, translations));
    expect(sql).toContain('"comment_en", "lift_categories") VALUES');
    expect(sql).toContain("ARRAY['snatch']::text[])");
    expect(sql).toContain("ARRAY[]::text[])");
    expect(sql).toContain('"lift_categories" = EXCLUDED."lift_categories"');
  });

  it("replaces the addressed points in the generated SQL", () => {
    const sql = catalogMigrationSql(buildCatalog(csv, translations));
    expect(sql).toContain('DELETE FROM "exercise_addresses";');
    expect(sql).toContain("('Hoher Zug', 'High pull')");
    expect(sql).toContain("(1, 'WKÜ', 0),\n  (1, 'Hoher Zug', 1);");
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
    expect(catalog.tags).toHaveLength(26);
    expect(catalog.exercises[6]!.addresses).toEqual([
      "Beschleunigung im 2. Zug",
      "Hoher Zug",
    ]);
    // Lift categories as decided by the user.
    const withCategory = (category: string) =>
      catalog.exercises
        .filter((e) => (e.liftCategories as string[]).includes(category))
        .map((e) => e.number);
    expect(withCategory("snatch")).toEqual([1, 2, 6, 7, 8, 13, 15, 18, 22, 23]);
    expect(withCategory("clean")).toEqual([
      3, 4, 9, 10, 11, 14, 16, 19, 20, 21, 24, 27, 28,
    ]);
    expect(withCategory("jerk")).toEqual([3, 5, 12, 17, 25, 26, 28, 29]);
    expect(
      catalog.exercises
        .filter((e) => e.liftCategories.length === 0)
        .map((e) => e.number),
    ).toEqual(Array.from({ length: 16 }, (_, i) => i + 30));
  });
});
