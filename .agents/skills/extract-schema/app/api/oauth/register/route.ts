import { NextResponse } from "next/server";
import { registerClient } from "@/lib/oauth/clients";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      {
        error: "invalid_client_metadata",
        error_description: "Body must be valid JSON",
      },
      { status: 400 }
    );
  }
  const result = await registerClient({
    redirect_uris: body.redirect_uris as string[],
    client_name: body.client_name as string | undefined,
    token_endpoint_auth_method: body.token_endpoint_auth_method as
      | string
      | undefined,
    grant_types: body.grant_types as string[] | undefined,
    response_types: body.response_types as string[] | undefined,
    scope: body.scope as string | undefined,
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, error_description: result.error_description },
      { status: 400 }
    );
  }
  return NextResponse.json(result.client, { status: 201 });
}
