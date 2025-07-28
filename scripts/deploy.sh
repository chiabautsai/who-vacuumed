#!/bin/bash

# Deployment script for Who Vacuumed app
set -e

echo "🚀 Starting deployment..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please copy .env.production to .env.local and configure your environment variables."
    exit 1
fi

# Check required environment variables
required_vars=("AUTH0_SECRET" "AUTH0_DOMAIN" "AUTH0_CLIENT_ID" "AUTH0_CLIENT_SECRET" "APP_BASE_URL")
for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env.local; then
        echo "❌ Error: Required environment variable $var not found in .env.local"
        exit 1
    fi
done

# Create data directory if it doesn't exist
mkdir -p data

# Initialize database if it doesn't exist
if [ ! -f data/chore-system.db ]; then
    echo "📊 Initializing database..."
    npm run db:init
fi

# Build and start services
echo "🏗️  Building Docker images..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

echo "🔄 Starting services..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

# Health check
echo "🏥 Performing health check..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Deployment successful! App is running at http://localhost:3000"
else
    echo "❌ Health check failed. Check logs with: docker-compose logs"
    exit 1
fi

echo "📋 Useful commands:"
echo "  View logs: docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
echo "  Stop services: docker-compose -f docker-compose.yml -f docker-compose.prod.yml down"
echo "  Restart: docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart"