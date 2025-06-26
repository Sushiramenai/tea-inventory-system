#!/bin/bash

echo "🚀 Starting Tea Inventory System deployment..."
echo "📍 Current directory: $(pwd)"

# Error handling
set -e
trap 'echo "❌ Error occurred. Check the logs above for details."' ERR

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
  echo "❌ Error: backend or frontend directory not found!"
  echo "📁 Current directory contents:"
  ls -la
  exit 1
fi

# Build frontend first (one-time)
if [ ! -d "frontend/build" ]; then
  echo "📦 Building frontend (one-time setup)..."
  cd frontend
  echo "📦 Installing frontend dependencies..."
  npm install
  echo "🔨 Building frontend..."
  npm run build
  cd ..
  echo "✅ Frontend built successfully!"
else
  echo "✅ Frontend already built, skipping..."
fi

# Setup and start backend
echo "🔧 Setting up backend server..."
cd backend

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install

# Setup database
echo "🗄️ Setting up database..."
npx prisma generate
npx prisma db push

# Seed database if empty
echo "🌱 Checking database seed..."
npx prisma db seed || echo "Database already seeded"

# Build TypeScript
echo "🔨 Building backend..."
npm run build

# Start server
echo "✨ Starting server..."
echo "🌐 Your app will be available at the URL shown in Replit"
echo "📝 Default login: admin / admin123"
npm start