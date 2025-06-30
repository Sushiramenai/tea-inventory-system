import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Helper function to get CORS origin
function getCorsOrigin() {
  // If explicitly set, use that
  if (process.env.CORS_ORIGIN) {
    return process.env.CORS_ORIGIN;
  }
  
  // For Replit, use the REPL_SLUG and REPL_OWNER
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    return `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  }
  
  // Default to localhost for development
  return 'http://localhost:3000';
}

// Helper function to get database URL
function getDatabaseUrl() {
  // If explicitly set, use that
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // For Replit, use SQLite with a file in the project directory
  if (process.env.REPL_SLUG) {
    return 'file:' + path.resolve(process.cwd(), './prisma/dev.db');
  }
  
  // Default SQLite for local development
  return 'file:' + path.resolve(process.cwd(), './prisma/dev.db');
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: getDatabaseUrl(),
  },
  
  session: {
    secret: process.env.SESSION_SECRET || 'your-secret-key-here',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  cors: {
    origin: getCorsOrigin(),
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};