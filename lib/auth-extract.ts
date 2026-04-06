import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { apiKeysCollection } from "@/lib/db";
import { hashApiKey, isLikelyApiKey } from "@/lib/api-keys";
import { verifyAccessToken } from "@/lib/oauth/tokens";
import { SCOPE_EXTRACT_READ } from "@/lib/oauth/scopes";

export type AuthContext =
  | { kind: "anonymous" }
  | { kind: "session"; userId: string }
  | { kind: "api_key"; userId: string; keyId: string }
  | {
      kind: "oauth";
      userId: string;
      clientId: string;
      scope: string;
      jti: string;
    }
  | { kind: "invalid"; reason: string };

export async function authenticateRequest(
  req: NextRequest
): Promise<AuthContext> {
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return { kind: "invalid", reason: "malformed_authorization_header" };
    }
    const token = match[1].trim();

    if (isLikelyApiKey(token)) {
      const hash = hashApiKey(token);
      const col = await apiKeysCollection();
      const doc = await col.findOneAndUpdate(
        { keyHash: hash, revokedAt: null },
        { $set: { lastUsedAt: new Date() } }
      );
      if (!doc) {
        return { kind: "invalid", reason: "revoked_or_unknown_api_key" };
      }
      return {
        kind: "api_key",
        userId: doc.userId,
        keyId: String(doc._id),
      };
    }

    // Otherwise treat as an OAuth JWT access token.
    const expectedAudience = process.env.OAUTH_ISSUER || "";
    const verified = verifyAccessToken(token, expectedAudience);
    if (!verified.ok) {
      return { kind: "invalid", reason: verified.reason };
    }
    const scopes = (verified.payload.scope || "").split(/\s+/).filter(Boolean);
    if (!scopes.includes(SCOPE_EXTRACT_READ)) {
      return { kind: "invalid", reason: "insufficient_scope" };
    }
    return {
      kind: "oauth",
      userId: verified.payload.sub,
      clientId: verified.payload.client_id,
      scope: verified.payload.scope,
      jti: verified.payload.jti,
    };
  }

  // No Authorization header — try NextAuth session cookie.
  const session = await auth();
  if (session?.user?.id) {
    return { kind: "session", userId: session.user.id };
  }
  return { kind: "anonymous" };
}

export function buildWwwAuthenticateHeader(reason?: string): string {
  const issuer = process.env.OAUTH_ISSUER || "";
  const resourceMetadataUrl = issuer
    ? `${issuer}/.well-known/oauth-protected-resource`
    : "/.well-known/oauth-protected-resource";
  const parts = [
    `Bearer`,
    `resource_metadata="${resourceMetadataUrl}"`,
    `error="invalid_token"`,
  ];
  if (reason) {
    parts.push(`error_description="${reason.replace(/"/g, "")}"`);
  }
  return parts.join(", ");
}
