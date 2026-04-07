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

Get an API key from [https://openschemaextract.chat-data.com/dashboard](https://openschemaextract.chat-data.com/dashboard), then call the API:

```bash
curl -H "Authorization: Bearer osx_live_your_key" \
  "https://openschemaextract.chat-data.com/api/extract?url=https://schema.org/Recipe"
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

### 5. Self-Host with Docker

Deploy the full app (Next.js + MongoDB + OAuth) to your own VPS:

```bash
git clone https://github.com/chat-data-llc/OpenSchemaExtract.git
cd OpenSchemaExtract
./deploy.sh
```

The `deploy.sh` script auto-generates secrets, sets up Docker containers, and starts the app on port 3000. See the [Self-Hosting](#self-hosting) section below for the full guide with Nginx, SSL, and troubleshooting.

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

## Self-Hosting

Deploy your own instance of OpenSchemaExtract with Docker. The app runs in a container and connects to an existing MongoDB instance on your server.

### Prerequisites

- **VPS or server** with Docker and Docker Compose installed
- **MongoDB** running (as a container or standalone)
- **Domain name** pointing to your server (for HTTPS and GitHub OAuth)
- **GitHub OAuth App** (for user authentication)

Install Docker if needed:
```bash
curl -fsSL https://get.docker.com | sh
```

### Step 1: Clone the Repository

```bash
git clone https://github.com/chat-data-llc/OpenSchemaExtract.git
cd OpenSchemaExtract
```

### Step 2: Create GitHub OAuth App

1. Go to https://github.com/settings/developers → **New OAuth App**
2. Fill in:
   - **Application name**: `OpenSchemaExtract`
   - **Homepage URL**: `https://your-domain.com`
   - **Authorization callback URL**: `https://your-domain.com/api/auth/callback/github`
3. Save your **Client ID** and **Client Secret** for the next step

### Step 3: Set Up Docker Network

If you have MongoDB running as a Docker container (e.g., named `mongo`), create a shared network so the app can reach it by name:

```bash
sudo docker network create shared
sudo docker network connect shared mongo
```

> If MongoDB is running on the host directly (not in Docker), use `MONGODB_URI=mongodb://host.docker.internal:27017` instead and add `extra_hosts: ["host.docker.internal:host-gateway"]` to `docker-compose.yml`.

### Step 4: Configure Environment

```bash
cp .env.production.example .env.production
nano .env.production
```

Fill in your values:

```bash
# Generate secrets with: openssl rand -base64 32
AUTH_SECRET=<your-generated-secret>
OAUTH_JWT_SECRET=<your-generated-secret>

# Your domain
AUTH_URL=https://your-domain.com
OAUTH_ISSUER=https://your-domain.com

# GitHub OAuth (from Step 2)
AUTH_GITHUB_ID=<your-client-id>
AUTH_GITHUB_SECRET=<your-client-secret>

# MongoDB — use your container name (e.g., "mongo") as the hostname
MONGODB_URI=mongodb://mongo:27017
MONGODB_DB=openschemaextract
```

### Step 5: Deploy

```bash
./deploy.sh
```

Or manually:

```bash
sudo docker compose up -d --build
```

Your app will be available at **http://your-server-ip:3000**

### Step 6: Set Up HTTPS with Nginx (Recommended)

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/openschemaextract`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    client_max_body_size 10M;
}
```

Enable and get SSL:

```bash
sudo ln -s /etc/nginx/sites-available/openschemaextract /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.com
```

### Management Commands

```bash
# View logs
sudo docker compose logs -f app

# Restart app
sudo docker compose restart app

# Stop the app
sudo docker compose down

# Update to latest code
git pull && sudo docker compose up -d --build

# Check running containers
sudo docker compose ps
```

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SECRET` | Yes | NextAuth.js encryption key (`openssl rand -base64 32`) |
| `AUTH_URL` | Yes | Your full app URL (e.g., `https://your-domain.com`) |
| `AUTH_GITHUB_ID` | Yes | GitHub OAuth Client ID |
| `AUTH_GITHUB_SECRET` | Yes | GitHub OAuth Client Secret |
| `OAUTH_ISSUER` | Yes | OAuth 2.1 issuer URL (usually same as `AUTH_URL`) |
| `OAUTH_JWT_SECRET` | Yes | JWT signing secret (`openssl rand -base64 32`) |
| `MONGODB_URI` | Yes | MongoDB connection string (e.g., `mongodb://mongo:27017`) |
| `MONGODB_DB` | Yes | Database name (default: `openschemaextract`) |

### Troubleshooting

**Build fails with "MONGODB_URI environment variable is required"**
- The Dockerfile provides a dummy `MONGODB_URI` at build time. Make sure your Dockerfile hasn't been modified.

**Build fails with "Module not found: @/components/..."**
- Make sure `tsconfig.json` includes the `@/*` path alias. Restore it from git if corrupted.

**Tailwind oxide native binding error**
- The Dockerfile uses `node:20-slim` (Debian) and fresh `npm install` to avoid this. Don't switch to Alpine.

**GitHub login doesn't work**
- Verify the callback URL in your GitHub OAuth App matches `https://your-domain.com/api/auth/callback/github` exactly.
- Make sure `AUTH_URL` in `.env.production` matches your domain.

**MongoDB connection fails**
- Verify your MongoDB container is on the `shared` network: `sudo docker network inspect shared`
- Check MongoDB is running: `sudo docker ps | grep mongo`
- Test connectivity: `sudo docker compose exec app sh -c "curl -s mongo:27017"`

**Port 3000 already in use**
- Change the port mapping in `docker-compose.yml`: `"127.0.0.1:3001:3000"`

See [DEPLOYMENT.md](./DEPLOYMENT.md) for backup, monitoring, and advanced configurations.

## Production Notes

- This project fetches user-provided URLs server-side.
- If deploying publicly, add SSRF protections (allowlist or private-address blocking).
- Proxy fallback sends blocked URLs through `https://r.jina.ai/`; avoid passing sensitive URLs/tokens.
- Live integration tests depend on external websites and may be flaky over time.

## License

MIT
