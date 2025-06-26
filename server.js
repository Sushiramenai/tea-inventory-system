// Replit entry point - serves both frontend and backend
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Tea Inventory System on Replit...\n');

// Check if we need to install dependencies
const fs = require('fs');

async function startSystem() {
  try {
    // Check if backend dependencies are installed
    if (!fs.existsSync('./backend/node_modules')) {
      console.log('📦 Installing backend dependencies...');
      await runCommand('npm', ['install'], { cwd: './backend' });
    }

    // Check if frontend dependencies are installed
    if (!fs.existsSync('./frontend/node_modules')) {
      console.log('📦 Installing frontend dependencies...');
      await runCommand('npm', ['install'], { cwd: './frontend' });
    }

    // Build frontend if not built
    if (!fs.existsSync('./frontend/build')) {
      console.log('🔨 Building frontend...');
      await runCommand('npm', ['run', 'build'], { cwd: './frontend' });
    }

    // Ensure SQLite database directory exists
    if (!fs.existsSync('./backend/prisma')) {
      fs.mkdirSync('./backend/prisma', { recursive: true });
    }

    // Generate Prisma client
    console.log('🗄️  Setting up database...');
    await runCommand('npx', ['prisma', 'generate'], { cwd: './backend' });
    
    // Run migrations
    await runCommand('npx', ['prisma', 'migrate', 'deploy'], { cwd: './backend' });
    
    // Seed database if empty
    await runCommand('npx', ['prisma', 'db', 'seed'], { cwd: './backend' });

    // Start the backend server
    console.log('✅ Starting backend server...\n');
    
    // Set environment variables for Replit
    process.env.NODE_ENV = 'production';
    process.env.PORT = process.env.PORT || '3001';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';
    process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'replit-default-secret-change-in-production';
    process.env.CORS_ORIGIN = process.env.REPLIT_URL || 'http://localhost:3000';
    
    // Start backend
    require('./backend/dist/server.js');
    
    console.log('\n✨ Tea Inventory System is ready!');
    console.log(`🌐 Access your app at: ${process.env.REPLIT_URL || 'http://localhost:3001'}`);
    console.log('\n📝 Default login credentials:');
    console.log('   Admin - Username: admin, Password: admin123');
    console.log('   Fulfillment - Username: fulfillment, Password: fulfillment123');
    console.log('   Production - Username: production, Password: production123');
    console.log('\n⚠️  Remember to change these passwords!\n');

  } catch (error) {
    console.error('❌ Error starting system:', error);
    process.exit(1);
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

    proc.on('error', reject);
  });
}

// Start the system
startSystem().catch(console.error);