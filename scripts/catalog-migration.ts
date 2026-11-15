/**
 * Generates a data migration for the exercise catalog from
 * data/exercise-catalog (CSV + English translations).
 * Usage: npm run catalog:migration
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  buildCatalog,
  catalogMigrationSql,
  type Translations,
} from "../src/server/catalog/catalog-source";

const dir = path.resolve("data/exercise-catalog");
const catalog = buildCatalog(
  readFileSync(path.join(dir, "Trainingsmittelkatalog.csv"), "utf8"),
  JSON.parse(
    readFileSync(path.join(dir, "translations.en.json"), "utf8"),
  ) as Translations,
);

const migrations = path.resolve("src/server/db/migrations");
execFileSync(
  "node",
  [
    "node_modules/drizzle-kit/bin.cjs",
    "generate",
    "--custom",
    "--name",
    "exercise_catalog_data",
  ],
  { stdio: "inherit" },
);
const journal = JSON.parse(
  readFileSync(path.join(migrations, "meta/_journal.json"), "utf8"),
) as {
  entries: { tag: string }[];
};
const tag = journal.entries.at(-1)!.tag;
writeFileSync(
  path.join(migrations, `${tag}.sql`),
  catalogMigrationSql(catalog),
);
console.log(
  `Wrote ${tag}.sql: ${catalog.groups.length} groups, ${catalog.exercises.length} exercises.`,
);
