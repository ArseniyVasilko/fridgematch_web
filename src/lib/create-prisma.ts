import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * PostgreSQL through the node-postgres driver adapter: Neon in production
 * (and a Neon "dev" branch locally), see README. On Vercel, DATABASE_URL is
 * Neon's pooled connection string.
 */
export function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set. Copy .env.example to .env (see README).");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}
