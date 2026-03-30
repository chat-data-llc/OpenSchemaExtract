import { fetchPage, fetchViaJina } from "./fetcher";
import { API_ERROR_MESSAGES } from "./constants";
import { parseJsonLd } from "./parsers/jsonld";
import { parseMicrodata } from "./parsers/microdata";
import { parseRdfa } from "./parsers/rdfa";
import type { ExtractionError, ExtractionResult, SchemaBlock } from "./types";

type ExtractResult =
  | { ok: true; data: ExtractionResult }
  | { ok: false; error: ExtractionError };

function parseBlocks(html: string): SchemaBlock[] {
  return [
    ...parseJsonLd(html),
    ...parseMicrodata(html),
    ...parseRdfa(html),
  ];
}

function buildResult(url: string, blocks: SchemaBlock[]): ExtractionResult {
  const seen = new Set<string>();
  const schemaTypes: string[] = [];
  for (const block of blocks) {
    if (!seen.has(block.type)) {
      seen.add(block.type);
      schemaTypes.push(block.type);
    }
  }

  const byType: Record<string, SchemaBlock[]> = {};
  for (const block of blocks) {
    if (!byType[block.type]) byType[block.type] = [];
    byType[block.type].push(block);
  }

  return { url, schemaTypes, blocks, byType };
}

export async function extract(url: string): Promise<ExtractResult> {
  const fetched = await fetchPage(url);
  if (!fetched.ok) return fetched;

  const blocks = parseBlocks(fetched.html);

  // If direct HTML had no schema data, retry via Jina (handles JS-rendered sites)
  if (blocks.length === 0) {
    const jina = await fetchViaJina(url);
    if (jina.ok) {
      const jinaBlocks = parseBlocks(jina.html);
      if (jinaBlocks.length > 0) {
        return { ok: true, data: buildResult(url, jinaBlocks) };
      }
    }

    return {
      ok: false,
      error: {
        code: "EMPTY_CONTENT",
        message: API_ERROR_MESSAGES.EMPTY_CONTENT,
        status: 200,
      },
    };
  }

  return { ok: true, data: buildResult(url, blocks) };
}
