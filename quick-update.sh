#!/bin/bash

# Quick Update - Just rebuild frontend (use when only frontend code changed)

echo "⚡ Quick Frontend Update"
echo "━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -d "frontend/build" ]; then
  echo "📦 No build folder found, running full build..."
else
  echo "🗑️  Removing old build..."
  rm -rf frontend/build
fi

echo "🔨 Building frontend..."
cd frontend && npm run build && cd ..

if [ $? -eq 0 ]; then
  echo "✅ Frontend updated successfully!"
  echo "🔄 Restart your app to see changes"
else
  echo "❌ Build failed - check the errors above"
fi