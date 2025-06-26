#!/bin/bash

echo "🚀 Starting Tea Inventory System on Replit..."

# Use Replit environment if .env files don't exist
if [ ! -f "backend/.env" ] && [ -f "backend/.env.replit" ]; then
  echo "📋 Using Replit environment configuration..."
  cp backend/.env.replit backend/.env
fi

if [ ! -f "frontend/.env" ] && [ -f "frontend/.env.replit" ]; then
  cp frontend/.env.replit frontend/.env
fi

# Install all dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Setup database
echo "🗄️ Setting up database..."
cd backend
npx prisma generate
npx prisma migrate deploy
npx prisma db seed || true

# Build everything
cd ..
echo "🔨 Building application..."
npm run build

# Start both servers
echo "🚀 Starting servers..."
cd backend
npm start &
BACKEND_PID=$!

cd ../frontend
npx serve -s build -l 3000 -n &
FRONTEND_PID=$!

echo "✅ Tea Inventory System is running!"
echo "📱 Frontend: https://$REPL_SLUG.$REPL_OWNER.repl.co"
echo "🔧 Backend API: https://$REPL_SLUG.$REPL_OWNER.repl.co:3001"
echo ""
echo "📝 Default login credentials:"
echo "   Admin: admin@tea.com / admin123"
echo "   Production: production@tea.com / prod123"
echo "   Fulfillment: fulfillment@tea.com / fulfill123"

# Keep script running
wait $BACKEND_PID $FRONTEND_PID