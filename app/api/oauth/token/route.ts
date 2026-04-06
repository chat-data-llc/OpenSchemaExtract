import { NextResponse } from "next/server";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { getClient } from "@/lib/oauth/clients";
import { consumeAuthorizationCode } from "@/lib/oauth/codes";
import { verifyPkceS256 } from "@/lib/oauth/pkce";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/lib/oauth/tokens";
import {
  oauthRefreshTokensCollection,
  type OAuthRefreshTokenDoc,
} from "@/lib/db";

const ACCESS_TOKEN_TTL_SECONDS = 3600; // 1 hour
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function errorResponse(
  status: number,
  error: string,
  description: string
): NextResponse {
  return NextResponse.json(
    { error, error_description: description },
    { status, headers: { "cache-control": "no-store" } }
  );
}

function hashToken(t: string): string {
  return createHash("sha256").update(t, "utf8").digest("hex");
}

function parseBasicAuth(
  header: string | null
): { clientId: string; clientSecret: string } | null {
  if (!header) return null;
  const m = header.match(/^Basic\s+(.+)$/i);
  if (!m) return null;
  try {
    const decoded = Buffer.from(m[1], "base64").toString("utf8");
    const idx = decoded.indexOf(":");
    if (idx === -1) return null;
    return {
      clientId: decodeURIComponent(decoded.slice(0, idx)),
      clientSecret: decodeURIComponent(decoded.slice(idx + 1)),
    };
  } catch {
    return null;
  }
}

function secretsMatch(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("application/x-www-form-urlencoded")) {
    return errorResponse(
      400,
      "invalid_request",
      "Content-Type must be application/x-www-form-urlencoded"
    );
  }
  const form = await req.formData();
  const grantType = form.get("grant_type")?.toString();

  // Determine client authentication.
  const basic = parseBasicAuth(req.headers.get("authorization"));
  const bodyClientId = form.get("client_id")?.toString();
  const bodyClientSecret = form.get("client_secret")?.toString();
  const clientId = basic?.clientId || bodyClientId;
  if (!clientId) {
    return errorResponse(400, "invalid_client", "Missing client_id");
  }
  const client = await getClient(clientId);
  if (!client) {
    return errorResponse(401, "invalid_client", "Unknown client");
  }
  // Validate client authentication per the client's configured auth method.
  if (client.tokenEndpointAuthMethod === "none") {
    // Public client — no secret expected.
  } else {
    const provided = basic?.clientSecret || bodyClientSecret || "";
    if (!client.clientSecret || !secretsMatch(provided, client.clientSecret)) {
      return errorResponse(
        401,
        "invalid_client",
        "Client authentication failed"
      );
    }
  }

  if (grantType === "authorization_code") {
    const code = form.get("code")?.toString();
    const redirectUri = form.get("redirect_uri")?.toString();
    const codeVerifier = form.get("code_verifier")?.toString();
    if (!code || !redirectUri || !codeVerifier) {
      return errorResponse(
        400,
        "invalid_request",
        "code, redirect_uri and code_verifier are required"
      );
    }
    const stored = await consumeAuthorizationCode(code);
    if (!stored) {
      return errorResponse(
        400,
        "invalid_grant",
        "Authorization code is invalid, expired, or already used"
      );
    }
    if (stored.clientId !== clientId) {
      return errorResponse(
        400,
        "invalid_grant",
        "Code was issued to a different client"
      );
    }
    if (stored.redirectUri !== redirectUri) {
      return errorResponse(
        400,
        "invalid_grant",
        "redirect_uri does not match the authorization request"
      );
    }
    if (!verifyPkceS256(codeVerifier, stored.codeChallenge)) {
      return errorResponse(400, "invalid_grant", "PKCE verification failed");
    }
    const audience = stored.resource || process.env.OAUTH_ISSUER || "";
    const { token: accessToken } = signAccessToken(
      {
        sub: stored.userId,
        aud: audience,
        client_id: clientId,
        scope: stored.scope,
        jti: randomBytes(12).toString("hex"),
      },
      ACCESS_TOKEN_TTL_SECONDS
    );
    const refreshJti = randomBytes(16).toString("hex");
    const { token: refreshToken } = signRefreshToken(
      {
        sub: stored.userId,
        client_id: clientId,
        scope: stored.scope,
        resource: stored.resource,
        jti: refreshJti,
      },
      REFRESH_TOKEN_TTL_SECONDS
    );
    const refreshCol = await oauthRefreshTokensCollection();
    const doc: OAuthRefreshTokenDoc = {
      tokenHash: hashToken(refreshToken),
      clientId,
      userId: stored.userId,
      scope: stored.scope,
      resource: stored.resource,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      rotatedFrom: null,
      revokedAt: null,
    };
    await refreshCol.insertOne(doc);
    return NextResponse.json(
      {
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: ACCESS_TOKEN_TTL_SECONDS,
        scope: stored.scope,
        refresh_token: refreshToken,
      },
      { headers: { "cache-control": "no-store" } }
    );
  }

  if (grantType === "refresh_token") {
    const refreshToken = form.get("refresh_token")?.toString();
    if (!refreshToken) {
      return errorResponse(400, "invalid_request", "Missing refresh_token");
    }
    const verified = verifyRefreshToken(refreshToken);
    if (!verified.ok) {
      return errorResponse(
        400,
        "invalid_grant",
        `Refresh token invalid: ${verified.reason}`
      );
    }
    if (verified.payload.client_id !== clientId) {
      return errorResponse(400, "invalid_grant", "Client mismatch");
    }
    const refreshCol = await oauthRefreshTokensCollection();
    const tokenHash = hashToken(refreshToken);
    const existing = await refreshCol.findOneAndUpdate(
      { tokenHash, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    if (!existing) {
      return errorResponse(
        400,
        "invalid_grant",
        "Refresh token has been revoked or already rotated"
      );
    }
    const audience =
      verified.payload.resource || process.env.OAUTH_ISSUER || "";
    const { token: accessToken } = signAccessToken(
      {
        sub: verified.payload.sub,
        aud: audience,
        client_id: clientId,
        scope: verified.payload.scope,
        jti: randomBytes(12).toString("hex"),
      },
      ACCESS_TOKEN_TTL_SECONDS
    );
    const newRefreshJti = randomBytes(16).toString("hex");
    const { token: newRefreshToken } = signRefreshToken(
      {
        sub: verified.payload.sub,
        client_id: clientId,
        scope: verified.payload.scope,
        resource: verified.payload.resource,
        jti: newRefreshJti,
      },
      REFRESH_TOKEN_TTL_SECONDS
    );
    await refreshCol.insertOne({
      tokenHash: hashToken(newRefreshToken),
      clientId,
      userId: verified.payload.sub,
      scope: verified.payload.scope,
      resource: verified.payload.resource,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      rotatedFrom: verified.payload.jti,
      revokedAt: null,
    });
    return NextResponse.json(
      {
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: ACCESS_TOKEN_TTL_SECONDS,
        scope: verified.payload.scope,
        refresh_token: newRefreshToken,
      },
      { headers: { "cache-control": "no-store" } }
    );
  }

  return errorResponse(
    400,
    "unsupported_grant_type",
    `Grant type not supported: ${grantType ?? ""}`
  );
}
