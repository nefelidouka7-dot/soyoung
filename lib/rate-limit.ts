/**
 * Simple in-memory rate limiter for server actions / API routes.
 * Replace with Redis for multi-instance production.
 */

type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();
const MAX_BUCKETS = 10_000;

function pruneExpired(now: number) {
  for (const [key, entry] of buckets) {
    if (entry.resetAt < now) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000
): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.resetAt < now) {
    if (buckets.size >= MAX_BUCKETS) pruneExpired(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (entry.count >= limit) {
    return { ok: false, remaining: 0 };
  }
  entry.count += 1;
  return { ok: true, remaining: limit - entry.count };
}

/**
 * Client IP for rate limiting. Only headers set by our own edge are trusted:
 * - Vercel: the platform overwrites x-vercel-forwarded-for / x-forwarded-for.
 * - Self-hosted: set TRUSTED_IP_HEADER (e.g. "x-real-ip") to the header your
 *   reverse proxy sets. Without it we never read client-controlled headers,
 *   since a spoofed IP would let anyone reset their own limit.
 */
export function clientIpFromHeaders(headers: Headers): string {
  if (process.env.VERCEL) {
    const ip =
      headers.get("x-vercel-forwarded-for") ?? headers.get("x-forwarded-for");
    return ip?.split(",")[0]?.trim() || "unknown";
  }

  const trusted = process.env.TRUSTED_IP_HEADER?.trim().toLowerCase();
  if (trusted) {
    return headers.get(trusted)?.split(",")[0]?.trim() || "unknown";
  }
  return "unknown";
}
