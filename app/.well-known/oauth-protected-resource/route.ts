import { NextResponse } from "next/server";
import { SUPPORTED_SCOPES } from "@/lib/oauth/scopes";

export const dynamic = "force-static";

export function GET() {
  const issuer = process.env.OAUTH_ISSUER || "";
  return NextResponse.json({
    resource: issuer,
    authorization_servers: [issuer],
    scopes_supported: SUPPORTED_SCOPES,
    bearer_methods_supported: ["header"],
    resource_name: "OpenSchemaExtract API",
    resource_documentation: issuer,
  });
}
