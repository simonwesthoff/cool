import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

// Applies the migrations one by one so data can be inserted between them.
const dir = path.resolve("src/server/db/migrations");
const journal = JSON.parse(
  readFileSync(path.join(dir, "meta/_journal.json"), "utf8"),
) as { entries: { tag: string }[] };

async function apply(client: PGlite, tag: string) {
  const sql = readFileSync(path.join(dir, `${tag}.sql`), "utf8");
  for (const statement of sql.split("--> statement-breakpoint")) {
    if (statement.trim()) await client.exec(statement);
  }
}

const client = new PGlite();
afterAll(() => client.close());

describe("migration remove_empty_teams", () => {
  it("removes Teams without athletes and keeps Teams with athletes", async () => {
    const tags = journal.entries.map((e) => e.tag);
    const target = tags.findIndex((t) => t.endsWith("remove_empty_teams"));
    expect(target).toBeGreaterThan(0);
    for (const tag of tags.slice(0, target)) await apply(client, tag);

    await client.exec(`
      insert into user_account (id, name, email) values
        ('empty', 'Empty Coach', 'e@x.invalid'),
        ('full', 'Full Coach', 'f@x.invalid');
      insert into team (id, coach_id) values
        ('00000000-0000-4000-8000-000000000001', 'empty'),
        ('00000000-0000-4000-8000-000000000002', 'full');
      insert into athlete (team_id, name) values
        ('00000000-0000-4000-8000-000000000002', 'Anna');
    `);
    await apply(client, tags[target]!);

    const { rows } = await client.query<{ coach_id: string }>(
      "select coach_id from team order by coach_id",
    );
    expect(rows.map((r) => r.coach_id)).toEqual(["full"]);
  });
});
