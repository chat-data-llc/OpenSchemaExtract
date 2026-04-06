# Deployment Guide

Deploy OpenSchemaExtract to your VPS with Docker in minutes.

## Prerequisites

- A VPS with Docker and Docker Compose installed
- A domain pointing to your VPS (e.g., `openschemaextract.com`)
- GitHub OAuth App credentials

## Quick Start (One Command)

```bash
# Clone and deploy
git clone https://github.com/chat-data-llc/OpenSchemaExtract.git && \
cd OpenSchemaExtract && \
cp .env.production.example .env.production && \
nano .env.production && \
docker-compose up -d
```

That's it! Your app will be running on `http://your-vps-ip:3000`

## Detailed Setup

### 1. Install Docker (if not already installed)

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

Log out and back in for group changes to take effect.

### 2. Clone the Repository

```bash
git clone https://github.com/chat-data-llc/OpenSchemaExtract.git
cd OpenSchemaExtract
```

### 3. Configure Environment Variables

```bash
# Copy the example file
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

Required values:

```bash
# Generate secrets
AUTH_SECRET=$(openssl rand -base64 32)
OAUTH_JWT_SECRET=$(openssl rand -base64 32)

# Your domain
AUTH_URL=https://openschemaextract.com
OAUTH_ISSUER=https://openschemaextract.com

# GitHub OAuth (create at https://github.com/settings/developers)
AUTH_GITHUB_ID=your_client_id
AUTH_GITHUB_SECRET=your_client_secret
```

### 4. Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: OpenSchemaExtract
   - **Homepage URL**: `https://your-domain.com`
   - **Authorization callback URL**: `https://your-domain.com/api/auth/callback/github`
4. Copy the Client ID and Client Secret to `.env.production`

### 5. Deploy

```bash
# Build and start services
docker-compose up -d

# Check logs
docker-compose logs -f app

# Check status
docker-compose ps
```

Your app is now running on port 3000!

## Production Setup with Nginx (Recommended)

### Install Nginx

```bash
sudo apt-get update
sudo apt-get install nginx certbot python3-certbot-nginx
```

### Configure Nginx

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

        # Increase timeout for long-running requests
        proxy_read_timeout 90;
    }

    # Increase max upload size if needed
    client_max_body_size 10M;
}
```

### Enable site and get SSL certificate

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/openschemaextract /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate (Let's Encrypt)
sudo certbot --nginx -d your-domain.com
```

Certbot will automatically configure HTTPS and redirect HTTP to HTTPS.

## Management Commands

```bash
# View logs
docker-compose logs -f app

# Restart app
docker-compose restart app

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database)
docker-compose down -v

# Update to latest code
git pull
docker-compose up -d --build

# View MongoDB data
docker-compose exec mongodb mongosh openschemaextract
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `AUTH_SECRET` | NextAuth.js secret key | Generate with `openssl rand -base64 32` |
| `AUTH_URL` | Your production URL | `https://openschemaextract.com` |
| `AUTH_GITHUB_ID` | GitHub OAuth Client ID | From GitHub OAuth App |
| `AUTH_GITHUB_SECRET` | GitHub OAuth Client Secret | From GitHub OAuth App |
| `OAUTH_ISSUER` | OAuth 2.1 issuer URL | Same as `AUTH_URL` |
| `OAUTH_JWT_SECRET` | JWT signing secret | Generate with `openssl rand -base64 32` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://mongodb:27017` (docker-compose) |
| `MONGODB_DB` | Database name | `openschemaextract` |

## Troubleshooting

### Can't connect to MongoDB

```bash
# Check if MongoDB is running
docker-compose ps

# Check MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### GitHub OAuth not working

1. Verify callback URL in GitHub OAuth App matches: `https://your-domain.com/api/auth/callback/github`
2. Check `AUTH_URL` in `.env.production` matches your domain
3. Ensure `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` are correct

### Port 3000 already in use

```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill the process or change port in docker-compose.yml
```

### App won't start

```bash
# Check app logs
docker-compose logs app

# Common issues:
# - Missing environment variables
# - MongoDB not ready (wait 10 seconds and retry)
# - Port conflicts
```

## Monitoring

### Check app health

```bash
# Test API
curl http://localhost:3000/api/extract?url=https://schema.org/Recipe

# Check OAuth metadata
curl http://localhost:3000/.well-known/oauth-authorization-server
```

### Resource usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

## Backup

### Backup MongoDB

```bash
# Create backup
docker-compose exec mongodb mongodump --db openschemaextract --out /tmp/backup
docker cp $(docker-compose ps -q mongodb):/tmp/backup ./backup-$(date +%Y%m%d)

# Restore backup
docker cp ./backup-20240101 $(docker-compose ps -q mongodb):/tmp/restore
docker-compose exec mongodb mongorestore --db openschemaextract /tmp/restore/openschemaextract
```

## Security Notes

- Always use HTTPS in production (via Nginx + Certbot)
- Keep secrets secure - never commit `.env.production` to git
- Regularly update Docker images: `docker-compose pull && docker-compose up -d`
- Set up firewall rules to restrict access to MongoDB port (27017)
- Monitor logs for suspicious activity

## Performance Tuning

### For high traffic:

1. **Increase container resources** in `docker-compose.yml`:
   ```yaml
   app:
     deploy:
       resources:
         limits:
           cpus: '2'
           memory: 2G
   ```

2. **Enable MongoDB connection pooling** (already configured in code)

3. **Use a CDN** for static assets

4. **Add Redis caching** for API responses (future enhancement)

## Support

For issues or questions:
- GitHub Issues: https://github.com/chat-data-llc/OpenSchemaExtract/issues
- Documentation: https://github.com/chat-data-llc/OpenSchemaExtract

## License

MIT
