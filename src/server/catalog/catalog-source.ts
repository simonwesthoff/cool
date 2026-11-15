/**
 * Reads the exercise catalog source files (German CSV and English
 * translations) and turns them into SQL for a data migration.
 * Used by `npm run catalog:migration`; not used at runtime.
 */

export type ReferenceLift = "snatch" | "clean_and_jerk";

export type CatalogGroup = {
  number: number;
  code: string;
  nameDe: string;
  nameEn: string;
};

export type CatalogExercise = {
  number: number;
  groupNumber: number;
  nameDe: string;
  nameEn: string;
  referenceLift: ReferenceLift | null;
  bestValuePct: number | null;
  maxWeeklyAverageWeightPct: number | null;
  minRepsPerSet: number | null;
  maxRepsPerSet: number | null;
  minRepsPerWeek: number | null;
  maxRepsPerWeek: number | null;
  commentDe: string | null;
  commentEn: string | null;
};

export type Translations = {
  groups: Record<string, string>;
  exercises: Record<string, string>;
  comments: Record<string, string>;
};

export type Catalog = { groups: CatalogGroup[]; exercises: CatalogExercise[] };

/** Parses CSV text (comma separated, double-quoted fields, "" escapes). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const content = text.replace(/^﻿/, "");
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (quoted) {
      if (char === '"' && content[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && content[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error("CSV: unterminated quoted field");
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

const COLUMNS = [
  "Komplex",
  "Nr.",
  "Bezeichnung",
  "Bestwert",
  "Max. Wochen Mittleres Hantelgewicht",
  "Minimale Wdh",
  "Maximale Wdh",
  "Referenzübung",
  "min Wochen Wdh",
  "max Wochen Wdh",
  "Kommentar",
];

function numberOrNull(value: string, where: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(parsed))
    throw new Error(`${where}: "${value}" is not a number`);
  return parsed;
}

function referenceLift(value: string, where: string): ReferenceLift | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (trimmed === "Reißen") return "snatch";
  if (trimmed === "Stoßen") return "clean_and_jerk";
  throw new Error(`${where}: unknown reference lift "${value}"`);
}

/** Builds and validates the catalog from the source files. */
export function buildCatalog(csv: string, translations: Translations): Catalog {
  const [header, ...rows] = parseCsv(csv);
  if (!header) throw new Error("CSV is empty");
  COLUMNS.forEach((name, index) => {
    if (!header[index]?.startsWith(name)) {
      throw new Error(
        `CSV column ${index + 1} should start with "${name}", found "${header[index]}"`,
      );
    }
  });

  const groups = new Map<number, CatalogGroup>();
  const exercises: CatalogExercise[] = [];
  for (const [rowIndex, cells] of rows.entries()) {
    const where = `CSV row ${rowIndex + 2}`;
    if (cells.length !== COLUMNS.length) {
      throw new Error(
        `${where}: expected ${COLUMNS.length} fields, found ${cells.length}`,
      );
    }
    const [
      komplex,
      nr,
      name,
      best,
      mhg,
      minSet,
      maxSet,
      lift,
      minWeek,
      maxWeek,
      comment,
    ] = cells.map((c) => c.trim()) as [string, ...string[]];
    const match = /^K(\d+)\s+(.+)$/.exec(komplex);
    if (!match)
      throw new Error(`${where}: group "${komplex}" must look like "K1 Name"`);
    const groupNumber = Number(match[1]);
    const groupNameDe = match[2]!.trim();
    const existing = groups.get(groupNumber);
    if (existing && existing.nameDe !== groupNameDe) {
      throw new Error(`${where}: group K${groupNumber} has two names`);
    }
    if (!existing) {
      const nameEn = translations.groups[String(groupNumber)];
      if (!nameEn) throw new Error(`No English name for group K${groupNumber}`);
      groups.set(groupNumber, {
        number: groupNumber,
        code: `K${groupNumber}`,
        nameDe: groupNameDe,
        nameEn,
      });
    }

    const number = numberOrNull(nr!, `${where} Nr.`);
    if (number === null || !Number.isInteger(number) || number < 1) {
      throw new Error(`${where}: invalid catalog number "${nr}"`);
    }
    const nameEn = translations.exercises[String(number)];
    if (!nameEn) throw new Error(`No English name for exercise ${number}`);
    const commentEn = translations.comments[String(number)] ?? null;
    if (comment && !commentEn)
      throw new Error(`No English comment for exercise ${number}`);

    const values = {
      bestValuePct: numberOrNull(best!, `${where} Bestwert`),
      maxWeeklyAverageWeightPct: numberOrNull(mhg!, `${where} MHG`),
      minRepsPerSet: numberOrNull(minSet!, `${where} Minimale Wdh`),
      maxRepsPerSet: numberOrNull(maxSet!, `${where} Maximale Wdh`),
      minRepsPerWeek: numberOrNull(minWeek!, `${where} min Wochen Wdh`),
      maxRepsPerWeek: numberOrNull(maxWeek!, `${where} max Wochen Wdh`),
    };
    for (const [min, max, label] of [
      [values.minRepsPerSet, values.maxRepsPerSet, "reps per set"],
      [values.minRepsPerWeek, values.maxRepsPerWeek, "reps per week"],
    ] as const) {
      if (min !== null && max !== null && min > max) {
        throw new Error(`Exercise ${number}: min ${label} is greater than max`);
      }
    }
    for (const pct of [values.bestValuePct, values.maxWeeklyAverageWeightPct]) {
      if (pct !== null && (pct <= 0 || pct > 300)) {
        throw new Error(`Exercise ${number}: percentage ${pct} out of range`);
      }
    }
    exercises.push({
      number,
      groupNumber,
      nameDe: name!,
      nameEn,
      referenceLift: referenceLift(lift!, `${where} Referenzübung`),
      ...values,
      commentDe: comment || null,
      commentEn: comment ? commentEn : null,
    });
  }

  const numbers = exercises.map((e) => e.number);
  if (new Set(numbers).size !== numbers.length)
    throw new Error("Duplicate catalog numbers");
  for (const key of Object.keys(translations.exercises)) {
    if (!numbers.includes(Number(key)))
      throw new Error(`Translation for unknown exercise ${key}`);
  }
  return {
    groups: [...groups.values()].sort((a, b) => a.number - b.number),
    exercises: exercises.sort((a, b) => a.number - b.number),
  };
}

function sql(value: string | number | null): string {
  if (value === null) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${value.replaceAll("'", "''")}'`;
}

/** SQL that inserts or updates every group and exercise (stable numbers). */
export function catalogMigrationSql(catalog: Catalog): string {
  const groups = catalog.groups
    .map(
      (g) => `(${[g.number, g.code, g.nameDe, g.nameEn].map(sql).join(", ")})`,
    )
    .join(",\n  ");
  const exercises = catalog.exercises
    .map(
      (e) =>
        `(${[
          e.number,
          e.groupNumber,
          e.nameDe,
          e.nameEn,
          e.referenceLift,
          e.bestValuePct,
          e.maxWeeklyAverageWeightPct,
          e.minRepsPerSet,
          e.maxRepsPerSet,
          e.minRepsPerWeek,
          e.maxRepsPerWeek,
          e.commentDe,
          e.commentEn,
        ]
          .map(sql)
          .join(", ")})`,
    )
    .join(",\n  ");
  return `-- Generated by \`npm run catalog:migration\` from data/exercise-catalog.
-- Do not edit by hand; change the source files and generate a new migration.
INSERT INTO "exercise_group" ("number", "code", "name_de", "name_en") VALUES
  ${groups}
ON CONFLICT ("number") DO UPDATE SET
  "code" = EXCLUDED."code", "name_de" = EXCLUDED."name_de", "name_en" = EXCLUDED."name_en";
--> statement-breakpoint
INSERT INTO "exercise" ("number", "group_number", "name_de", "name_en", "reference_lift", "best_value_pct", "max_weekly_average_weight_pct", "min_reps_per_set", "max_reps_per_set", "min_reps_per_week", "max_reps_per_week", "comment_de", "comment_en") VALUES
  ${exercises}
ON CONFLICT ("number") DO UPDATE SET
  "group_number" = EXCLUDED."group_number", "name_de" = EXCLUDED."name_de", "name_en" = EXCLUDED."name_en",
  "reference_lift" = EXCLUDED."reference_lift", "best_value_pct" = EXCLUDED."best_value_pct",
  "max_weekly_average_weight_pct" = EXCLUDED."max_weekly_average_weight_pct",
  "min_reps_per_set" = EXCLUDED."min_reps_per_set", "max_reps_per_set" = EXCLUDED."max_reps_per_set",
  "min_reps_per_week" = EXCLUDED."min_reps_per_week", "max_reps_per_week" = EXCLUDED."max_reps_per_week",
  "comment_de" = EXCLUDED."comment_de", "comment_en" = EXCLUDED."comment_en";
`;
}
