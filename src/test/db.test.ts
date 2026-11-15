import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { userAccount } from "@/server/db/schema";
import { createTestDb, createUser } from "./db";

const testDb = await createTestDb();
afterAll(() => testDb.close());

describe("test database", () => {
  it("has the migrated schema and stores user accounts", async () => {
    const user = await createUser(testDb.db, "Ada");
    const rows = await testDb.db
      .select()
      .from(userAccount)
      .where(eq(userAccount.id, user.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("Ada");
  });
});
