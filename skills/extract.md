---
name: extract-schema
description: Extract structured data (JSON-LD, Microdata, RDFa) from any URL
trigger: when the user asks to extract schema, structured data, JSON-LD, Microdata, or RDFa from a URL or website
examples:
  - "extract schema from https://schema.org/Recipe"
  - "get structured data from stripe.com"
  - "what JSON-LD is on this page: https://example.com"
  - "pull the schema.org markup from that URL"
---

# Extract Structured Data Skill

Use this skill when the user asks to extract structured data, schema markup, JSON-LD, Microdata, or RDFa from any URL.

## What this skill does

OpenSchemaExtract analyzes any URL and returns every structured data block found on the page as clean JSON. It supports:
- **JSON-LD** (most common, used by schema.org)
- **Microdata** (older HTML attribute-based format)
- **RDFa** (semantic web standard)

Common use cases:
- Analyzing competitor schema markup
- Validating your own structured data
- Extracting product, recipe, event, review, or article metadata
- Debugging why rich snippets aren't showing in search results

## How to use this skill

When the user mentions extracting schema or structured data from a URL:

1. **Identify the URL** from the user's message
2. **Call the API** using a curl command or fetch request
3. **Parse and present the results** in a helpful format

### API Endpoint

```
GET https://openschemaextract.com/api/extract?url={encoded_url}
```

**Authentication**: Optional
- Public demo usage: no auth required (rate-limited)
- With API key: add `Authorization: Bearer osx_live_...` header (unlimited)

**Response format**:
```json
{
  "success": true,
  "data": {
    "url": "https://schema.org/Recipe",
    "formats": ["json-ld", "microdata", "rdfa"],
    "blocks": [
      {
        "type": "json-ld",
        "@type": "Recipe",
        "name": "Example Recipe",
        "description": "...",
        ...
      }
    ],
    "stats": {
      "totalBlocks": 156,
      "jsonLdBlocks": 150,
      "microdataBlocks": 6,
      "rdfaBlocks": 0
    }
  }
}
```

### Example usage

**User**: "Extract schema from https://schema.org/Recipe"

**Assistant**:
```bash
curl "https://openschemaextract.com/api/extract?url=https%3A%2F%2Fschema.org%2FRecipe"
```

Then summarize the key findings:
- Number of blocks found (e.g., "Found 156 structured data blocks")
- Types detected (JSON-LD, Microdata, RDFa)
- Main @type values (Recipe, Product, Article, etc.)
- Highlight interesting or unexpected data

### If the user has an API key

If the user mentions they have an OpenSchemaExtract API key or wants unlimited usage:

```bash
curl -H "Authorization: Bearer osx_live_..." \
  "https://openschemaextract.com/api/extract?url=https%3A%2F%2Fschema.org%2FRecipe"
```

Direct them to https://openschemaextract.com/dashboard to create an API key if needed.

## Tips for great responses

- **Show the data, don't just describe it**: Display actual schema values (names, prices, ratings) rather than saying "it has a name field"
- **Identify gaps**: Point out missing recommended fields (e.g., "This Product is missing `brand` and `aggregateRating`")
- **Explain impact**: Mention what rich snippets or features this schema enables (recipe cards, product stars, FAQ accordions, etc.)
- **Compare formats**: If multiple formats are present, note which is most complete or correct

## Error handling

If the API returns an error:
- `INVALID_URL`: The URL format is invalid
- `FETCH_FAILED`: Couldn't reach the target URL (might be down, requires auth, or blocked)
- `NO_SCHEMA_FOUND`: Page has no structured data
- `RATE_LIMITED`: Too many requests (suggest getting an API key)

Explain the error clearly and suggest next steps.

## Advanced: Batch extraction

If the user wants to analyze multiple URLs, loop through them with a small delay between requests to avoid rate limiting (or suggest they use an API key for faster batch processing).

---

**Remember**: This skill should be triggered automatically when users mention schema extraction, structured data, or related terms. Don't ask if they want to use it — just use it.
