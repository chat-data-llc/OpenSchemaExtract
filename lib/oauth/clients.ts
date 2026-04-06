import { randomBytes } from "crypto";
import { oauthClientsCollection, type OAuthClientDoc } from "@/lib/db";
import { DEFAULT_SCOPE } from "./scopes";

export interface RegisterClientInput {
  redirect_uris: string[];
  client_name?: string;
  token_endpoint_auth_method?: string;
  grant_types?: string[];
  response_types?: string[];
  scope?: string;
}

export interface RegisterClientResult {
  client_id: string;
  client_secret: string | null;
  client_id_issued_at: number;
  client_secret_expires_at: number;
  redirect_uris: string[];
  token_endpoint_auth_method: string;
  grant_types: string[];
  response_types: string[];
  client_name: string;
  scope: string;
}

const ALLOWED_AUTH_METHODS = new Set([
  "none",
  "client_secret_basic",
  "client_secret_post",
]);

export function validateRedirectUris(uris: unknown): string[] | null {
  if (!Array.isArray(uris) || uris.length === 0) return null;
  const normalized: string[] = [];
  for (const uri of uris) {
    if (typeof uri !== "string") return null;
    try {
      const u = new URL(uri);
      if (u.hash) return null; // fragments forbidden per RFC 6749
      // Allow http only for localhost / 127.0.0.1 dev loopback clients.
      if (
        u.protocol === "http:" &&
        u.hostname !== "localhost" &&
        u.hostname !== "127.0.0.1" &&
        u.hostname !== "::1"
      ) {
        return null;
      }
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        // Allow custom schemes for native/desktop clients (e.g. myapp://cb).
        // Basic shape check: scheme followed by "://" then at least one char.
        if (!/^[a-z][a-z0-9+.\-]*:\/\/.+/i.test(uri)) return null;
      }
      normalized.push(uri);
    } catch {
      return null;
    }
  }
  return normalized;
}

function generateClientId(): string {
  return `osx_client_${randomBytes(12).toString("hex")}`;
}

function generateClientSecret(): string {
  return randomBytes(32).toString("hex");
}

export async function registerClient(
  input: RegisterClientInput
): Promise<
  | { ok: true; client: RegisterClientResult }
  | { ok: false; error: string; error_description: string }
> {
  const redirectUris = validateRedirectUris(input.redirect_uris);
  if (!redirectUris) {
    return {
      ok: false,
      error: "invalid_redirect_uri",
      error_description:
        "redirect_uris must be a non-empty array of valid absolute URIs",
    };
  }
  const authMethod = (
    input.token_endpoint_auth_method || "client_secret_basic"
  ).toString();
  if (!ALLOWED_AUTH_METHODS.has(authMethod)) {
    return {
      ok: false,
      error: "invalid_client_metadata",
      error_description: "Unsupported token_endpoint_auth_method",
    };
  }
  const grantTypes =
    Array.isArray(input.grant_types) && input.grant_types.length > 0
      ? input.grant_types.map(String)
      : ["authorization_code", "refresh_token"];
  for (const g of grantTypes) {
    if (g !== "authorization_code" && g !== "refresh_token") {
      return {
        ok: false,
        error: "invalid_client_metadata",
        error_description: `Unsupported grant_type: ${g}`,
      };
    }
  }
  const responseTypes =
    Array.isArray(input.response_types) && input.response_types.length > 0
      ? input.response_types.map(String)
      : ["code"];
  for (const r of responseTypes) {
    if (r !== "code") {
      return {
        ok: false,
        error: "invalid_client_metadata",
        error_description: `Unsupported response_type: ${r}`,
      };
    }
  }

  const clientId = generateClientId();
  const clientSecret =
    authMethod === "none" ? null : generateClientSecret();
  const doc: OAuthClientDoc = {
    clientId,
    clientSecret,
    redirectUris,
    tokenEndpointAuthMethod: authMethod as OAuthClientDoc["tokenEndpointAuthMethod"],
    grantTypes,
    responseTypes,
    clientName: (input.client_name || "Unnamed client").toString().slice(0, 120),
    scope: (input.scope || DEFAULT_SCOPE).toString(),
    createdAt: new Date(),
  };
  const col = await oauthClientsCollection();
  await col.insertOne(doc);

  return {
    ok: true,
    client: {
      client_id: clientId,
      client_secret: clientSecret,
      client_id_issued_at: Math.floor(doc.createdAt.getTime() / 1000),
      client_secret_expires_at: 0,
      redirect_uris: redirectUris,
      token_endpoint_auth_method: authMethod,
      grant_types: grantTypes,
      response_types: responseTypes,
      client_name: doc.clientName,
      scope: doc.scope,
    },
  };
}

export async function getClient(
  clientId: string
): Promise<OAuthClientDoc | null> {
  const col = await oauthClientsCollection();
  return col.findOne({ clientId });
}
