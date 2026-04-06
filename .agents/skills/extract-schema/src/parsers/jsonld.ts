import * as cheerio from "cheerio";
import type { SchemaBlock } from "../types";

function normalizeType(raw: unknown): string {
  if (typeof raw !== "string") return "Unknown";
  // schema:Product → Product
  const colon = raw.lastIndexOf(":");
  if (colon !== -1) return raw.slice(colon + 1);
  // https://schema.org/Product → Product
  const slash = raw.lastIndexOf("/");
  if (slash !== -1) return raw.slice(slash + 1);
  return raw;
}

function processNode(node: Record<string, unknown>): SchemaBlock[] {
  const results: SchemaBlock[] = [];

  if ("@graph" in node && Array.isArray(node["@graph"])) {
    for (const item of node["@graph"]) {
      if (item && typeof item === "object") {
        results.push(...processNode(item as Record<string, unknown>));
      }
    }
    return results;
  }

  const rawType = node["@type"];
  const types = Array.isArray(rawType) ? rawType : [rawType];

  for (const t of types) {
    const typeName = normalizeType(t);
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) {
      if (k !== "@type") data[k] = v;
    }
    results.push({ format: "json-ld", type: typeName, data });
  }

  return results;
}

export function parseJsonLd(html: string): SchemaBlock[] {
  const $ = cheerio.load(html);
  const blocks: SchemaBlock[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).html();
    if (!raw) return;

    try {
      const parsed: unknown = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item && typeof item === "object") {
          blocks.push(...processNode(item as Record<string, unknown>));
        }
      }
    } catch {
      // skip invalid JSON
    }
  });

  return blocks;
}
