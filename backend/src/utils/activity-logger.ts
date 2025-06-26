import { prisma } from './prisma';

export enum ActivityType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PRODUCTION_START = 'PRODUCTION_START',
  PRODUCTION_COMPLETE = 'PRODUCTION_COMPLETE',
  STOCK_ADJUSTMENT = 'STOCK_ADJUSTMENT'
}

export async function logActivity(
  userId: string,
  type: ActivityType,
  entity: string,
  entityId?: string,
  details?: any
) {
  try {
    // Store in a JSON field in the database
    await prisma.$executeRawUnsafe(`
      INSERT INTO activity_logs (user_id, type, entity, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `, userId, type, entity, entityId || null, JSON.stringify(details || {}));
    
    console.log(`📝 Activity logged: ${type} on ${entity} by user ${userId}`);
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - logging should not break the application
  }
}

// Create activity logs table if it doesn't exist
export async function initActivityLogs() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        entity TEXT NOT NULL,
        entity_id TEXT,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Activity logs table ready');
  } catch (error) {
    console.error('Failed to create activity logs table:', error);
  }
}