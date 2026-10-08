import type { NextConfig } from "next";
import { resolveDatabaseUrl } from "./db/env";

// Map Neon’s db_* integration vars → DATABASE_URL for Prisma during build.
resolveDatabaseUrl();

function r2RemotePatterns(): NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> {
  const raw = process.env.R2_PUBLIC_URL?.trim();
  if (!raw) return [];
  try {
    const url = new URL(raw);
    const protocol = url.protocol === "http:" ? "http" : "https";
    return [
      {
        protocol,
        hostname: url.hostname,
        pathname: "/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: r2RemotePatterns(),
    dangerouslyAllowSVG: true,
    // inline so optimized JPGs render reliably in <img>; CSP still sandboxes SVGs
    contentDispositionType: "inline",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    serverActions: {
      // Product reels up to 25MB (+ form overhead)
      bodySizeLimit: "32mb",
    },
  },
};

export default nextConfig;
