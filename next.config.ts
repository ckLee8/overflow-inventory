import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep Prisma out of the Next SSR bundle so generated client enums/fields
  // (e.g. PoLineFulfillmentStatus) validate correctly at runtime.
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
