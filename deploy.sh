#!/bin/bash

# Tea Inventory System Deployment Script
# This script helps deploy the system to production

echo "🍵 Tea Inventory System Deployment"
echo "=================================="

# Check if .env files exist
if [ ! -f backend/.env ]; then
    echo "❌ backend/.env file not found!"
    echo "Please create it from .env.example"
    exit 1
fi

if [ ! -f frontend/.env ]; then
    echo "❌ frontend/.env file not found!"
    echo "Please create it from .env.example"
    exit 1
fi

# Load environment variables
export $(cat backend/.env | grep -v '^#' | xargs)
export $(cat frontend/.env | grep -v '^#' | xargs)

# Build and start with Docker Compose
echo "🔨 Building Docker images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

echo "✅ Deployment complete!"
echo ""
echo "Services running at:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:3001"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"