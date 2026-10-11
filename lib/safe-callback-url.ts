/**
 * Allow only same-origin relative paths for post-login redirects.
 * Blocks protocol-relative, backslash, and other open-redirect tricks.
 */
export function safeCallbackUrl(
  value: string | null | undefined,
  fallback = "/account"
): string {
  const raw = (value ?? "").trim();
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.includes("\\")) return fallback;
  if (raw.includes("@") || raw.includes("://")) return fallback;
  // Disallow control chars / whitespace in the path
  if (/[\s\0-\x1f]/.test(raw)) return fallback;
  if (!/^\/[\w\-./?=&%~+]*$/.test(raw)) return fallback;
  return raw;
}
