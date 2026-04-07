#!/bin/bash

# OpenSchemaExtract - One-Command Deployment Script
# Usage: ./deploy.sh

set -e

# Use sudo for docker commands if the current user isn't in the docker group
DOCKER="docker"
if ! docker info &> /dev/null; then
    DOCKER="sudo docker"
fi

echo "🚀 OpenSchemaExtract Deployment Script"
echo "======================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed."
    echo "Install Docker with: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# Check if Docker Compose is installed
if ! $DOCKER compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed."
    echo "Install Docker Compose plugin with: sudo apt-get install docker-compose-plugin"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "⚠️  .env.production not found"
    echo ""
    echo "Creating from .env.production.example..."
    cp .env.production.example .env.production

    # Generate secrets
    AUTH_SECRET=$(openssl rand -base64 32)
    OAUTH_JWT_SECRET=$(openssl rand -base64 32)

    # Update secrets in .env.production
    sed -i "s|your-auth-secret-here|$AUTH_SECRET|g" .env.production
    sed -i "s|your-oauth-jwt-secret-here|$OAUTH_JWT_SECRET|g" .env.production

    echo "✅ Generated AUTH_SECRET and OAUTH_JWT_SECRET"
    echo ""
    echo "⚠️  IMPORTANT: You need to configure the following in .env.production:"
    echo ""
    echo "   1. AUTH_URL=https://your-domain.com"
    echo "   2. OAUTH_ISSUER=https://your-domain.com"
    echo "   3. AUTH_GITHUB_ID=your_github_oauth_app_id"
    echo "   4. AUTH_GITHUB_SECRET=your_github_oauth_app_secret"
    echo ""
    echo "Create a GitHub OAuth App at: https://github.com/settings/developers"
    echo "Callback URL: https://your-domain.com/api/auth/callback/github"
    echo ""
    read -p "Press Enter after updating .env.production to continue..."
fi

echo "📋 Current configuration:"
echo "------------------------"
grep -v "SECRET" .env.production | grep -v "^#" | grep -v "^$"
echo "------------------------"
echo ""

# Confirm deployment
read -p "🤔 Deploy with this configuration? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🏗️  Building Docker images..."
$DOCKER compose build

echo ""
echo "🚀 Starting services..."
$DOCKER compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if $DOCKER compose ps | grep -q "Up\|running"; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "🎉 OpenSchemaExtract is now running!"
    echo ""
    echo "📍 Access your app at:"
    echo "   - Local: http://localhost:3000"
    echo "   - API: http://localhost:3000/api/extract"
    echo ""
    echo "📊 Useful commands:"
    echo "   - View logs: $DOCKER compose logs -f app"
    echo "   - Stop app: $DOCKER compose down"
    echo "   - Restart: $DOCKER compose restart app"
    echo ""
    echo "📖 See DEPLOYMENT.md for Nginx/SSL setup"
else
    echo ""
    echo "❌ Deployment failed!"
    echo ""
    echo "Check logs with: $DOCKER compose logs app"
    exit 1
fi
