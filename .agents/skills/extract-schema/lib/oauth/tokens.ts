import { createHmac, timingSafeEqual } from "crypto";

function base64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(input: string): Buffer {
  const pad = 4 - (input.length % 4 || 4);
  const padded = input + "=".repeat(pad % 4);
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function getSecret(): Buffer {
  const s = process.env.OAUTH_JWT_SECRET;
  if (!s) {
    throw new Error("OAUTH_JWT_SECRET environment variable is required");
  }
  return Buffer.from(s, "utf8");
}

function sign(data: string): string {
  return base64url(createHmac("sha256", getSecret()).update(data).digest());
}

export interface AccessTokenPayload {
  iss: string;
  sub: string;
  aud: string;
  client_id: string;
  scope: string;
  jti: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  iss: string;
  sub: string;
  client_id: string;
  scope: string;
  resource: string | null;
  jti: string;
  iat: number;
  exp: number;
  typ: "refresh";
}

export function signAccessToken(
  payload: Omit<AccessTokenPayload, "iat" | "exp" | "iss">,
  expiresInSeconds: number
): { token: string; payload: AccessTokenPayload } {
  const now = Math.floor(Date.now() / 1000);
  const full: AccessTokenPayload = {
    ...payload,
    iss: process.env.OAUTH_ISSUER || "",
    iat: now,
    exp: now + expiresInSeconds,
  };
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(full));
  const data = `${header}.${body}`;
  const signature = sign(data);
  return { token: `${data}.${signature}`, payload: full };
}

export type VerifyResult<T> =
  | { ok: true; payload: T }
  | { ok: false; reason: string };

export function verifyAccessToken(
  token: string,
  expectedAudience: string
): VerifyResult<AccessTokenPayload> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return { ok: false, reason: "malformed_token" };
  }
  const [headerB64, bodyB64, sigB64] = parts;
  const data = `${headerB64}.${bodyB64}`;
  const expected = sign(data);
  const a = Buffer.from(sigB64, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad_signature" };
  }
  let header: { alg?: string; typ?: string };
  let payload: AccessTokenPayload;
  try {
    header = JSON.parse(base64urlDecode(headerB64).toString("utf8"));
    payload = JSON.parse(base64urlDecode(bodyB64).toString("utf8"));
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
  if (header.alg !== "HS256") {
    return { ok: false, reason: "unsupported_alg" };
  }
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp <= now) {
    return { ok: false, reason: "token_expired" };
  }
  if (payload.iss !== process.env.OAUTH_ISSUER) {
    return { ok: false, reason: "bad_issuer" };
  }
  if (expectedAudience && payload.aud !== expectedAudience) {
    return { ok: false, reason: "bad_audience" };
  }
  return { ok: true, payload };
}

export function signRefreshToken(
  payload: Omit<RefreshTokenPayload, "iat" | "exp" | "iss" | "typ">,
  expiresInSeconds: number
): { token: string; payload: RefreshTokenPayload } {
  const now = Math.floor(Date.now() / 1000);
  const full: RefreshTokenPayload = {
    ...payload,
    typ: "refresh",
    iss: process.env.OAUTH_ISSUER || "",
    iat: now,
    exp: now + expiresInSeconds,
  };
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(full));
  const data = `${header}.${body}`;
  const signature = sign(data);
  return { token: `${data}.${signature}`, payload: full };
}

export function verifyRefreshToken(
  token: string
): VerifyResult<RefreshTokenPayload> {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed_token" };
  const [h, b, s] = parts;
  const data = `${h}.${b}`;
  const expected = sign(data);
  const a = Buffer.from(s, "utf8");
  const e = Buffer.from(expected, "utf8");
  if (a.length !== e.length || !timingSafeEqual(a, e)) {
    return { ok: false, reason: "bad_signature" };
  }
  let payload: RefreshTokenPayload;
  try {
    payload = JSON.parse(base64urlDecode(b).toString("utf8"));
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) return { ok: false, reason: "token_expired" };
  if (payload.typ !== "refresh")
    return { ok: false, reason: "wrong_token_type" };
  if (payload.iss !== process.env.OAUTH_ISSUER)
    return { ok: false, reason: "bad_issuer" };
  return { ok: true, payload };
}

/** Signs a short-lived authorize-request payload used across the consent page. */
export function signConsentRequest(
  payload: Record<string, unknown>,
  ttlSeconds = 300
): string {
  const now = Math.floor(Date.now() / 1000);
  const body = base64url(JSON.stringify({ ...payload, exp: now + ttlSeconds }));
  const sig = sign(body);
  return `${body}.${sig}`;
}

export function verifyConsentRequest<T = Record<string, unknown>>(
  token: string
): VerifyResult<T & { exp: number }> {
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  const [body, sig] = parts;
  const expected = sign(body);
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad_signature" };
  }
  let payload: T & { exp: number };
  try {
    payload = JSON.parse(base64urlDecode(body).toString("utf8"));
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, payload };
}
