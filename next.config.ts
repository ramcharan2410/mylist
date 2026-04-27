import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Ensure Prisma engine binaries are bundled into Vercel serverless functions
  outputFileTracingIncludes: {
    "/api/**": ["./src/generated/prisma/**"],
    "/dashboard": ["./src/generated/prisma/**"],
    "/lists/**": ["./src/generated/prisma/**"],
  },
};

export default nextConfig;
