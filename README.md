# OpenSchemaExtract

Extract structured data (JSON-LD, Microdata, RDFa) from any URL into clean JSON.

OpenSchemaExtract includes:
- A reusable TypeScript/Node extractor library
- A Next.js API endpoint (`/api/extract`)
- A minimal web UI for interactive extraction

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

### Prerequisites

- Node.js 18+

### Install

```bash
npm install
```

### Run the Web App

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

```ts
import { fetchFreeSchema } from "freeschema-cd";

const result = await fetchFreeSchema("https://schema.org/Recipe");

if (result.ok) {
  console.log(result.data.schemaTypes);
  console.log(result.data.blocks.length);
} else {
  console.error(result.error.code, result.error.message);
}
```

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
