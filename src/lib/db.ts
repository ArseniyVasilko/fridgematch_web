import "server-only";
import { createPrismaClient } from "./create-prisma";

/** One Prisma client per server process (reused across hot reloads in dev). */
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
