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

Deploy your own instance of OpenSchemaExtract with Docker. Everything runs in containers: Next.js app, MongoDB, and OAuth. Perfect for a VPS, home server, or private cloud.

### Prerequisites

- **VPS or server** with Docker and Docker Compose installed
- **Domain name** pointing to your server (optional, but needed for HTTPS and GitHub OAuth)
- **GitHub OAuth App** (for user authentication)

Install Docker if needed:
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in for group changes
```

### Step 1: Clone the Repository

```bash
git clone https://github.com/chat-data-llc/OpenSchemaExtract.git
cd OpenSchemaExtract
```

### Step 2: Create GitHub OAuth App

1. Go to https://github.com/settings/developers → **New OAuth App**
2. Fill in:
   - **Application name**: `OpenSchemaExtract` (or whatever you prefer)
   - **Homepage URL**: `https://your-domain.com` (or `http://localhost:3000` for local testing)
   - **Authorization callback URL**: `https://your-domain.com/api/auth/callback/github`
3. Save your **Client ID** and **Client Secret** for the next step

### Step 3: Configure Environment

```bash
cp .env.production.example .env.production
nano .env.production
```

Fill in your values:

```bash
# Generate secrets with: openssl rand -base64 32
AUTH_SECRET=<your-generated-secret>
OAUTH_JWT_SECRET=<your-generated-secret>

# Your domain (use http://localhost:3000 for local testing)
AUTH_URL=https://your-domain.com
OAUTH_ISSUER=https://your-domain.com

# GitHub OAuth (from Step 2)
AUTH_GITHUB_ID=<your-client-id>
AUTH_GITHUB_SECRET=<your-client-secret>

# MongoDB (leave as-is — docker-compose handles this)
MONGODB_URI=mongodb://mongodb:27017
MONGODB_DB=openschemaextract
```

### Step 4: Deploy

Run the deployment script:

```bash
./deploy.sh
```

Or manually with Docker Compose:

```bash
docker compose up -d --build
```

The script will:
1. Verify Docker is installed
2. Auto-generate `AUTH_SECRET` and `OAUTH_JWT_SECRET` if missing
3. Build the Next.js app in a Docker image
4. Start the app and MongoDB containers
5. Print access URLs

Your app will be available at **http://your-server-ip:3000** 🎉

### Step 5: Set Up HTTPS with Nginx (Recommended for Production)

Install Nginx and Certbot:

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
        proxy_pass http://localhost:3000;
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

Enable the site and get an SSL certificate:

```bash
sudo ln -s /etc/nginx/sites-available/openschemaextract /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.com
```

Certbot will auto-configure HTTPS and set up auto-renewal. 🔒

### Management Commands

```bash
# View logs
docker compose logs -f app

# Restart app
docker compose restart app

# Stop everything
docker compose down

# Stop and delete database (WARNING: destroys data)
docker compose down -v

# Update to latest code
git pull
docker compose up -d --build

# Access MongoDB shell
docker compose exec mongodb mongosh openschemaextract

# Check running containers
docker compose ps
```

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SECRET` | ✅ | NextAuth.js encryption key (generate with `openssl rand -base64 32`) |
| `AUTH_URL` | ✅ | Your full app URL (e.g., `https://your-domain.com`) |
| `AUTH_GITHUB_ID` | ✅ | GitHub OAuth Client ID |
| `AUTH_GITHUB_SECRET` | ✅ | GitHub OAuth Client Secret |
| `OAUTH_ISSUER` | ✅ | OAuth 2.1 issuer URL (usually same as `AUTH_URL`) |
| `OAUTH_JWT_SECRET` | ✅ | JWT signing secret (generate with `openssl rand -base64 32`) |
| `MONGODB_URI` | ✅ | MongoDB connection string (`mongodb://mongodb:27017` for docker-compose) |
| `MONGODB_DB` | ✅ | Database name (default: `openschemaextract`) |

### Troubleshooting

**Build fails with "Module not found: @/components/..."**
- Make sure `tsconfig.json` is intact and includes the `@/*` path alias.

**Tailwind oxide native binding error**
- The Dockerfile uses `npm install --include=optional` to work around a known npm bug with optional dependencies on Alpine Linux.

**GitHub login doesn't work**
- Verify the callback URL in your GitHub OAuth App matches `https://your-domain.com/api/auth/callback/github` exactly.
- Make sure `AUTH_URL` in `.env.production` matches your actual domain.

**"Environment variable not set" warnings**
- Ensure `.env.production` exists and has all the required variables.
- The `docker-compose.yml` uses `env_file: - .env.production` to load them.

**MongoDB connection fails**
- Check that the MongoDB container is running: `docker compose ps`
- View MongoDB logs: `docker compose logs mongodb`

**Port 3000 already in use**
- Change the port in `docker-compose.yml` under the `app` service: `"8080:3000"`

See [DEPLOYMENT.md](./DEPLOYMENT.md) for even more details on backups, monitoring, and advanced configurations.

## Production Notes

- This project fetches user-provided URLs server-side.
- If deploying publicly, add SSRF protections (allowlist or private-address blocking).
- Proxy fallback sends blocked URLs through `https://r.jina.ai/`; avoid passing sensitive URLs/tokens.
- Live integration tests depend on external websites and may be flaky over time.

## License

MIT
