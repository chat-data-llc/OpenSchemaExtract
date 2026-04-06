import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import type { SchemaBlock } from "../types";

type CheerioAPI = ReturnType<typeof cheerio.load>;

function typeFromUrl(itemtype: string): string {
  const slash = itemtype.lastIndexOf("/");
  return slash !== -1 ? itemtype.slice(slash + 1) : itemtype;
}

/** Resolve the value of a microdata property element based on its tag name. */
function resolveElementValue(
  $: CheerioAPI,
  child: Element
): unknown {
  const $child = $(child);
  const tagName = child.tagName?.toLowerCase();

  switch (tagName) {
    case "meta":
      return $child.attr("content") ?? $child.text().trim();
    case "link":
    case "a":
      return $child.attr("href") ?? $child.text().trim();
    case "img":
      return $child.attr("src") ?? $child.text().trim();
    case "time":
      return $child.attr("datetime") ?? $child.text().trim();
    default:
      return $child.text().trim();
  }
}

/** Merge all entries from `source` into `target` using appendProp. */
function mergeProps(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): void {
  for (const [k, v] of Object.entries(source)) {
    appendProp(target, k, v);
  }
}

function extractItemProps(
  $: CheerioAPI,
  el: Element
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  $(el)
    .children()
    .each((_, child) => {
      const $child = $(child);
      const prop = $child.attr("itemprop");
      const hasScope = $child.attr("itemscope") !== undefined;

      if (hasScope && prop) {
        const nestedType = $child.attr("itemtype");
        const nestedData = extractItemProps($, child);
        if (nestedType) nestedData["@type"] = typeFromUrl(nestedType);
        appendProp(data, prop, nestedData);
        return;
      }

      // nested scope without itemprop -- skip
      if (hasScope) return;

      if (prop) {
        appendProp(data, prop, resolveElementValue($, child));
        mergeProps(data, extractChildProps($, child));
      } else {
        mergeProps(data, extractChildProps($, child));
      }
    });

  return data;
}

function extractChildProps(
  $: CheerioAPI,
  el: Element
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  $(el)
    .children()
    .each((_, child) => {
      const $child = $(child);
      if ($child.attr("itemscope") !== undefined) return;

      const prop = $child.attr("itemprop");
      if (prop) {
        appendProp(data, prop, resolveElementValue($, child));
      } else {
        mergeProps(data, extractChildProps($, child));
      }
    });

  return data;
}

function appendProp(
  data: Record<string, unknown>,
  key: string,
  value: unknown
) {
  if (key in data) {
    const existing = data[key];
    if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      data[key] = [existing, value];
    }
  } else {
    data[key] = value;
  }
}

export function parseMicrodata(html: string): SchemaBlock[] {
  const $ = cheerio.load(html);
  const blocks: SchemaBlock[] = [];

  // Only top-level itemscope elements (not nested inside another itemscope)
  $("[itemscope]").each((_, el) => {
    // Skip if inside another itemscope — use parent().closest() so self is excluded
    const parent = $(el).parent().closest("[itemscope]");
    if (parent.length > 0) return;

    const itemtype = $(el).attr("itemtype") ?? "";
    const typeName = itemtype ? typeFromUrl(itemtype) : "Unknown";
    const data = extractItemProps($, el);

    blocks.push({ format: "microdata", type: typeName, data });
  });

  return blocks;
}
