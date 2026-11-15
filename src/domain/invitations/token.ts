import { createHash, randomBytes } from "node:crypto";

/** Unguessable invitation token: 32 random bytes, base64url (43 characters). */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Only this hash is stored, so stored data cannot be turned into a link. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Whether a string has the shape of a token (cheap check before lookups). */
export function isTokenShape(value: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(value);
}

/** Path of the page that opens an invitation. */
export function invitationPath(token: string): string {
  return `/invite/${token}`;
}
