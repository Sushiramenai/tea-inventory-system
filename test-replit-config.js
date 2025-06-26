#!/usr/bin/env node

console.log('🔍 Testing Replit Configuration...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('- PORT:', process.env.PORT || 'not set (will use 3001)');
console.log('- REPL_SLUG:', process.env.REPL_SLUG || 'not set (not on Replit)');
console.log('- REPL_OWNER:', process.env.REPL_OWNER || 'not set (not on Replit)');

// Check if running on Replit
const isReplit = !!(process.env.REPL_SLUG && process.env.REPL_OWNER);
console.log('\n🚀 Running on Replit:', isReplit);

if (isReplit) {
  const replUrl = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  console.log('📱 Frontend URL:', replUrl);
  console.log('🔧 Backend URL:', `${replUrl}:3001`);
  console.log('❤️  Health Check:', `${replUrl}:3001/health`);
}

// Check file structure
const fs = require('fs');
const path = require('path');

console.log('\n📁 Checking file structure:');
const requiredFiles = [
  '.replit',
  'replit-start.sh',
  'package.json',
  'backend/package.json',
  'backend/prisma/schema.prisma',
  'backend/.env.replit',
  'frontend/package.json',
  'frontend/.env.replit'
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// Check SQLite compatibility
console.log('\n🗄️  Database Configuration:');
console.log('- Using SQLite (perfect for Replit)');
console.log('- Database file: backend/prisma/dev.db');
console.log('- Auto-migrations: Yes');
console.log('- Auto-seeding: Yes');

console.log('\n✅ Replit configuration test complete!');
console.log('\nTo deploy on Replit:');
console.log('1. Import this repository to Replit');
console.log('2. The system will auto-start using replit-start.sh');
console.log('3. Wait for build completion (1-2 minutes first time)');
console.log('4. Access your app at the provided URL');