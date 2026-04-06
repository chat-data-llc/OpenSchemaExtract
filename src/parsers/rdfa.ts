import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import type { SchemaBlock } from "../types";

type CheerioAPI = ReturnType<typeof cheerio.load>;

function resolveType(typeAttr: string): string {
  if (typeAttr.startsWith("http://") || typeAttr.startsWith("https://")) {
    const slash = typeAttr.lastIndexOf("/");
    return slash !== -1 ? typeAttr.slice(slash + 1) : typeAttr;
  }
  if (typeAttr.includes(":")) {
    const colon = typeAttr.lastIndexOf(":");
    return typeAttr.slice(colon + 1);
  }
  return typeAttr;
}

function collectProperties(
  $: CheerioAPI,
  el: Element
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  $(el)
    .find("[property]")
    .each((_, propEl) => {
      // Skip if inside a nested typeof
      const nestedScope = $(propEl).closest("[typeof]");
      if (nestedScope.length > 0 && nestedScope[0] !== el) return;

      const prop = $(propEl).attr("property");
      if (!prop) return;

      const tagName = propEl.tagName?.toLowerCase();
      let value: unknown;

      if ($(propEl).attr("content") !== undefined) {
        value = $(propEl).attr("content");
      } else if ($(propEl).attr("href") !== undefined && tagName === "a") {
        value = $(propEl).attr("href");
      } else if ($(propEl).attr("src") !== undefined) {
        value = $(propEl).attr("src");
      } else if ($(propEl).attr("typeof") !== undefined) {
        // nested resource — recurse
        const nestedType = $(propEl).attr("typeof") ?? "Thing";
        const nestedData = collectProperties($, propEl);
        nestedData["@type"] = nestedType;
        value = nestedData;
      } else {
        value = $(propEl).text().trim();
      }

      // Strip schema prefix from property name
      const propName = prop.includes(":") ? prop.split(":").pop()! : prop;

      if (propName in data) {
        const existing = data[propName];
        if (Array.isArray(existing)) {
          (existing as unknown[]).push(value);
        } else {
          data[propName] = [existing, value];
        }
      } else {
        data[propName] = value;
      }
    });

  return data;
}

export function parseRdfa(html: string): SchemaBlock[] {
  const $ = cheerio.load(html);
  const blocks: SchemaBlock[] = [];

  $("[typeof]").each((_, el) => {
    // Skip nested typeof elements (handled by collectProperties)
    const parent = $(el).parent().closest("[typeof]");
    if (parent.length > 0) return;

    const typeAttr = $(el).attr("typeof") ?? "";
    const types = typeAttr.split(/\s+/).filter(Boolean);
    const data = collectProperties($, el);

    for (const t of types) {
      const typeName = resolveType(t);
      blocks.push({ format: "rdfa", type: typeName, data });
    }
  });

  return blocks;
}
