// @ts-nocheck — Prisma 7 config API is not fully typed yet
import path from "path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join(__dirname, "schema.prisma"),
  migrate: {
    async adapter() {
      const url = process.env.DATABASE_URL ?? "file:./dev.db";
      if (url.startsWith("postgresql") || url.startsWith("postgres")) {
        const { PrismaPg } = await import("@prisma/adapter-pg");
        return new PrismaPg({ connectionString: url });
      }
      return undefined as never;
    },
  },
});
