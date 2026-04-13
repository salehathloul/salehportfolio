import { PrismaClient } from "@prisma/client";
import path from "path";

// DATABASE_URL determines the adapter:
//   "postgresql://..." → @prisma/adapter-pg  (production)
//   "file:./dev.db"   → @prisma/adapter-libsql (local SQLite dev)

function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";

  if (url.startsWith("postgresql") || url.startsWith("postgres")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaPg } = require("@prisma/adapter-pg");
    const adapter = new PrismaPg({ connectionString: url });
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  // SQLite via libsql — resolve file path relative to project root
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaLibSql } = require("@prisma/adapter-libsql");
  const filePath = url.startsWith("file:")
    ? path.resolve(process.cwd(), url.replace(/^file:\.?\//, ""))
    : path.resolve(process.cwd(), url);
  const adapter = new PrismaLibSql({ url: "file:" + filePath });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
