import type { Collection, Db, ObjectId } from "mongodb";
import clientPromise from "./mongodb";

const DB_NAME = process.env.MONGODB_DB || "openschemaextract";

export interface ApiKeyDoc {
  _id?: ObjectId;
  userId: string;
  name: string;
  prefix: string;
  keyHash: string;
  keyPreview: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}

export interface OAuthClientDoc {
  _id?: ObjectId;
  clientId: string;
  clientSecret: string | null;
  redirectUris: string[];
  tokenEndpointAuthMethod: "none" | "client_secret_basic" | "client_secret_post";
  grantTypes: string[];
  responseTypes: string[];
  clientName: string;
  scope: string;
  createdAt: Date;
}

export interface OAuthAuthorizationCodeDoc {
  _id?: ObjectId;
  code: string;
  clientId: string;
  userId: string;
  redirectUri: string;
  scope: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
  resource: string | null;
  expiresAt: Date;
  consumedAt: Date | null;
}

export interface OAuthConsentDoc {
  _id?: ObjectId;
  userId: string;
  clientId: string;
  scope: string;
  grantedAt: Date;
  revokedAt: Date | null;
}

export interface OAuthRefreshTokenDoc {
  _id?: ObjectId;
  tokenHash: string;
  clientId: string;
  userId: string;
  scope: string;
  resource: string | null;
  expiresAt: Date;
  rotatedFrom: string | null;
  revokedAt: Date | null;
}

let indexesEnsured = false;

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  if (!indexesEnsured) {
    indexesEnsured = true;
    // Fire-and-forget index creation; don't block first request too long.
    void ensureIndexes(db).catch((err) => {
      // Reset flag so we can retry on next call.
      indexesEnsured = false;
      console.error("Failed to ensure MongoDB indexes", err);
    });
  }
  return db;
}

export async function ensureIndexes(db: Db): Promise<void> {
  await Promise.all([
    db
      .collection<ApiKeyDoc>("api_keys")
      .createIndex({ keyHash: 1 }, { unique: true }),
    db
      .collection<ApiKeyDoc>("api_keys")
      .createIndex({ userId: 1, createdAt: -1 }),
    db
      .collection<OAuthClientDoc>("oauth_clients")
      .createIndex({ clientId: 1 }, { unique: true }),
    db
      .collection<OAuthAuthorizationCodeDoc>("oauth_authorization_codes")
      .createIndex({ code: 1 }, { unique: true }),
    db
      .collection<OAuthAuthorizationCodeDoc>("oauth_authorization_codes")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db
      .collection<OAuthConsentDoc>("oauth_consents")
      .createIndex({ userId: 1, clientId: 1 }, { unique: true }),
    db
      .collection<OAuthRefreshTokenDoc>("oauth_refresh_tokens")
      .createIndex({ tokenHash: 1 }, { unique: true }),
    db
      .collection<OAuthRefreshTokenDoc>("oauth_refresh_tokens")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
}

export async function apiKeysCollection(): Promise<Collection<ApiKeyDoc>> {
  return (await getDb()).collection<ApiKeyDoc>("api_keys");
}

export async function oauthClientsCollection(): Promise<
  Collection<OAuthClientDoc>
> {
  return (await getDb()).collection<OAuthClientDoc>("oauth_clients");
}

export async function oauthAuthorizationCodesCollection(): Promise<
  Collection<OAuthAuthorizationCodeDoc>
> {
  return (await getDb()).collection<OAuthAuthorizationCodeDoc>(
    "oauth_authorization_codes"
  );
}

export async function oauthConsentsCollection(): Promise<
  Collection<OAuthConsentDoc>
> {
  return (await getDb()).collection<OAuthConsentDoc>("oauth_consents");
}

export async function oauthRefreshTokensCollection(): Promise<
  Collection<OAuthRefreshTokenDoc>
> {
  return (await getDb()).collection<OAuthRefreshTokenDoc>(
    "oauth_refresh_tokens"
  );
}
