import type { NextConfig } from "next";
import { resolveDatabaseUrl } from "./db/env";

// Map Neon’s db_* integration vars → DATABASE_URL for Prisma during build.
resolveDatabaseUrl();

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [],
    dangerouslyAllowSVG: true,
    // inline so optimized JPGs render reliably in <img>; CSP still sandboxes SVGs
    contentDispositionType: "inline",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
