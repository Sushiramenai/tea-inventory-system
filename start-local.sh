#!/bin/bash

# Local Development Startup Script
echo "🍵 Starting Tea Inventory System (Local Development)"
echo "==================================================="

# Check for node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Check for .env files
if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env not found. Using defaults..."
fi

if [ ! -f "frontend/.env" ]; then
    echo "⚠️  frontend/.env not found. Using defaults..."
fi

# Initialize database if needed
if [ ! -f "backend/prisma/dev.db" ]; then
    echo "🗄️  Initializing database..."
    cd backend
    npx prisma migrate deploy
    npx prisma db seed
    cd ..
fi

# Start both services
echo "🚀 Starting services..."
echo "   Backend will run on: http://localhost:3001"
echo "   Frontend will run on: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Use npm-run-all or concurrently if available, otherwise use basic approach
if command -v concurrently &> /dev/null; then
    concurrently "cd backend && npm run dev" "cd frontend && npm start"
else
    # Fallback: run in background
    cd backend && npm run dev &
    BACKEND_PID=$!
    cd ../frontend && npm start &
    FRONTEND_PID=$!
    
    # Wait for Ctrl+C
    trap "kill $BACKEND_PID $FRONTEND_PID" INT
    wait
fi