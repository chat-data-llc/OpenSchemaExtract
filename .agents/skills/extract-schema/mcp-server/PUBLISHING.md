# Publishing openschemaextract-mcp to npm

## Prerequisites

1. **npm account**: Same account as main package
2. **Login**: `npm login`

## Publishing Checklist

- [ ] Update version in `package.json`
- [ ] Build: `npm run build`
- [ ] Test locally: `node dist/index.js` (should start MCP server)
- [ ] Commit changes

## Publishing

```bash
cd mcp-server
npm publish --access public
```

## Post-publish

- Verify: `npm view openschemaextract-mcp`
- Test with npx: `npx -y openschemaextract-mcp`

## Version Updates

```bash
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
npm publish --access public
```

## Testing the MCP Server

### Manual Test

```bash
# Start the server
node dist/index.js

# It should log to stderr:
# OpenSchemaExtract MCP server running on stdio
# ⚠ No API key set (using public demo - rate limited)

# Test with a tool call (use MCP inspector or claude mcp test)
```

### With MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

### With Claude Code

```bash
# Add to config
claude mcp add --transport stdio openschemaextract -- npx -y openschemaextract-mcp

# Then ask Claude:
# "extract schema from https://schema.org/Recipe"
```

## Package Contents

Includes:
- `dist/` — Compiled JavaScript
- `package.json`
- `README.md`

Excludes:
- `src/` (TypeScript source)
- `tsconfig.json`
- Dev dependencies
