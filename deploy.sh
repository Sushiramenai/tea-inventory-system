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

# Install dependencies (including devDependencies for TypeScript)
echo "📦 Installing backend dependencies..."
npm install --production=false

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

# Verify build output
if [ ! -f "dist/server.js" ]; then
  echo "❌ Error: dist/server.js not found after build!"
  echo "📁 Contents of backend directory:"
  ls -la
  echo "📁 Contents of dist directory (if exists):"
  ls -la dist/ 2>/dev/null || echo "dist directory not found"
  exit 1
fi

echo "✅ Build successful, dist/server.js exists"

# Copy frontend build to where backend expects it
echo "📦 Setting up frontend for production..."
if [ -d "../frontend/build" ]; then
  # Ensure the backend can find frontend files
  echo "✅ Frontend build found at ../frontend/build"
else
  echo "⚠️  Warning: Frontend build not found at ../frontend/build"
fi

# Start server
echo "✨ Starting server..."
echo "🌐 Your app will be available at the URL shown in Replit"
echo "📝 Default login: admin / admin123"
echo "📍 Starting from directory: $(pwd)"
npm start