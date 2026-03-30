import { NextRequest, NextResponse } from "next/server";
import { API_ERROR_MESSAGES } from "@/src/constants";
import { extract } from "@/src/extractor";
import type { ExtractionResponse } from "@/src/types";
import { isValidAbsoluteUrl, normalizeUrlInput } from "@/src/url";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json<ExtractionResponse>(
      {
        success: false,
        error: API_ERROR_MESSAGES.MISSING_URL,
        errorCode: "INVALID_REQUEST",
      },
      { status: 400 }
    );
  }

  const url = normalizeUrlInput(rawUrl);
  if (!isValidAbsoluteUrl(url)) {
    return NextResponse.json<ExtractionResponse>(
      {
        success: false,
        error: API_ERROR_MESSAGES.INVALID_URL,
        errorCode: "INVALID_REQUEST",
      },
      { status: 400 }
    );
  }

  const result = await extract(url);

  if (!result.ok) {
    const { code, message } = result.error;

    let status = 502;
    if (code === "NOT_FOUND" || code === "EMPTY_CONTENT") status = 422;

    return NextResponse.json<ExtractionResponse>(
      { success: false, error: message, errorCode: code },
      { status }
    );
  }

  return NextResponse.json<ExtractionResponse>({ success: true, data: result.data });
}
