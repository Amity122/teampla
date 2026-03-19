import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

function createPrismaClient(): PrismaClient {
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (authToken) {
    // Production: Turso (libSQL)
    const adapter = new PrismaLibSql({
      url: process.env.DATABASE_URL!,
      authToken,
    });
    return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
  }
  // Local dev: SQLite file
  return new PrismaClient();
}

// Prevent multiple PrismaClient instances in development due to hot-reload.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
