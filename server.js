// Replit entry point - simplified version
const { spawn } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting Tea Inventory System on Replit...\n');

async function startSystem() {
  try {
    // Set environment variables
    process.env.NODE_ENV = 'production';
    process.env.PORT = process.env.PORT || '3001';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./backend/prisma/dev.db';
    process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'replit-default-secret-change-in-production';
    process.env.CORS_ORIGIN = process.env.REPLIT_URL || 'http://localhost:3000';

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

    // Check if frontend is built
    if (!fs.existsSync('./frontend/build')) {
      console.log('🔨 Building frontend (this may take a few minutes)...');
      try {
        await runCommand('npm', ['run', 'build'], { cwd: './frontend' });
        console.log('✅ Frontend built successfully!');
      } catch (error) {
        console.log('⚠️  Frontend build failed. The backend API will still work.');
        console.log('   To use the UI, you may need to fix the build errors.');
      }
    }

    // Ensure database directory exists
    if (!fs.existsSync('./backend/prisma')) {
      fs.mkdirSync('./backend/prisma', { recursive: true });
    }

    // Generate Prisma client
    console.log('🗄️  Setting up database...');
    await runCommand('npx', ['prisma', 'generate'], { cwd: './backend' });
    
    // Setup database
    try {
      await runCommand('npx', ['prisma', 'db', 'push', '--skip-seed'], { cwd: './backend' });
    } catch (error) {
      console.log('⚠️  Database setup had issues, but continuing...');
    }

    // Seed database if needed
    try {
      const userCount = await checkUserCount();
      if (userCount === 0) {
        console.log('📝 Seeding initial users...');
        await runCommand('npx', ['prisma', 'db', 'seed'], { cwd: './backend' });
      }
    } catch (error) {
      console.log('⚠️  Could not check/seed users, but continuing...');
    }

    // Start the backend server using the simplified version
    console.log('✅ Starting backend server...\n');
    require('./backend/server-simple.js');
    
    console.log('\n✨ Tea Inventory System is ready!');
    console.log(`🌐 Access your app at: ${process.env.REPLIT_URL || 'http://localhost:3001'}`);
    console.log('\n📝 Default login credentials:');
    console.log('   Admin - Username: admin, Password: admin123');
    console.log('   Fulfillment - Username: fulfillment, Password: fulfillment123');
    console.log('   Production - Username: production, Password: production123');
    console.log('\n⚠️  Remember to change these passwords!\n');

  } catch (error) {
    console.error('❌ Error starting system:', error);
    console.error('\nTrying to start backend directly...');
    
    // Try to start the backend directly as a fallback
    try {
      require('./backend/server-simple.js');
    } catch (fallbackError) {
      console.error('❌ Failed to start backend:', fallbackError);
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

    proc.on('error', reject);
  });
}

async function checkUserCount() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const count = await prisma.user.count();
    await prisma.$disconnect();
    return count;
  } catch (error) {
    await prisma.$disconnect();
    throw error;
  }
}

// Start the system
startSystem().catch(console.error);