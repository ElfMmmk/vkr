import { createHash, randomBytes } from "node:crypto";

export const CLAIM_TOKEN_TTL_HOURS = 24;

export function createClaimToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashClaimToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createClaimTokenExpiresAt(now = new Date()): string {
  return new Date(now.getTime() + CLAIM_TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString();
}

export function isClaimTokenExpired(expiresAt: string, now = new Date()): boolean {
  const expires = new Date(expiresAt).getTime();

  return !Number.isFinite(expires) || expires <= now.getTime();
}
