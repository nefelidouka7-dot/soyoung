/**
 * Allow relative same-origin paths or https URLs on an allowlisted host set.
 * Rejects javascript:, data:, protocol-relative, and backslash tricks.
 */
export function sanitizePublicHref(
  value: string | null | undefined
): string | null {
  if (value == null) return null;
  const raw = value.trim();
  if (!raw) return null;

  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\")) {
    if (/^\/[\w\-./?=&%~+]*$/.test(raw)) return raw;
    return null;
  }

  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    const allowed = allowedHttpsHosts();
    if (!allowed.has(url.hostname.toLowerCase())) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function allowedHttpsHosts(): Set<string> {
  const hosts = new Set<string>([
    "www.instagram.com",
    "instagram.com",
    "www.tiktok.com",
    "tiktok.com",
  ]);
  const app = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (app) {
    try {
      hosts.add(new URL(app).hostname.toLowerCase());
    } catch {
      /* ignore */
    }
  }
  const r2 = process.env.R2_PUBLIC_URL?.trim();
  if (r2) {
    try {
      hosts.add(new URL(r2).hostname.toLowerCase());
    } catch {
      /* ignore */
    }
  }
  return hosts;
}
