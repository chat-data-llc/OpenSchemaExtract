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

### 1. With API Key

Get an API key from [https://openschemaextract.com/dashboard](https://openschemaextract.com/dashboard), then call the API:

```bash
curl -H "Authorization: Bearer osx_live_your_key" \
  "https://openschemaextract.com/api/extract?url=https://schema.org/Recipe"
```

No API key? Demo usage is available (rate-limited) — just omit the `Authorization` header.

### 2. Agent Skill (Claude Code, Cursor, etc.)

```bash
npx skills add chat-data-llc/OpenSchemaExtract
```

Then ask your AI agent: `"extract schema from https://schema.org/Recipe"`

See [PLUGIN.md](./PLUGIN.md) for details.

### 3. Self Hosting (npm package)

```bash
npm install openschemaextract
```

```typescript
import { extractSchema } from "openschemaextract";

const result = await extractSchema("https://schema.org/Recipe");
if (result.ok) {
  console.log(result.data.blocks); // All schema blocks
}
```

Runs entirely on your server — no API calls, no rate limits.

### 4. MCP (Model Context Protocol)

```bash
claude mcp add --transport stdio \
  --env OPENSCHEMAEXTRACT_API_KEY=osx_live_your_key \
  openschemaextract -- npx -y openschemaextract-mcp
```

See [mcp-server/README.md](./mcp-server/README.md) for details.

### 5. Docker Deployment (Production)

Deploy to your own VPS with one command:

```bash
git clone https://github.com/chat-data-llc/OpenSchemaExtract.git
cd OpenSchemaExtract
./deploy.sh
```

Includes Next.js app + MongoDB in Docker Compose with:
- Automatic SSL via Nginx + Certbot (optional)
- Data persistence with Docker volumes
- Health checks and auto-restart
- Complete production configuration

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment guide.

---

### For Contributors

**Prerequisites**: Node.js 18+

```bash
git clone https://github.com/chat-data-llc/OpenSchemaExtract.git
cd OpenSchemaExtract
npm install
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

## Deployment

For production deployment with Docker, Nginx, and SSL:

**Quick deploy to VPS:**
```bash
./deploy.sh
```

**Full guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- Docker + Docker Compose setup
- Nginx reverse proxy configuration
- SSL certificate with Let's Encrypt
- Environment variables reference
- Monitoring and backup procedures

## Production Notes

- This project fetches user-provided URLs server-side.
- If deploying publicly, add SSRF protections (allowlist or private-address blocking).
- Proxy fallback sends blocked URLs through `https://r.jina.ai/`; avoid passing sensitive URLs/tokens.
- Live integration tests depend on external websites and may be flaky over time.

## License

MIT
