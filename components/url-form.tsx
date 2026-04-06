"use client";

import {
  CLIENT_ERROR_MESSAGES,
  GENERIC_CLIENT_ERROR,
  GENERIC_NETWORK_ERROR,
} from "@/src/constants";
import { useState, useRef, useEffect } from "react";
import type {
  ApiErrorCode,
  ExtractionResult,
  ExtractionResponse,
} from "@/src/types";
import { SchemaResults } from "./schema-results";

export function UrlForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const didInit = useRef(false);

  // Populate from ?url= query param on mount — ref guard prevents double-fire in Strict Mode
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const params = new URLSearchParams(window.location.search);
    const initialUrl = params.get("url");
    if (initialUrl) {
      setUrl(initialUrl);
      void handleExtract(initialUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleExtract(targetUrl?: string) {
    const query = targetUrl ?? url;
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    // Update URL bar
    const params = new URLSearchParams({ url: query });
    window.history.replaceState(null, "", `?${params.toString()}`);

    try {
      const res = await fetch(
        `/api/extract?url=${encodeURIComponent(query.trim())}`
      );
      const json: ExtractionResponse = await res.json();

      if (!json.success || !json.data) {
        setError(errorMessage(json.errorCode, json.error));
      } else {
        setResult(json.data);
      }
    } catch {
      setError(GENERIC_NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void handleExtract();
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a URL (e.g. schema.org/Recipe, en.wikipedia.org/wiki/JSON-LD)"
          className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-transparent transition-all font-[family-name:var(--font-geist-sans)]"
          disabled={loading}
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="px-5 py-3 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-700 dark:hover:bg-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap font-[family-name:var(--font-geist-sans)]"
        >
          {loading ? "Extracting…" : "Extract"}
        </button>
      </form>

      {loading && (
        <div className="mt-8 flex items-center justify-center gap-3 text-neutral-500 dark:text-neutral-400">
          <svg
            className="animate-spin w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm">Extracting schema data…</span>
        </div>
      )}

      {error && !loading && (
        <div className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {result && !loading && <SchemaResults result={result} />}
    </div>
  );
}

function errorMessage(code?: ApiErrorCode, fallback?: string): string {
  // ACCESS_BLOCKED: prefer the server's specific message (e.g. "bot protection")
  // over the generic client-side copy.
  if (code === "ACCESS_BLOCKED") {
    return fallback ?? CLIENT_ERROR_MESSAGES.ACCESS_BLOCKED;
  }
  if (code && code in CLIENT_ERROR_MESSAGES) {
    return CLIENT_ERROR_MESSAGES[code as keyof typeof CLIENT_ERROR_MESSAGES];
  }
  return fallback ?? GENERIC_CLIENT_ERROR;
}
