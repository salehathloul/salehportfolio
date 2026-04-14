import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n.ts");

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    "*": [
      "./node_modules/@prisma/engines/**",
      "./node_modules/prisma/libquery_engine-*",
      "./node_modules/@prisma/client/libquery_engine-*",
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
