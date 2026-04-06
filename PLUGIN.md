# OpenSchemaExtract Claude Code Plugin

This repository includes a Claude Code plugin that adds schema extraction capabilities to AI coding agents.

## Installation

```bash
npx skills add chat-data-llc/OpenSchemaExtract
```

Once installed, you can ask your agent to extract structured data from any URL:

```
"extract schema from https://schema.org/Recipe"
"get structured data from stripe.com"
"what JSON-LD is on example.com"
```

The agent will automatically call the OpenSchemaExtract API and summarize the findings.

## What it does

The `extract-schema` skill teaches AI agents how to:
- Call the OpenSchemaExtract API (`/api/extract`)
- Parse the JSON response
- Identify JSON-LD, Microdata, and RDFa blocks
- Summarize findings in a helpful format
- Suggest missing fields or schema improvements

## Plugin structure

```
OpenSchemaExtract/
├── plugin.json              # Plugin manifest
├── SKILL.md                 # Schema extraction skill (root level)
└── skills/
    └── extract.md           # (backup copy)
```

## API usage

The skill uses the public API endpoint:
```
GET https://openschemaextract.com/api/extract?url={encoded_url}
```

**Free tier**: No authentication required, rate-limited for demo usage

**With API key**: Add `Authorization: Bearer osx_live_...` header for unlimited requests. Get your key at https://openschemaextract.com/dashboard

## Compatibility

Works with any AI agent that supports the Claude Code skill format:
- Claude Code CLI
- Cursor
- Codex
- Gemini CLI
- 40+ other coding agents

## License

MIT — same as the main OpenSchemaExtract project
