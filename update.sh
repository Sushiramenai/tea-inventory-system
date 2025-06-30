#!/bin/bash

# Tea Inventory System - Update Script
# This script helps you update the system after pulling changes from GitHub

echo "🔄 Updating Tea Inventory System..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
  echo "❌ Error: Must be run from the project root directory"
  echo "📍 Current directory: $(pwd)"
  exit 1
fi

# Pull latest changes from GitHub
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

if [ $? -ne 0 ]; then
  echo "❌ Error: Failed to pull from GitHub"
  echo "💡 Tip: Make sure you've committed or stashed any local changes"
  exit 1
fi

# Update backend dependencies if package.json changed
echo ""
echo "📦 Checking backend dependencies..."
cd backend
if git diff HEAD~1 HEAD --name-only | grep -q "backend/package.json"; then
  echo "📦 Backend package.json changed, installing dependencies..."
  npm install
else
  echo "✅ Backend dependencies up to date"
fi
cd ..

# Update frontend dependencies if package.json changed
echo ""
echo "📦 Checking frontend dependencies..."
cd frontend
if git diff HEAD~1 HEAD --name-only | grep -q "frontend/package.json"; then
  echo "📦 Frontend package.json changed, installing dependencies..."
  npm install
else
  echo "✅ Frontend dependencies up to date"
fi

# Rebuild frontend
echo ""
echo "🔨 Rebuilding frontend..."
rm -rf build
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Error: Frontend build failed"
  exit 1
fi

cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Update complete!"
echo ""
echo "📋 Next steps:"
echo "1. Stop the current app (click Stop button)"
echo "2. Start the app again (click Run button)"
echo "   OR run: bash deploy.sh"
echo ""
echo "🚀 Your app will be ready with all the latest updates!"