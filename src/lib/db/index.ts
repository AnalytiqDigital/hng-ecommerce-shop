import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  postgresClient?: ReturnType<typeof postgres>;
};

export function getDb() {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for database-backed operations.");
  }
  const client = globalForDb.postgresClient ??= postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    max_lifetime: 60 * 5,
    connect_timeout: 10,
    prepare: false,
    ssl: "require",
  });
  return drizzle(client, { schema });
}