import { randomBytes } from "crypto";
import {
  oauthAuthorizationCodesCollection,
  type OAuthAuthorizationCodeDoc,
} from "@/lib/db";

export function generateAuthorizationCode(): string {
  return randomBytes(32).toString("hex");
}

export async function createAuthorizationCode(
  input: Omit<OAuthAuthorizationCodeDoc, "_id" | "code" | "consumedAt" | "expiresAt"> & {
    ttlSeconds?: number;
  }
): Promise<string> {
  const { ttlSeconds, ...rest } = input;
  const code = generateAuthorizationCode();
  const col = await oauthAuthorizationCodesCollection();
  const expiresAt = new Date(Date.now() + (ttlSeconds ?? 60) * 1000);
  await col.insertOne({
    ...rest,
    code,
    expiresAt,
    consumedAt: null,
  });
  return code;
}

/**
 * Atomically consume an authorization code: matches only unused, unexpired codes
 * and flips consumedAt in a single findOneAndUpdate. Returns the code doc if
 * successful, null otherwise (prevents replay).
 */
export async function consumeAuthorizationCode(
  code: string
): Promise<OAuthAuthorizationCodeDoc | null> {
  const col = await oauthAuthorizationCodesCollection();
  const now = new Date();
  const result = await col.findOneAndUpdate(
    { code, consumedAt: null, expiresAt: { $gt: now } },
    { $set: { consumedAt: now } },
    { returnDocument: "before" }
  );
  return result ?? null;
}
