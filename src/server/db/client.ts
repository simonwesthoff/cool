import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

let instance: { sql: postgres.Sql; db: Database } | undefined;

function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return url;
}

function connect() {
  if (!instance) {
    const sql = postgres(databaseUrl(), { max: 10 });
    instance = { sql, db: drizzle(sql, { schema }) };
  }
  return instance;
}

/** The shared Drizzle database. Connects lazily on first use. */
export function getDb(): Database {
  return connect().db;
}

/** The underlying postgres.js client, for low-level queries. */
export function getSql(): postgres.Sql {
  return connect().sql;
}
