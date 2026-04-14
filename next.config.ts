import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n.ts");

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "pg",
    "pg-native",
    "@prisma/engines",
    "prisma",
  ],
  outputFileTracingExcludes: {
    "*": [
      "./node_modules/@prisma/engines/**",
      "./node_modules/prisma/libquery_engine-*",
      "./node_modules/@prisma/client/libquery_engine-*",
      "./node_modules/.prisma/client/libquery_engine-*",
      "./node_modules/@prisma/engines/query-engine-*",
      "./node_modules/@prisma/engines/introspection-engine-*",
      "./node_modules/@prisma/engines/migration-engine-*",
      "./node_modules/@prisma/engines/schema-engine-*",
      "./node_modules/@prisma/engines/prisma-fmt-*",
      "./node_modules/prisma/engines/**",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**" },
    ],
    // Allow local /uploads/* paths served from public/
    localPatterns: [{ pathname: "/uploads/**" }],
    unoptimized: process.env.NODE_ENV === "development",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "52mb",
    },
  },
};

export default withNextIntl(nextConfig);
