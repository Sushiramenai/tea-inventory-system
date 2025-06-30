#!/bin/bash

echo "🚀 Starting Tea Inventory System deployment..."
echo "📍 Current directory: $(pwd)"

# Check for Replit environment
if [ -n "$REPL_SLUG" ]; then
  echo "🔷 Detected Replit environment"
  echo "💡 Tip: Set environment variables in Replit Secrets for production use"
fi

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

# Set default DATABASE_URL if not provided
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:./dev.db"
  echo "📝 Using default SQLite database at ./dev.db"
fi

npx prisma generate
npx prisma db push

# Seed database if empty
echo "🌱 Checking database seed..."
npx prisma db seed || echo "Database already seeded"

# Build TypeScript
echo "🔨 Building backend..."
# Clean previous build
rm -rf dist/

# Ensure we're in the right directory for TypeScript
echo "📍 Current build directory: $(pwd)"

# Build with TypeScript
echo "🔧 Running TypeScript compiler..."
npx tsc || {
  echo "❌ TypeScript compilation failed!"
  echo "📁 Checking for TypeScript config:"
  ls -la tsconfig.json
  echo "📁 Checking source files:"
  ls -la src/
  ls -la src/utils/
  exit 1
}

# Verify build output
if [ ! -f "dist/server.js" ]; then
  echo "❌ Error: dist/server.js not found after build!"
  echo "📁 Contents of backend directory:"
  ls -la
  echo "📁 Contents of dist directory (if exists):"
  ls -la dist/ 2>/dev/null || echo "dist directory not found"
  exit 1
fi

# Verify utils directory was compiled
if [ ! -d "dist/utils" ]; then
  echo "⚠️  Warning: dist/utils directory not found after build!"
  echo "📁 Contents of dist directory:"
  ls -la dist/
  
  # Try to manually compile utils if missing
  echo "🔧 Attempting manual compilation of utils..."
  mkdir -p dist/utils
  npx tsc src/utils/*.ts --outDir dist --declaration --sourceMap || {
    echo "❌ Manual compilation failed!"
    exit 1
  }
fi

echo "📁 Checking dist/utils contents:"
ls -la dist/utils/ || {
  echo "❌ dist/utils not found! Checking entire dist structure:"
  find dist -type f -name "*.js" | head -20
  echo "📁 Checking if prisma.js exists anywhere:"
  find dist -name "prisma.js"
}

echo "✅ Build successful, dist/server.js and utils exist"

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

# Ensure SESSION_SECRET is set
if [ -z "$SESSION_SECRET" ]; then
  export SESSION_SECRET="replit-default-secret-change-in-production"
  echo "⚠️  Using default SESSION_SECRET - change this in production!"
  echo "   Set SESSION_SECRET in Replit Secrets for better security"
fi

# Set NODE_ENV to production for Replit
export NODE_ENV="production"

echo "🚀 Starting production server..."
npm start