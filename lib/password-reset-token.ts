import { createHash, randomBytes } from "crypto";

export function hashPasswordResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createPasswordResetToken(): {
  raw: string;
  hash: string;
} {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashPasswordResetToken(raw) };
}
