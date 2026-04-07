# OpenSchemaExtract MCP Server

Model Context Protocol (MCP) server for OpenSchemaExtract. Enables AI assistants like Claude to extract structured data (JSON-LD, Microdata, RDFa) from any URL.

## Installation

### Quick Start (npx - no installation needed)

```bash
npx -y openschemaextract-mcp
```

### Global Installation

```bash
npm install -g openschemaextract-mcp
```

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

#### Without API Key (Public Demo - Rate Limited)

```json
{
  "mcpServers": {
    "openschemaextract": {
      "command": "npx",
      "args": ["-y", "openschemaextract-mcp"]
    }
  }
}
```

#### With API Key (Unlimited)

Get your API key from [https://openschemaextract.chat-data.com/dashboard](https://openschemaextract.chat-data.com/dashboard)

```json
{
  "mcpServers": {
    "openschemaextract": {
      "command": "npx",
      "args": ["-y", "openschemaextract-mcp"],
      "env": {
        "OPENSCHEMAEXTRACT_API_KEY": "osx_live_your_key_here"
      }
    }
  }
}
```

### With Claude Code CLI

```bash
# Without API key (public demo)
claude mcp add openschemaextract -- npx -y openschemaextract-mcp

# With API key (unlimited)
claude mcp add -e OPENSCHEMAEXTRACT_API_KEY=osx_live_your_key_here \
  -- openschemaextract npx -y openschemaextract-mcp
```

Or manually edit `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "openschemaextract": {
      "command": "npx",
      "args": ["-y", "openschemaextract-mcp"],
      "env": {
        "OPENSCHEMAEXTRACT_API_KEY": "osx_live_your_key_here"
      }
    }
  }
}
```

## Available Tools

### `extract_schema`

Extracts structured data from any URL.

**Parameters:**
- `url` (string, required): The URL to extract schema from

**Returns:**
- Schema types found (e.g., Recipe, Product, Article)
- Number of blocks by format (JSON-LD, Microdata, RDFa)
- Full structured data as JSON

**Example prompts:**
- "Extract schema from https://schema.org/Recipe"
- "What structured data is on stripe.com?"
- "Analyze the JSON-LD on this page: https://example.com"

## Environment Variables

- `OPENSCHEMAEXTRACT_API_KEY` - Your API key (optional, for unlimited access)
- `OPENSCHEMAEXTRACT_API_URL` - Custom API endpoint (defaults to `https://openschemaextract.chat-data.com/api/extract`)

## How It Works

The MCP server acts as a bridge between AI assistants and the OpenSchemaExtract API:

1. AI assistant calls the `extract_schema` tool with a URL
2. MCP server makes HTTP request to OpenSchemaExtract API
3. Returns formatted results to the AI assistant
4. AI summarizes and presents findings to the user

## API Key Benefits

**Without API key (public demo):**
- ✓ Works immediately
- ✗ Rate limited
- ✗ May be slower

**With API key:**
- ✓ Unlimited requests
- ✓ Faster response times
- ✓ Priority support
- ✓ Access to dashboard analytics

Get your key at: [https://openschemaextract.chat-data.com/dashboard](https://openschemaextract.chat-data.com/dashboard)

## License

MIT - See [LICENSE](../LICENSE)

## Links

- [OpenSchemaExtract Homepage](https://openschemaextract.chat-data.com)
- [GitHub Repository](https://github.com/chat-data-llc/OpenSchemaExtract)
- [API Documentation](https://openschemaextract.chat-data.com#get-started)
- [Model Context Protocol Specification](https://modelcontextprotocol.io)
