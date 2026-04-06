import {
  BOT_WALL_MAX_HTML_LENGTH,
  BOT_WALL_VERY_SHORT_HTML_LENGTH,
  CHROME_USER_AGENT,
  JINA_PROXY_PREFIX,
  MIN_HTML_LENGTH,
  REQUEST_TIMEOUT_MS,
} from "./constants";
import type { ExtractionError } from "./types";

/** True if HTML looks like a bot/CAPTCHA shell with no parseable schema in the markup. */
function hasSchemaMarkupHints(html: string): boolean {
  return (
    /application\/ld\+json/i.test(html) ||
    /\bitemscope\b/i.test(html) ||
    /\bitemtype\s*=/i.test(html) ||
    /\btypeof\s*=/i.test(html) ||
    /\bvocab\s*=/i.test(html)
  );
}

/**
 * Many sites (e.g. DataDome) return a tiny challenge page or 403 to non-browser fetches.
 * Proxies may still return 200 with the same HTML — treat as blocked, not "empty schema".
 */
function isLikelyBotWall(html: string): boolean {
  if (hasSchemaMarkupHints(html)) return false;
  if (html.length < BOT_WALL_MAX_HTML_LENGTH) {
    const l = html.toLowerCase();
    if (
      l.includes("please enable js") ||
      l.includes("please enable javascript") ||
      l.includes("datadome") ||
      l.includes("perimeterx") ||
      l.includes("cf-challenge") ||
      l.includes("attention required") ||
      l.includes("enable cookies")
    ) {
      return true;
    }
    // Very small document with no schema hints — usually a block page, not a real article.
    if (html.length < BOT_WALL_VERY_SHORT_HTML_LENGTH) return true;
  }
  return false;
}

type FetchResult =
  | { ok: true; html: string }
  | { ok: false; error: ExtractionError };

async function fetchDirect(url: string): Promise<FetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": CHROME_USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (res.status === 404) {
      return {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "Page not found (404)",
          status: 404,
        },
      };
    }

    // Any 4xx except 404 → treat as access block and try Jina
    if (res.status !== 200 && res.status >= 400 && res.status < 500) {
      return { ok: false, error: { code: "ACCESS_BLOCKED", message: `Access blocked (${res.status})`, status: res.status } };
    }

    if (!res.ok) {
      return {
        ok: false,
        error: {
          code: "SERVER_ERROR",
          message: `Server returned ${res.status}`,
          status: res.status,
        },
      };
    }

    const html = await res.text();
    if (html.length < MIN_HTML_LENGTH) {
      return { ok: false, error: { code: "ACCESS_BLOCKED", message: "Response too short — likely blocked", status: res.status } };
    }

    if (isLikelyBotWall(html)) {
      return {
        ok: false,
        error: {
          code: "ACCESS_BLOCKED",
          message: "Page could not be loaded — bot protection or challenge page (try a direct link to a listing or article)",
          status: res.status,
        },
      };
    }

    return { ok: true, html };
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") {
      return {
        ok: false,
        error: {
          code: "NETWORK_ERROR",
          message: `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`,
          status: 0,
        },
      };
    }
    return {
      ok: false,
      error: {
        code: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Network error",
        status: 0,
      },
    };
  }
}

export async function fetchViaJina(url: string): Promise<FetchResult> {
  const jinaUrl = `${JINA_PROXY_PREFIX}${url}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(jinaUrl, {
      headers: {
        Accept: "text/html,text/plain,*/*",
        "X-Return-Format": "html",
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      return {
        ok: false,
        error: {
          code: "ACCESS_BLOCKED",
          message: "Page is inaccessible even via proxy",
          status: res.status,
        },
      };
    }

    const html = await res.text();
    if (isLikelyBotWall(html)) {
      return {
        ok: false,
        error: {
          code: "ACCESS_BLOCKED",
          message: "Page is inaccessible via automated fetch — bot protection or challenge page",
          status: res.status,
        },
      };
    }

    return { ok: true, html };
  } catch (err) {
    clearTimeout(timer);
    return {
      ok: false,
      error: {
        code: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Jina proxy error",
        status: 0,
      },
    };
  }
}

export async function fetchPage(url: string): Promise<FetchResult> {
  const direct = await fetchDirect(url);
  if (direct.ok) return direct;

  const code = direct.error.code;
  if (code === "ACCESS_BLOCKED" || code === "SERVER_ERROR") {
    return fetchViaJina(url);
  }

  return direct;
}
