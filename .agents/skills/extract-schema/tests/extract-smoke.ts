/**
 * End-to-end smoke tests for `extract()` (fetch + parsers + bot-wall handling).
 * Run via: npx tsx tests/extract-smoke.ts
 * Wired into: npm test
 */

import { extract } from "../src/extractor";

let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
  } else {
    console.log(`  ❌ ${label}`);
    failed++;
  }
}

async function main() {
  console.log("\n━━━ Extract pipeline smoke (src/extractor.ts) ━━━\n");

  {
    const r = await extract("https://schema.org/Recipe");
    assert(
      r.ok === true && r.data !== undefined && r.data.blocks.length > 0,
      "schema.org/Recipe → at least one schema block"
    );
    if (r.ok && r.data) {
      console.log(
        `     types: ${r.data.schemaTypes.slice(0, 6).join(", ")}${r.data.schemaTypes.length > 6 ? "…" : ""}`
      );
    }
  }

  {
    const r = await extract("https://tripadvisor.com");
    assert(
      r.ok === false && r.error.code === "ACCESS_BLOCKED",
      "tripadvisor.com → ACCESS_BLOCKED (DataDome / challenge page)"
    );
  }

  {
    const r = await extract("https://en.wikipedia.org/wiki/JSON-LD");
    assert(
      r.ok === true && r.data !== undefined && r.data.blocks.length > 0,
      "en.wikipedia.org/wiki/JSON-LD → schema blocks"
    );
  }

  console.log(`\n━━━ Extract smoke results ━━━`);
  console.log(`Passed assertions: ${failed === 0 ? "all" : "some failed"}`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
