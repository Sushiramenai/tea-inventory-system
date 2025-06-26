#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Determine which schema to use based on DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || '';
const isPostgres = databaseUrl.includes('postgresql://') || databaseUrl.includes('postgres://');

const schemaDir = path.join(__dirname, '..', 'prisma');
const targetSchema = path.join(schemaDir, 'schema.prisma');
const sourceSchema = isPostgres 
  ? path.join(schemaDir, 'schema.postgresql.prisma')
  : path.join(schemaDir, 'schema.prisma');

if (isPostgres && fs.existsSync(path.join(schemaDir, 'schema.postgresql.prisma'))) {
  console.log('🐘 Using PostgreSQL schema for Railway deployment');
  const postgresSchema = fs.readFileSync(path.join(schemaDir, 'schema.postgresql.prisma'), 'utf8');
  fs.writeFileSync(targetSchema, postgresSchema);
} else {
  console.log('📦 Using SQLite schema for local development');
  // Schema is already SQLite by default
}

console.log('✅ Prisma schema configured');