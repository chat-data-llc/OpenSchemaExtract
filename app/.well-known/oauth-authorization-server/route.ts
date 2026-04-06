import { NextResponse } from "next/server";
import { SUPPORTED_SCOPES } from "@/lib/oauth/scopes";

export const dynamic = "force-static";

export function GET() {
  const issuer = process.env.OAUTH_ISSUER || "";
  return NextResponse.json({
    issuer,
    authorization_endpoint: `${issuer}/api/oauth/authorize`,
    token_endpoint: `${issuer}/api/oauth/token`,
    registration_endpoint: `${issuer}/api/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: [
      "none",
      "client_secret_basic",
      "client_secret_post",
    ],
    scopes_supported: SUPPORTED_SCOPES,
  });
}
