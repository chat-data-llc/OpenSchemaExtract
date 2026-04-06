import type { ExtractionErrorCode } from "./types";

export const DEFAULT_URL_PROTOCOL = "https://";
export const JINA_PROXY_PREFIX = "https://r.jina.ai/";

export const REQUEST_TIMEOUT_MS = 15_000;
export const MIN_HTML_LENGTH = 500;
export const BOT_WALL_MAX_HTML_LENGTH = 3_000;
export const BOT_WALL_VERY_SHORT_HTML_LENGTH = 1_200;

export const CHROME_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export const API_ERROR_MESSAGES = {
  MISSING_URL: "Missing url parameter",
  INVALID_URL: "Invalid URL",
  EMPTY_CONTENT: "No structured data found on this page",
} as const;

export const CLIENT_ERROR_MESSAGES: Record<ExtractionErrorCode, string> = {
  NOT_FOUND: "Page not found — double-check the URL and try again.",
  ACCESS_BLOCKED:
    "This page blocks automated access. Try a different URL or a more specific page link.",
  NETWORK_ERROR: "Could not reach the page — check your connection or try again.",
  SERVER_ERROR: "The page returned a server error. Try again later.",
  EMPTY_CONTENT: "No structured data (JSON-LD, Microdata, or RDFa) was found on this page.",
};

export const GENERIC_CLIENT_ERROR = "Something went wrong. Please try again.";
export const GENERIC_NETWORK_ERROR =
  "Network error — please check your connection and try again.";
