# Publishing OpenSchemaExtract to npm

## Prerequisites

1. **npm account**: Create one at https://www.npmjs.com/signup
2. **Login locally**: `npm login`
3. **Verify name is available**: `npm search openschemaextract` (should show no results if name is free)

## Pre-publish Checklist

- [ ] Update version in `package.json` (use semantic versioning)
- [ ] Build the package: `npm run build:pkg`
- [ ] Run tests: `npm test`
- [ ] Verify type-checking: `npx tsc --noEmit`
- [ ] Preview package contents: `npm pack --dry-run`
- [ ] Update README.md if needed
- [ ] Commit all changes to git

## Publishing

### First-time publish

```bash
npm publish --access public
```

### Subsequent updates

1. Update version:
   ```bash
   npm version patch  # for bug fixes (1.0.0 -> 1.0.1)
   npm version minor  # for new features (1.0.0 -> 1.1.0)
   npm version major  # for breaking changes (1.0.0 -> 2.0.0)
   ```

2. Rebuild:
   ```bash
   npm run build:pkg
   ```

3. Publish:
   ```bash
   npm publish
   ```

4. Push git tags:
   ```bash
   git push --follow-tags
   ```

## Post-publish

- Verify on npm: https://www.npmjs.com/package/openschemaextract
- Test installation: `npm install openschemaextract` in a fresh directory
- Create a GitHub release matching the npm version

## Unpublish (emergency only)

```bash
npm unpublish openschemaextract@1.0.0  # Specific version
```

**Note**: You can only unpublish within 72 hours, and it's strongly discouraged. Use `npm deprecate` instead for marking versions as deprecated.

## Package Contents

The published package includes:
- `dist/` — Compiled JavaScript (CJS + ESM) and TypeScript definitions
- `src/` — Original TypeScript source files
- `README.md` — Documentation
- `LICENSE` — MIT license
- `package.json` — Package metadata

The package **excludes** (via `.npmignore`):
- Next.js app files (`app/`, `components/`, `public/`)
- Development files (`.env`, `.next/`, `node_modules/`)
- Tests and config files
