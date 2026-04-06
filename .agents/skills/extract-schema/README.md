# OpenSchemaExtract

Extract structured data (JSON-LD, Microdata, RDFa) from any URL into clean JSON.

OpenSchemaExtract includes:
- A reusable TypeScript/Node extractor library
- A Next.js API endpoint (`/api/extract`)
- A minimal web UI for interactive extraction
- A Claude Code plugin for AI agents (see [PLUGIN.md](./PLUGIN.md))
- An MCP server for Claude Desktop and other MCP clients (see [mcp-server/README.md](./mcp-server/README.md))

## GitHub Description

Extract JSON-LD, Microdata, and RDFa from any URL with a fast TypeScript library, API endpoint, and web UI.

## Features

- Parses `application/ld+json`, Microdata (`itemscope/itemprop`), and RDFa (`typeof/property`)
- Normalizes output into:
  - `schemaTypes`
  - `blocks`
  - `byType`
- Bot-wall handling with fallback fetching via `r.jina.ai`
- Typed response model for app and package usage

## Quick Start

### For MCP Clients (Claude Desktop, etc.)

```bash
claude mcp add --transport stdio \
  --env OPENSCHEMAEXTRACT_API_KEY=osx_live_your_key \
  openschemaextract -- npx -y openschemaextract-mcp
```

See [mcp-server/README.md](./mcp-server/README.md) for details.

### For AI Agents (Claude Code, Cursor, etc.)

```bash
npx skills add chat-data-llc/OpenSchemaExtract
```

Then just ask: `"extract schema from https://schema.org/Recipe"`

See [PLUGIN.md](./PLUGIN.md) for details.

### For Developers

**Prerequisites**: Node.js 18+

**Install**:
```bash
npm install
```

**Run the Web App**:
```bash
npm run dev
```

Open `http://localhost:3000`.

## API Usage

### Request

```bash
curl "http://localhost:3000/api/extract?url=schema.org/Recipe"
```

### Success Response

```json
{
  "success": true,
  "data": {
    "url": "https://schema.org/Recipe",
    "schemaTypes": ["Recipe"],
    "blocks": [
      {
        "format": "json-ld",
        "type": "Recipe",
        "data": { "name": "..." }
      }
    ],
    "byType": {
      "Recipe": [
        {
          "format": "json-ld",
          "type": "Recipe",
          "data": { "name": "..." }
        }
      ]
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "No structured data found on this page",
  "errorCode": "EMPTY_CONTENT"
}
```

## Library Usage

Install the package:

```bash
npm install openschemaextract
```

Use it in your Node.js code:

```ts
import { extractSchema } from "openschemaextract";

const result = await extractSchema("https://schema.org/Recipe");

if (result.ok) {
  console.log(result.data.schemaTypes); // ["Recipe"]
  console.log(result.data.blocks); // All schema blocks
  console.log(result.data.byType); // Grouped by @type
} else {
  console.error(result.error.code, result.error.message);
}
```

Available exports:
- `extractSchema(url: string)` — Main extraction function
- `extract(url: string)` — Alias
- TypeScript types: `ExtractionResult`, `SchemaBlock`, `ExtractionError`, `ExtractionErrorCode`

## Scripts

```bash
npm run dev        # Next.js dev server
npm run build      # Next.js production build
npm run start      # Run production server
npm run test       # Integration + smoke tests
npm run build:pkg  # Build package with tsup
```

## Project Structure

```text
app/                 Next.js app router and API route
components/          UI components
src/                 Extractor library and parsers
src/parsers/         JSON-LD, Microdata, RDFa parsers
tests/               Integration and smoke tests
```

## Production Notes

- This project fetches user-provided URLs server-side.
- If deploying publicly, add SSRF protections (allowlist or private-address blocking).
- Proxy fallback sends blocked URLs through `https://r.jina.ai/`; avoid passing sensitive URLs/tokens.
- Live integration tests depend on external websites and may be flaky over time.

## License

MIT
