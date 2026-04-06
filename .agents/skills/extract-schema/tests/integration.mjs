/**
 * FreeSchema integration tests
 * Run with: node tests/integration.mjs
 */

import { load } from "cheerio";

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ─── helpers ────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}`);
    failed++;
  }
}

async function fetchDirect(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": CHROME_UA, Accept: "text/html" },
      signal: c.signal,
    });
    clearTimeout(t);
    return { status: r.status, html: await r.text() };
  } catch (e) {
    clearTimeout(t);
    return { status: 0, html: "", err: e.message };
  }
}

async function fetchJina(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 20000);
  try {
    const r = await fetch(`https://r.jina.ai/${url}`, {
      headers: { "X-Return-Format": "html" },
      signal: c.signal,
    });
    clearTimeout(t);
    return { status: r.status, html: await r.text() };
  } catch (e) {
    clearTimeout(t);
    return { status: 0, html: "", err: e.message };
  }
}

function parseHtml(html) {
  const $ = load(html);
  let jsonldCount = 0;
  const types = new Set();
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).html());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        const raw = item["@type"];
        const ts = Array.isArray(raw) ? raw : [raw];
        for (const t of ts) {
          if (t) types.add(t.split("/").pop().split(":").pop());
        }
        if (item["@graph"]) {
          for (const g of item["@graph"]) {
            const gt = g["@type"];
            const gts = Array.isArray(gt) ? gt : [gt];
            for (const t of gts) if (t) types.add(t.split("/").pop().split(":").pop());
          }
        }
      }
      jsonldCount++;
    } catch {}
  });
  const microdata = $("[itemscope]").length;
  const rdfa = $("[typeof]").length;
  return { jsonldCount, microdata, rdfa, types: [...types], total: jsonldCount + microdata + rdfa };
}

// ─── unit tests: parser edge cases ──────────────────────────────────────────

console.log("\n━━━ Unit: JSON-LD parser edge cases ━━━");

{
  const html = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Test"}</script>`;
  const r = parseHtml(html);
  assert(r.jsonldCount === 1, "single JSON-LD object");
  assert(r.types.includes("Product"), "extracts @type=Product");
}

{
  const html = `<script type="application/ld+json">[{"@type":"Product","name":"A"},{"@type":"BreadcrumbList"}]</script>`;
  const r = parseHtml(html);
  assert(r.jsonldCount === 1, "JSON array at root");
  assert(r.types.includes("Product") && r.types.includes("BreadcrumbList"), "extracts both types from array");
}

{
  const html = `<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Product"},{"@type":"Organization"}]}</script>`;
  const r = parseHtml(html);
  assert(r.types.includes("Product") && r.types.includes("Organization"), "@graph expansion works");
}

{
  const html = `<script type="application/ld+json">{"@type":["Recipe","NewsArticle"],"name":"Cookies"}</script>`;
  const r = parseHtml(html);
  assert(r.types.includes("Recipe") && r.types.includes("NewsArticle"), "array @type works");
}

{
  const html = `<script type="application/ld+json">{"@type":"schema:Product","name":"Test"}</script>`;
  const r = parseHtml(html);
  assert(r.types.includes("Product"), "schema: prefix stripped");
}

{
  // Broken JSON should not crash
  const html = `<script type="application/ld+json">{ broken json !! }</script><script type="application/ld+json">{"@type":"Article"}</script>`;
  const r = parseHtml(html);
  assert(r.jsonldCount === 1 && r.types.includes("Article"), "invalid JSON skipped, valid one parsed");
}

console.log("\n━━━ Unit: Microdata parser edge cases ━━━");

{
  const html = `<div itemscope itemtype="https://schema.org/Product"><span itemprop="name">Widget</span><span itemprop="price">9.99</span></div>`;
  const $ = load(html);
  assert($("[itemscope]").length === 1, "microdata itemscope detected");
  assert($("[itemprop]").length === 2, "microdata itemprop detected");
}

{
  const html = `<div itemscope itemtype="https://schema.org/Product"><div itemprop="offers" itemscope itemtype="https://schema.org/Offer"><span itemprop="price">9.99</span></div></div>`;
  const $ = load(html);
  // closest() includes self, so use parent().closest() to detect nesting
  const top = $("[itemscope]").filter((_, el) => $(el).parent().closest("[itemscope]").length === 0);
  assert(top.length === 1, "nested itemscope: only top-level counted");
}

console.log("\n━━━ Unit: RDFa parser edge cases ━━━");

{
  const html = `<div vocab="https://schema.org/" typeof="Product"><span property="name">Widget</span></div>`;
  const $ = load(html);
  assert($("[typeof]").length === 1, "RDFa typeof detected");
  assert($("[property]").length === 1, "RDFa property detected");
}

// ─── integration tests: real URLs ───────────────────────────────────────────

console.log("\n━━━ Integration: Real URLs ━━━\n");

const realUrlTests = [
  {
    label: "allrecipes recipe (JSON-LD, blocked → Jina fallback)",
    url: "https://www.allrecipes.com/recipe/10813/best-chocolate-chip-cookies/",
    expectTypes: ["Recipe"],
  },
  {
    label: "schema.org/Product (JSON-LD + Microdata)",
    url: "https://schema.org/Product",
    expectTypes: [],
    minTotal: 1,
  },
  {
    label: "Wikipedia (JSON-LD + RDFa)",
    url: "https://en.wikipedia.org/wiki/Structured_data",
    expectTypes: [],
    minTotal: 1,
  },
  {
    label: "BBC News article (JSON-LD)",
    url: "https://www.bbc.com/news",
    expectTypes: [],
    minTotal: 1,
  },
  {
    label: "NYTimes article (JSON-LD)",
    url: "https://www.nytimes.com",
    expectTypes: [],
    minTotal: 1,
  },
];

for (const test of realUrlTests) {
  console.log(`▶ ${test.label}`);
  console.log(`  url: ${test.url}`);

  let result = await fetchDirect(test.url);
  if (parseHtml(result.html).total === 0) {
    result = await fetchJina(test.url);
  }

  const parsed = parseHtml(result.html);
  console.log(
    `  http=${result.status} bodyLen=${result.html.length} jsonld=${parsed.jsonldCount} microdata=${parsed.microdata} rdfa=${parsed.rdfa}`
  );
  console.log(`  types found: ${parsed.types.slice(0, 8).join(", ") || "(none)"}`);

  assert(parsed.total > 0, "found at least one schema block");
  if (test.expectTypes) {
    for (const t of test.expectTypes) {
      assert(parsed.types.includes(t), `includes type "${t}"`);
    }
  }
  console.log();
}

// ─── known-blocked sites (raw fetch often has no parseable schema) ─────────

console.log("━━━ Known-blocked / bot-protected sites (smoke check) ━━━\n");

const blocked = [
  { label: "IMDB (AWS WAF, 202 bot page)", url: "https://www.imdb.com/title/tt0111161/" },
  { label: "Amazon product (no schema markup)", url: "https://www.amazon.com/dp/B0CX23V2ZK" },
  { label: "TripAdvisor (403)", url: "https://www.tripadvisor.com/Restaurant_Review-g60763-d802686-Reviews-Eleven_Madison_Park-New_York_City_New_York.html" },
  { label: "Etsy listing (403 + Jina blocked)", url: "https://www.etsy.com/listing/1762049541" },
];

for (const b of blocked) {
  const d = await fetchDirect(b.url);
  const parsed = parseHtml(d.html);
  let jinaTotal = 0;
  if (parsed.total === 0) {
    const j = await fetchJina(b.url);
    jinaTotal = parseHtml(j.html).total;
  }
  const total = parsed.total + jinaTotal;
  console.log(`  ${total === 0 ? "⚠️ " : "🔥"} ${b.label}`);
  console.log(
    `     http=${d.status} blocks=${total} → ${total === 0 ? "no schema in HTML (app: ACCESS_BLOCKED if challenge page)" : "UNEXPECTED — has data!"}`
  );
}

// ─── summary ────────────────────────────────────────────────────────────────

console.log(`\n━━━ Results ━━━`);
console.log(`Passed: ${passed}  Failed: ${failed}  Total: ${passed + failed}`);
if (failed > 0) process.exit(1);
