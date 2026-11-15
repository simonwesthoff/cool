/**
 * In-memory PostgreSQL (PGlite) with all migrations applied, for tests of
 * code that uses `@/server/db`. Usage in a test file:
 *
 *   const testDb = await createTestDb();
 *   vi.mock("@/server/db", () => ({ getDb: () => testDb.db }));
 */
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import path from "node:path";
import type { Database } from "@/server/db";
import * as schema from "@/server/db/schema";

export async function createTestDb() {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, {
    migrationsFolder: path.resolve("src/server/db/migrations"),
  });
  return {
    // Same query API as the production database.
    db: db as unknown as Database,
    close: () => client.close(),
  };
}

let counter = 0;

/** Inserts a user account and returns it. */
export async function createUser(db: Database, name = "Test User") {
  counter += 1;
  const [user] = await db
    .insert(schema.userAccount)
    .values({
      id: `user-${counter}-${Math.random().toString(36).slice(2)}`,
      name,
      email: `user${counter}-${Math.random().toString(36).slice(2)}@example.com`,
      emailVerified: true,
    })
    .returning();
  if (!user) throw new Error("user not created");
  return { id: user.id, name: user.name, email: user.email, image: user.image };
}
