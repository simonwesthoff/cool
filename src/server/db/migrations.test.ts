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

describe("migration weekly_schedule", () => {
  it("turns the training frequency into a schedule over Monday–Saturday", async () => {
    const db = new PGlite();
    try {
      const tags = journal.entries.map((e) => e.tag);
      const target = tags.findIndex((t) => t.endsWith("weekly_schedule"));
      expect(target).toBeGreaterThan(0);
      for (const tag of tags.slice(0, target)) await apply(db, tag);
      await db.exec(`
        insert into user_account (id, name, email) values ('c', 'Coach', 'c@x.invalid');
        insert into team (id, coach_id) values ('00000000-0000-4000-8000-000000000001', 'c');
      `);
      for (const [i, frequency] of [1, 6, 8, 14].entries()) {
        const athleteId = `00000000-0000-4000-8000-00000000010${i}`;
        await db.exec(`
          insert into athlete (id, team_id, name) values
            ('${athleteId}', '00000000-0000-4000-8000-000000000001', 'A${i}');
          insert into macrocycle (id, athlete_id, start_date, duration_weeks,
            entry_value_pct, snatch_best_kg, clean_and_jerk_best_kg,
            snatch_goal_kg, clean_and_jerk_goal_kg, body_weight_kg,
            target_body_weight_kg, snatch_deficits, clean_deficits,
            jerk_deficits, other_deficits, injuries_and_illnesses, strengths,
            experience, training_frequency, focus_points, competition_date,
            competition_type)
          values ('00000000-0000-4000-8000-00000000020${i}', '${athleteId}',
            '2026-11-30', 21, 60, 90, 115, 100, 130, 81, 80, '', '', '', '',
            '', '', '', ${frequency}, '{}', '2027-04-24', 'Championships');
        `);
      }
      await apply(db, tags[target]!);
      await apply(db, tags[target + 1]!);
      const { rows } = await db.query<{
        id: string;
        weekday: number;
        slot: number;
      }>(
        `select macrocycle_id as id, weekday, slot from macrocycle_session
         order by macrocycle_id, slot, weekday`,
      );
      const scheduleOf = (i: number) =>
        rows
          .filter((r) => r.id === `00000000-0000-4000-8000-00000000020${i}`)
          .map((r) => `${r.weekday}.${r.slot}`);
      expect(scheduleOf(0)).toEqual(["1.1"]);
      expect(scheduleOf(1)).toEqual(["1.1", "2.1", "3.1", "4.1", "5.1", "6.1"]);
      expect(scheduleOf(2)).toEqual([
        "1.1",
        "2.1",
        "3.1",
        "4.1",
        "5.1",
        "6.1",
        "1.2",
        "2.2",
      ]);
      expect(scheduleOf(3)).toHaveLength(14);
      expect(scheduleOf(3).slice(-2)).toEqual(["1.3", "2.3"]);
      // No Sunday sessions, and the column is gone.
      expect(rows.some((r) => r.weekday === 7)).toBe(false);
      const columns = await db.query<{ column_name: string }>(
        `select column_name from information_schema.columns
         where table_name = 'macrocycle' and column_name = 'training_frequency'`,
      );
      expect(columns.rows).toHaveLength(0);
    } finally {
      await db.close();
    }
  });
});

describe("migration macrocycle_curve_anchors", () => {
  it("gives existing macrocycles two anchors approximating the former S-curve", async () => {
    const db = new PGlite();
    try {
      const tags = journal.entries.map((e) => e.tag);
      const target = tags.findIndex((t) =>
        t.endsWith("macrocycle_curve_anchors"),
      );
      expect(target).toBeGreaterThan(0);
      for (const tag of tags.slice(0, target)) await apply(db, tag);
      await db.exec(`
        insert into user_account (id, name, email) values ('c', 'Coach', 'c@x.invalid');
        insert into team (id, coach_id) values ('00000000-0000-4000-8000-000000000001', 'c');
        insert into athlete (id, team_id, name) values
          ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-000000000001', 'Anna');
        insert into macrocycle (
          athlete_id, start_date, duration_weeks, entry_value_pct,
          snatch_best_kg, clean_and_jerk_best_kg, snatch_goal_kg, clean_and_jerk_goal_kg,
          body_weight_kg, target_body_weight_kg,
          snatch_deficits, clean_deficits, jerk_deficits, other_deficits,
          injuries_and_illnesses, strengths, experience, focus_points,
          competition_date, competition_type
        ) values (
          '00000000-0000-4000-8000-0000000000a1', '2026-11-30', 21, 60,
          90, 115, 100, 130, 81, 80.5, '', '', '', '', '', '', '', '{}',
          '2027-04-24', 'German Championships'
        );
      `);
      await apply(db, tags[target]!);
      const { rows } = await db.query<{
        anchors: { t: number; pct: number }[];
      }>(`select curve_anchors as anchors from macrocycle`);
      const [{ t: t1, pct: p1 }, { t: t2, pct: p2 }] = rows[0]!.anchors as [
        { t: number; pct: number },
        { t: number; pct: number },
      ];
      expect(t1).toBeCloseTo(1 / 3, 12);
      expect(t2).toBeCloseTo(2 / 3, 12);
      expect([Number(p1), Number(p2)]).toEqual([70, 90]);
      // A macrocycle created afterwards starts with the straight line.
      await db.exec(`
        insert into athlete (id, team_id, name) values
          ('00000000-0000-4000-8000-0000000000a2', '00000000-0000-4000-8000-000000000001', 'Ben');
        insert into macrocycle (
          athlete_id, start_date, duration_weeks, entry_value_pct,
          snatch_best_kg, clean_and_jerk_best_kg, snatch_goal_kg, clean_and_jerk_goal_kg,
          body_weight_kg, target_body_weight_kg,
          snatch_deficits, clean_deficits, jerk_deficits, other_deficits,
          injuries_and_illnesses, strengths, experience, focus_points,
          competition_date, competition_type
        ) values (
          '00000000-0000-4000-8000-0000000000a2', '2026-11-30', 21, 60,
          90, 115, 100, 130, 81, 80.5, '', '', '', '', '', '', '', '{}',
          '2027-04-24', 'German Championships'
        );
      `);
      const after = await db.query<{ anchors: unknown }>(
        `select curve_anchors as anchors from macrocycle where athlete_id = '00000000-0000-4000-8000-0000000000a2'`,
      );
      expect(after.rows[0]!.anchors).toEqual([]);
    } finally {
      await db.close();
    }
  });
});
