import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Development uses SQLite through the better-sqlite3 driver adapter.
 * For PostgreSQL in production, change the provider in prisma/schema.prisma
 * to "postgresql" and replace the adapter with
 * `new PrismaPg({ connectionString: process.env.DATABASE_URL })`
 * from @prisma/adapter-pg (see README).
 */
export function createPrismaClient() {
  const url = (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, "");
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
}
