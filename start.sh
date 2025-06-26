#!/bin/bash

echo "🚀 Starting Tea Inventory System on Replit..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing root dependencies..."
  npm install
fi

# Backend setup
cd backend

if [ ! -d "node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  npm install
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Seed database if empty
echo "🌱 Checking database seed..."
npx prisma db seed || true

# Build backend
echo "🔨 Building backend..."
npm run build

# Start backend in background
echo "🚀 Starting backend server..."
npm start &
BACKEND_PID=$!

# Frontend setup
cd ../frontend

if [ ! -d "node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  npm install
fi

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Start frontend
echo "🚀 Starting frontend server..."
npx serve -s build -l 3000 &
FRONTEND_PID=$!

# Keep script running
echo "✅ Tea Inventory System is running!"
echo "📱 Frontend: http://0.0.0.0:3000"
echo "🔧 Backend API: http://0.0.0.0:3001"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID