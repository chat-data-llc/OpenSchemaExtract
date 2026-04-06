import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getClient } from "@/lib/oauth/clients";
import {
  DEFAULT_SCOPE,
  parseScopeString,
  filterSupported,
  scopeSubsetOf,
} from "@/lib/oauth/scopes";
import { oauthConsentsCollection } from "@/lib/db";
import { createAuthorizationCode } from "@/lib/oauth/codes";
import { signConsentRequest } from "@/lib/oauth/tokens";

function redirectWithError(
  redirectUri: string,
  state: string | null,
  error: string,
  description: string
) {
  const url = new URL(redirectUri);
  url.searchParams.set("error", error);
  url.searchParams.set("error_description", description);
  if (state) url.searchParams.set("state", state);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const responseType = sp.get("response_type");
  const clientId = sp.get("client_id");
  const redirectUri = sp.get("redirect_uri");
  const state = sp.get("state");
  const codeChallenge = sp.get("code_challenge");
  const codeChallengeMethod = sp.get("code_challenge_method");
  const scopeParam = sp.get("scope");
  const resource = sp.get("resource");

  // Pre-redirect validation: fail loudly without redirect if client/redirect invalid.
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "client_id and redirect_uri are required",
      },
      { status: 400 }
    );
  }
  const client = await getClient(clientId);
  if (!client) {
    return NextResponse.json(
      { error: "invalid_client", error_description: "Unknown client_id" },
      { status: 400 }
    );
  }
  if (!client.redirectUris.includes(redirectUri)) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "redirect_uri does not match any registered URI",
      },
      { status: 400 }
    );
  }

  // From here on, errors can be redirected back to the client.
  if (responseType !== "code") {
    return redirectWithError(
      redirectUri,
      state,
      "unsupported_response_type",
      "Only response_type=code is supported"
    );
  }
  if (!codeChallenge || codeChallengeMethod !== "S256") {
    return redirectWithError(
      redirectUri,
      state,
      "invalid_request",
      "PKCE S256 code_challenge is required"
    );
  }

  const requestedScopes = filterSupported(
    parseScopeString(scopeParam || DEFAULT_SCOPE)
  );
  if (requestedScopes.length === 0) {
    return redirectWithError(
      redirectUri,
      state,
      "invalid_scope",
      "No supported scopes requested"
    );
  }

  // Require a logged-in user; if missing, redirect to /login with a return URL
  // that brings the user back through this authorize endpoint.
  const session = await auth();
  if (!session?.user?.id) {
    const backUrl = new URL(req.nextUrl.pathname + "?" + sp.toString(), req.nextUrl.origin);
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", backUrl.toString());
    return NextResponse.redirect(loginUrl);
  }

  // Check prior consent.
  const consents = await oauthConsentsCollection();
  const priorConsent = await consents.findOne({
    userId: session.user.id,
    clientId,
    revokedAt: null,
  });
  const grantedScopes = priorConsent
    ? parseScopeString(priorConsent.scope)
    : [];

  if (priorConsent && scopeSubsetOf(requestedScopes, grantedScopes)) {
    // Skip consent — issue code directly.
    const code = await createAuthorizationCode({
      clientId,
      userId: session.user.id,
      redirectUri,
      scope: requestedScopes.join(" "),
      codeChallenge,
      codeChallengeMethod: "S256",
      resource: resource || null,
      ttlSeconds: 60,
    });
    const redirect = new URL(redirectUri);
    redirect.searchParams.set("code", code);
    if (state) redirect.searchParams.set("state", state);
    return NextResponse.redirect(redirect);
  }

  // Otherwise, redirect to consent page with a signed request payload.
  const requestToken = signConsentRequest(
    {
      client_id: clientId,
      user_id: session.user.id,
      redirect_uri: redirectUri,
      scope: requestedScopes.join(" "),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      resource: resource || null,
    },
    300
  );
  const consentUrl = new URL("/oauth/consent", req.nextUrl.origin);
  consentUrl.searchParams.set("req", requestToken);
  return NextResponse.redirect(consentUrl);
}

export async function POST(req: NextRequest) {
  // Consent form POSTs here with the signed request token and an approval flag.
  const form = await req.formData();
  const token = form.get("req")?.toString();
  const approve = form.get("approve")?.toString() === "1";
  if (!token) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Missing req" },
      { status: 400 }
    );
  }
  const { verifyConsentRequest } = await import("@/lib/oauth/tokens");
  const verified = verifyConsentRequest<{
    client_id: string;
    user_id: string;
    redirect_uri: string;
    scope: string;
    state: string | null;
    code_challenge: string;
    code_challenge_method: "S256";
    resource: string | null;
  }>(token);
  if (!verified.ok) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: `Consent token invalid: ${verified.reason}`,
      },
      { status: 400 }
    );
  }

  // Re-check session matches the user the request was issued for.
  const session = await auth();
  if (!session?.user?.id || session.user.id !== verified.payload.user_id) {
    return NextResponse.json(
      { error: "access_denied", error_description: "Session mismatch" },
      { status: 401 }
    );
  }

  const {
    client_id,
    user_id,
    redirect_uri,
    scope,
    state,
    code_challenge,
    resource,
  } = verified.payload;

  if (!approve) {
    return redirectWithError(
      redirect_uri,
      state,
      "access_denied",
      "User denied the request"
    );
  }

  // Persist consent.
  const consents = await oauthConsentsCollection();
  await consents.updateOne(
    { userId: user_id, clientId: client_id },
    {
      $set: {
        userId: user_id,
        clientId: client_id,
        scope,
        grantedAt: new Date(),
        revokedAt: null,
      },
    },
    { upsert: true }
  );

  // Issue authorization code.
  const code = await createAuthorizationCode({
    clientId: client_id,
    userId: user_id,
    redirectUri: redirect_uri,
    scope,
    codeChallenge: code_challenge,
    codeChallengeMethod: "S256",
    resource,
    ttlSeconds: 60,
  });

  const redirect = new URL(redirect_uri);
  redirect.searchParams.set("code", code);
  if (state) redirect.searchParams.set("state", state);
  return NextResponse.redirect(redirect, 303);
}
