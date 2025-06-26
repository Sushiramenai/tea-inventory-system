# 🚀 Tea Inventory System - Complete Deployment Guide

## 📋 Overview
This guide ensures seamless deployment across Local Development, GitHub, and Replit.

## 🏠 Local Development

### Setup
```bash
# Clone the repository
git clone https://github.com/Sushiramenai/tea-inventory-system.git
cd tea-inventory-system

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### Running Locally
```bash
# Option 1: Development mode (with hot reload)
npm run dev

# Option 2: Production mode
npm start
```

## 🌐 Replit Deployment

### Important: Use Production Commands on Replit
**DO NOT use `npm run dev` on Replit!** This is a development command that won't work properly in Replit's environment.

### Correct Way to Run on Replit

1. **Import from GitHub**
   - Go to [Replit](https://replit.com)
   - Click "Create Repl" → "Import from GitHub"
   - Enter: `https://github.com/Sushiramenai/tea-inventory-system`

2. **Run the Application**
   - Click the **Run** button (it will execute `bash deploy.sh`)
   - OR open Shell and type: `npm start`
   - OR open Shell and type: `bash deploy.sh`

### What Happens When You Click Run
The `deploy.sh` script automatically:
1. ✅ Builds the frontend (if needed)
2. ✅ Installs all dependencies
3. ✅ Sets up the database
4. ✅ Compiles TypeScript to JavaScript
5. ✅ Starts the production server

### Common Replit Issues & Solutions

#### ❌ Error: "tsx: not found"
**Cause**: You're trying to run `npm run dev` (development command)
**Solution**: Use `npm start` or click the Run button instead

#### ❌ Error: "Cannot find module"
**Solution**: 
```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
npm start
```

#### ❌ Error: "Database not initialized"
**Solution**: The deploy.sh script handles this automatically. Just click Run.

## 📦 Understanding the Scripts

### Root package.json scripts
- `npm start` - Runs deploy.sh (for production/Replit)
- `npm run dev` - Runs development server (for local only)
- `npm run build` - Builds frontend

### Backend scripts
- `npm run dev` - Uses `npx tsx` (works everywhere)
- `npm run build` - Compiles TypeScript
- `npm start` - Runs compiled JavaScript

## 🔄 Updating the System

### Local Development
```bash
# Make your changes
git add -A
git commit -m "Your changes"
git push origin main
```

### Replit Updates
1. Click the Git icon in Replit
2. Pull latest changes
3. Click Run button to restart

## 🎯 Key Points for Success

### ✅ DO's
- Use `npm start` or Run button on Replit
- Let deploy.sh handle all setup
- Make updates locally and push to GitHub
- Use production build for deployment

### ❌ DON'Ts
- Don't use `npm run dev` on Replit
- Don't manually install packages on Replit
- Don't edit code directly on Replit
- Don't skip the build process

## 🔧 Environment Variables
The system automatically configures these for Replit:
- `NODE_ENV=production`
- `PORT=3001`
- `DATABASE_URL=file:./prisma/dev.db`
- `SESSION_SECRET=tea-inventory-secret-2024`

## 📱 Accessing Your App
Once running on Replit:
1. Look for the Webview panel
2. Or click "Open in new tab" 
3. Default login: `admin` / `admin123`

## 🆘 Troubleshooting Checklist
1. ✓ Using `npm start` not `npm run dev`?
2. ✓ Clicked Run button and waited for completion?
3. ✓ All console messages show "✅" success?
4. ✓ Webview showing the app?

## 💡 Pro Tips
- Always develop locally, deploy to Replit
- Use GitHub as the single source of truth
- The deploy.sh script is your friend - let it work
- Production mode is more stable than development mode

---

**Remember**: Replit = Production Environment. Always use production commands!