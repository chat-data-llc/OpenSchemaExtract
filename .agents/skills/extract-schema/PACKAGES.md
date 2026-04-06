# OpenSchemaExtract Packages

This repository contains multiple npm packages for different use cases.

## 1. openschemaextract (Main Library)

**Package**: `openschemaextract`
**Location**: Root directory
**Type**: Node.js library
**Install**: `npm install openschemaextract`

### Usage

```typescript
import { extractSchema } from "openschemaextract";

const result = await extractSchema("https://schema.org/Recipe");
if (result.ok) {
  console.log(result.data.blocks);
}
```

### When to use
- Building Node.js applications that need schema extraction
- Server-side processing
- Batch extraction jobs
- No network calls to external API (runs locally)

---

## 2. openschemaextract-mcp (MCP Server)

**Package**: `openschemaextract-mcp`
**Location**: `mcp-server/`
**Type**: MCP server (stdio)
**Install**: `npx -y openschemaextract-mcp` (no install needed)

### Usage

**Claude Desktop config** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "openschemaextract": {
      "command": "npx",
      "args": ["-y", "openschemaextract-mcp"],
      "env": {
        "OPENSCHEMAEXTRACT_API_KEY": "osx_live_your_key"
      }
    }
  }
}
```

**Claude Code CLI**:
```bash
claude mcp add --transport stdio \
  --env OPENSCHEMAEXTRACT_API_KEY=osx_live_your_key \
  openschemaextract -- npx -y openschemaextract-mcp
```

### When to use
- Using Claude Desktop or other MCP-compatible clients
- Want AI assistants to extract schema data
- Prefer GUI-based interaction
- Need persistent tool availability

---

## 3. OpenSchemaExtract Claude Code Plugin

**Package**: N/A (installed via skills CLI)
**Location**: Root directory (`plugin.json`, `SKILL.md`)
**Type**: Claude Code skill
**Install**: `npx skills add chat-data-llc/OpenSchemaExtract`

### Usage

After installation, just ask your AI coding agent:
```
"extract schema from https://schema.org/Recipe"
"what structured data is on stripe.com?"
```

### When to use
- Using Claude Code, Cursor, Codex, or other skill-compatible agents
- Want AI coding assistants to automatically extract schema
- Prefer command-line AI tools
- Need extraction capabilities in code editors

---

## Comparison

| Feature | Library | MCP Server | Claude Code Plugin |
|---|---|---|---|
| **Target** | Developers | AI Desktop Apps | AI Code Editors |
| **Runtime** | Node.js app | stdio subprocess | AI agent subprocess |
| **Auth** | N/A (local) | API key (optional) | API key (optional) |
| **Installation** | `npm install` | `npx` (no install) | `npx skills add` |
| **Network** | No API calls | Calls API | Calls API |
| **Use case** | Build apps | Chat with Claude Desktop | Ask coding agents |

---

## Publishing Status

### Published
- [ ] `openschemaextract` (main library)
- [ ] `openschemaextract-mcp` (MCP server)

### GitHub-based (no npm publish needed)
- [x] Claude Code plugin (install via GitHub repo)

---

## Publishing Order

1. **Publish main library first**:
   ```bash
   npm run build:pkg
   npm publish --access public
   ```

2. **Publish MCP server second**:
   ```bash
   cd mcp-server
   npm run build
   npm publish --access public
   ```

3. **Push to GitHub** (makes Claude Code plugin available):
   ```bash
   git add .
   git commit -m "Add npm packages and MCP server"
   git push
   ```

Once published, all three methods will work immediately!
