import { createHash, randomBytes } from "crypto";

export const API_KEY_PREFIX = "osx_live_";

export interface GeneratedApiKey {
  plaintext: string;
  prefix: string;
  keyHash: string;
  keyPreview: string;
}

function base64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generateApiKey(): GeneratedApiKey {
  // 24 bytes -> 32 chars base64url = 192 bits entropy
  const random = base64url(randomBytes(24));
  const plaintext = `${API_KEY_PREFIX}${random}`;
  const keyHash = hashApiKey(plaintext);
  const keyPreview = `${API_KEY_PREFIX}${random.slice(0, 8)}…${random.slice(-4)}`;
  return { plaintext, prefix: API_KEY_PREFIX, keyHash, keyPreview };
}

export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext, "utf8").digest("hex");
}

export function isLikelyApiKey(token: string): boolean {
  return token.startsWith(API_KEY_PREFIX);
}
