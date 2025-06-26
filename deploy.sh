#!/bin/bash

echo "🚀 Starting Tea Inventory System deployment..."

# Build frontend first (one-time)
if [ ! -d "frontend/build" ]; then
  echo "📦 Building frontend (one-time)..."
  cd frontend
  npm install --silent
  npm run build
  cd ..
  echo "✅ Frontend built successfully"
fi

# Start backend only
echo "🔧 Starting backend server..."
cd backend
npm install --silent
npx prisma generate --silent
npx prisma db push --skip-seed
npm run build
npm start