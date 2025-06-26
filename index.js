// Main entry point for Replit deployment
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Tea Inventory System...\n');

// Check if we're in development or production
const isDevelopment = process.env.NODE_ENV !== 'production';

async function startSystem() {
  try {
    // Check if this is first run by looking for node_modules
    const backendModulesExist = fs.existsSync('./backend/node_modules');
    const frontendModulesExist = fs.existsSync('./frontend/node_modules');
    const frontendBuildExists = fs.existsSync('./frontend/build');
    
    if (!backendModulesExist || !frontendModulesExist) {
      console.log('📦 First time setup detected. Installing dependencies...');
      console.log('This may take a few minutes...\n');
      
      // Install root dependencies
      await runCommand('npm', ['install']);
      
      // Install backend dependencies
      if (!backendModulesExist) {
        console.log('📦 Installing backend dependencies...');
        await runCommand('npm', ['install'], { cwd: './backend' });
      }
      
      // Install frontend dependencies
      if (!frontendModulesExist) {
        console.log('📦 Installing frontend dependencies...');
        await runCommand('npm', ['install'], { cwd: './frontend' });
      }
    }
    
    // Build frontend if not built
    if (!frontendBuildExists) {
      console.log('🔨 Building frontend (this takes ~2-3 minutes)...');
      await runCommand('npm', ['run', 'build'], { cwd: './frontend' });
      console.log('✅ Frontend built successfully!\n');
    }
    
    // Set up database
    console.log('🗄️  Setting up database...');
    
    // Ensure database directory exists
    if (!fs.existsSync('./backend/prisma')) {
      fs.mkdirSync('./backend/prisma', { recursive: true });
    }
    
    // Generate Prisma client
    await runCommand('npx', ['prisma', 'generate'], { cwd: './backend' });
    
    // Push database schema
    await runCommand('npx', ['prisma', 'db', 'push'], { cwd: './backend' });
    
    // Seed database if empty
    try {
      await runCommand('npx', ['prisma', 'db', 'seed'], { cwd: './backend' });
      console.log('✅ Database seeded with sample data\n');
    } catch (error) {
      console.log('ℹ️  Database already seeded\n');
    }
    
    // Build backend TypeScript
    if (!fs.existsSync('./backend/dist')) {
      console.log('🔨 Building backend...');
      await runCommand('npm', ['run', 'build'], { cwd: './backend' });
    }
    
    // Start the backend server
    console.log('✅ Starting server...\n');
    
    // Set environment variables
    process.env.NODE_ENV = 'production';
    process.env.PORT = process.env.PORT || '3001';
    process.env.DATABASE_URL = 'file:./prisma/dev.db';
    process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';
    process.env.CORS_ORIGIN = '*'; // Allow all origins in Replit
    
    // Change to backend directory and start server
    process.chdir('./backend');
    require('./dist/server.js');
    
  } catch (error) {
    console.error('❌ Error starting system:', error);
    
    // Try fallback to simple server
    console.log('\n🔄 Trying simplified server...');
    try {
      process.chdir(path.join(__dirname, 'backend'));
      require('./server-simple.js');
    } catch (fallbackError) {
      console.error('❌ Fallback failed:', fallbackError);
      process.exit(1);
    }
  }
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed: ${command} ${args.join(' ')}`));
      } else {
        resolve();
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

// Start the system
console.log('═'.repeat(50));
console.log('🍵 TEA INVENTORY MANAGEMENT SYSTEM');
console.log('═'.repeat(50));
console.log('\nInitializing...\n');

startSystem();