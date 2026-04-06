import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import type { SchemaBlock } from "../types";

type CheerioAPI = ReturnType<typeof cheerio.load>;

function typeFromUrl(itemtype: string): string {
  const slash = itemtype.lastIndexOf("/");
  return slash !== -1 ? itemtype.slice(slash + 1) : itemtype;
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

      if ($child.attr("itemscope") !== undefined && prop) {
        // nested item
        const nestedType = $child.attr("itemtype");
        const nestedData = extractItemProps($, child);
        if (nestedType) nestedData["@type"] = typeFromUrl(nestedType);
        appendProp(data, prop, nestedData);
        return;
      }

      if ($child.attr("itemscope") !== undefined && !prop) {
        // nested scope without itemprop — recurse but don't add to parent
        return;
      }

      if (prop) {
        const tagName = (child as Element).tagName?.toLowerCase();
        let value: unknown;

        if (tagName === "meta") {
          value = $child.attr("content") ?? $child.text().trim();
        } else if (tagName === "link") {
          value = $child.attr("href") ?? $child.text().trim();
        } else if (tagName === "a") {
          value = $child.attr("href") ?? $child.text().trim();
        } else if (tagName === "img") {
          value = $child.attr("src") ?? $child.text().trim();
        } else if (tagName === "time") {
          value = $child.attr("datetime") ?? $child.text().trim();
        } else {
          value = $child.text().trim();
        }

        appendProp(data, prop, value);

        // recurse into children that have itemprop but aren't nested itemscope
        const childData = extractChildProps($, child);
        for (const [k, v] of Object.entries(childData)) {
          appendProp(data, k, v);
        }
      } else {
        // no itemprop, recurse
        const childData = extractChildProps($, child);
        for (const [k, v] of Object.entries(childData)) {
          appendProp(data, k, v);
        }
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
      const prop = $child.attr("itemprop");

      if ($child.attr("itemscope") !== undefined) return; // handled by parent

      if (prop) {
        const tagName = (child as Element).tagName?.toLowerCase();
        let value: unknown;
        if (tagName === "meta") value = $child.attr("content") ?? $child.text().trim();
        else if (tagName === "link") value = $child.attr("href") ?? $child.text().trim();
        else if (tagName === "a") value = $child.attr("href") ?? $child.text().trim();
        else if (tagName === "img") value = $child.attr("src") ?? $child.text().trim();
        else if (tagName === "time") value = $child.attr("datetime") ?? $child.text().trim();
        else value = $child.text().trim();

        appendProp(data, prop, value);
      } else {
        const childData = extractChildProps($, child);
        for (const [k, v] of Object.entries(childData)) {
          appendProp(data, k, v);
        }
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
